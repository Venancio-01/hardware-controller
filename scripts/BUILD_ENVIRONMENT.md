# Node Switch 构建环境文档

## 目标部署环境

### 硬件规格
- **开发板**: Orange Pi One
- **架构**: ARM v7l (32位)
- **SoC**: Allwinner H3
- **CPU**: 4x Cortex-A7 @ 1.4GHz
- **内存**: 512MB DDR3
- **存储**: microSD 卡插槽

### 系统环境
- **操作系统**: Ubuntu for ARM (推荐 Ubuntu 20.04 LTS 或 22.04 LTS)
- **内核**: Linux 5.x 或更高
- **Node.js 版本**: 20.x 或 22.x (ARM v7l 版本)
- **包管理器**: npm 或 pnpm

---

## 构建环境要求

### 开发机环境（x86_64）
构建过程使用 Docker 交叉编译，因此开发机需要以下环境：

#### 必需软件
1. **Docker**
   - 版本: 20.10.0 或更高
   - 需要 Docker Buildx 支持
   - 安装命令:
     ```bash
     # Ubuntu/Debian
     curl -fsSL https://get.docker.com | sh
     sudo usermod -aG docker $USER
     ```

2. **Docker Buildx**
   - 通常随 Docker 20.10+ 自动安装
   - 验证命令:
     ```bash
     docker buildx version
     ```

3. **QEMU 用户模式模拟器**
   - 用于 ARM 指令集模拟
   - 通过 Docker 自动配置
   - 手动安装（可选）:
     ```bash
     # Ubuntu/Debian
     sudo apt-get install qemu-user-static
     ```

#### 可选工具
- **make**: 构建工具
- **bash**: 4.0+ (脚本执行)

---

## 构建流程说明

### 1. 构建架构

```
开发机 (x86_64)          Docker 容器 (ARM v7 模拟)    目标设备 (Orange Pi)
     │                          │                          │
     │  docker buildx           │                          │
     ├─────────────────────────>│                          │
     │  (使用 QEMU 模拟)        │                          │
     │                          │                          │
     │                          │  交叉编译                │
     │                          ├─────────────────────────>│
     │                          │  - TypeScript -> JS     │
     │                          │  - serialport 原生模块   │
     │                          │                          │
     │  提取构建产物            │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  tar.gz 打包             │                          │
     │                          │                          │
     │  部署到目标设备          │                          │
     ├────────────────────────────────────────────────────>│
```

### 2. 构建步骤详解

#### 阶段 1: 环境检查
```bash
./scripts/build-arm7-plain.sh
```

脚本会自动检查：
- Docker 是否安装
- Docker Buildx 是否可用
- QEMU ARM 支持是否配置

#### 阶段 2: QEMU 配置
- 检测 `linux/arm` 平台支持
- 如需要，自动配置 QEMU binfmt:
  ```bash
  docker run --privileged --rm tonistiigi/binfmt --install arm
  ```

#### 阶段 3: Docker 镜像构建
使用 `Dockerfile.build-plain` 进行多阶段构建：

**基础镜像**:
```dockerfile
FROM --platform=linux/arm/v7 node:20-slim AS builder
```

**构建工具安装**:
```dockerfile
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
```

**依赖安装流程**:
1. 安装 pnpm 包管理器
2. 复制 package.json 文件
3. 安装所有依赖（包括 serialport 原生模块）
4. 编译 serialport 的 ARM 版本

**TypeScript 编译**:
```bash
# 编译顺序很重要（依赖关系）
pnpm --filter shared build
pnpm --filter core build
pnpm --filter backend build
pnpm --filter frontend build
```

#### 阶段 4: 产物整理
```dockerfile
# 移动构建产物
RUN mv packages/backend/dist backend \
    && mv packages/core/dist core \
    && mv packages/shared/dist shared \
    && mv packages/frontend/dist public

# 清理开发依赖
RUN CI=true pnpm prune --prod
RUN pnpm install --prod --frozen-lockfile
```

#### 阶段 5: 提取和打包
从 Docker 容器提取文件到 `dist/` 目录：
```
dist/node-switch-v1.0.0-arm7-plain/
├── app/
│   ├── backend/       # 后端 JavaScript 代码
│   ├── core/          # 核心逻辑代码
│   ├── shared/        # 共享模块
│   ├── node_modules/  # 生产依赖
│   └── loader.js      # 应用入口
├── public/            # 前端静态资源
├── start.sh           # 启动脚本
└── config.json5       # 配置文件
```

最终打包为：`dist/node-switch-v1.0.0-arm7-plain.tar.gz`

---

## 部署步骤

### 1. 传输到 Orange Pi

```bash
# 方法 1: 使用 scp
scp dist/node-switch-v1.0.0-arm7-plain.tar.gz user@orangepi:/home/user/

# 方法 2: 使用 rsync
rsync -avz dist/node-switch-v1.0.0-arm7-plain.tar.gz user@orangepi:/home/user/

# 方法 3: 直接在设备上下载（如果有网络）
ssh user@orangepi
wget http://your-server/node-switch-v1.0.0-arm7-plain.tar.gz
```

### 2. 在 Orange Pi 上解压和安装

```bash
# SSH 登录到 Orange Pi
ssh user@orangepi

# 解压
tar -xzf node-switch-v1.0.0-arm7-plain.tar.gz
cd node-switch-v1.0.0-arm7-plain

# 检查 Node.js 版本
node --version  # 应该是 v20.x 或 v22.x

# 如果没有安装 Node.js，使用以下命令安装：
# Ubuntu/Debian ARM
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 配置应用

```bash
# 编辑配置文件
nano config.json5

# 或复制示例配置
cp .env.example .env
nano .env
```

关键配置项：
```json5
{
  port: 3000,              // 服务端口
  serialPort: "/dev/ttyUSB0", // 串口设备
  baudRate: 9600,           // 波特率
  // ... 其他配置
}
```

### 4. 启动应用

```bash
# 使用系统 Node.js（如果已安装）
./start.sh start

# 或指定自定义 Node.js 路径
NODE_BIN=/usr/local/bin/node ./start.sh start

# 查看状态
./start.sh status

# 查看日志
./start.sh logs

# 停止应用
./start.sh stop

# 重启应用
./start.sh restart
```

### 5. 设置开机自启（可选）

#### 方法 1: 使用 systemd

创建服务文件：
```bash
sudo nano /etc/systemd/system/node-switch.service
```

内容：
```ini
[Unit]
Description=Node Switch Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/your-user/node-switch-v1.0.0-arm7-plain
ExecStart=/usr/bin/node /home/your-user/node-switch-v1.0.0-arm7-plain/app/loader.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/your-user/node-switch-v1.0.0-arm7-plain/node-switch.log
StandardError=append:/home/your-user/node-switch-v1.0.0-arm7-plain/node-switch.log

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable node-switch.service
sudo systemctl start node-switch.service
sudo systemctl status node-switch.service
```

#### 方法 2: 使用 crontab

```bash
crontab -e
```

添加：
```
@reboot cd /home/your-user/node-switch-v1.0.0-arm7-plain && ./start.sh start
```

---

## 关键技术细节

### 1. serialport 原生模块编译

serialport 是一个需要编译原生 C++ 扩展的 npm 包，必须在目标架构上编译：

```dockerfile
# 在 ARM v7 环境中编译
RUN pnpm install --frozen-lockfile
```

这会：
1. 下载 serialport 源码
2. 使用 node-gyp 编译 ARM v7 版本的 `.node` 文件
3. 生成的二进制文件只能在 ARM v7 设备上运行

### 2. TypeScript 编译

TypeScript 代码编译为 CommonJS 格式的 JavaScript：

```bash
# tsconfig.json 配置
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./dist"
  }
}
```

编译产物：
```
packages/backend/src/index.ts → backend/index.cjs
packages/core/src/app.ts → core/app.cjs
packages/shared/src/config.ts → shared/config.cjs
```

### 3. 依赖管理

使用 pnpm workspace 管理monorepo：

```
node-switch/
├── packages/
│   ├── shared/      # 共享类型和工具
│   ├── core/        # 核心业务逻辑
│   ├── backend/     # 后端服务
│   └── frontend/    # 前端界面
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

生产环境只保留运行时依赖：
```dockerfile
RUN CI=true pnpm prune --prod
RUN pnpm install --prod --frozen-lockfile
```

### 4. 启动流程

```
start.sh (Bash 脚本)
    ↓
loader.js (Node.js 入口)
    ↓
backend/index.cjs (主应用)
    ↓
core/app.cjs (核心逻辑)
    + backend services (业务服务)
```

---

## 常见问题和故障排除

### 问题 1: Docker Buildx 不支持 ARM v7

**症状**:
```
ERROR: multiple platforms feature is currently not supported for docker driver
```

**解决方案**:
```bash
# 创建并使用新的 builder 实例
docker buildx create --name multiarch --driver docker-container
docker buildx use multiarch
docker buildx inspect --bootstrap
```

### 问题 2: QEMU 模拟速度慢

**症状**: Docker 构建时间过长（超过 30 分钟）

**解决方案**:
- 这是正常现象，QEMU 模拟 ARM 比 x86 慢 5-10 倍
- 考虑使用 CI/CD 平台（如 GitHub Actions）的 ARM runner
- 或直接在 ARM 设备上构建（不推荐 Orange Pi One 性能较弱）

### 问题 3: serialport 编译失败

**症状**:
```
Error: make: g++: Command not found
```

**解决方案**:
确保 Dockerfile 包含构建工具：
```dockerfile
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
```

### 问题 4: 部署后串口无权限

**症状**:
```
Error: Permission denied, open '/dev/ttyUSB0'
```

**解决方案**:
```bash
# 将用户加入 dialout 组
sudo usermod -aG dialout $USER

# 或修改设备权限（不推荐生产环境）
sudo chmod 666 /dev/ttyUSB0
```

### 问题 5: Node.js 版本不匹配

**症状**:
```
Error: The module was compiled against a different Node.js version
```

**解决方案**:
确保 Orange Pi 上的 Node.js 版本与构建镜像版本一致：
```dockerfile
FROM node:20-slim  # 使用 20.x 版本
```

在 Orange Pi 上安装相同版本：
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 问题 6: 内存不足

**症状**: Orange Pi One (512MB RAM) 运行时 OOM

**解决方案**:
1. 增加 swap 空间：
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. 优化 Node.js 内存使用：
```bash
NODE_OPTIONS="--max-old-space-size=256" ./start.sh start
```

### 问题 7: 构建脚本权限错误

**症状**:
```
bash: ./start.sh: Permission denied
```

**解决方案**:
```bash
chmod +x start.sh
```

---

## 性能优化建议

### 1. 构建性能

- **缓存 Docker 层**: 不常修改的文件（package.json）先复制
- **并行构建**: 使用 `--parallel` 选项（Docker Buildx）
- **本地 registry**: 缓存基础镜像

### 2. 运行时性能

- **启用 Node.js 生产模式**: 默认已在 `start.sh` 中设置
- **使用 PM2 管理进程**:
  ```bash
  npm install -g pm2
  pm2 start app/loader.js --name node-switch
  pm2 startup
  pm2 save
  ```

- **优化日志**: 使用 logrotate 管理日志文件大小

### 3. Orange Pi One 特定优化

- **关闭不必要的服务**: 节省内存和 CPU
- **使用轻量级窗口管理器**: 如果需要 GUI
- **CPU 性能模式**:
  ```bash
  sudo cpufreq-set -g performance
  ```

---

## 相关文件说明

### 构建相关

| 文件 | 说明 |
|------|------|
| `scripts/build-arm7-plain.sh` | 主构建脚本 |
| `Dockerfile.build-plain` | Docker 镜像定义 |
| `package.json` | 项目依赖配置 |
| `pnpm-workspace.yaml` | Monorepo 工作区配置 |
| `tsconfig.json` | TypeScript 编译配置 |

### 部署相关

| 文件 | 说明 |
|------|------|
| `start.sh` | 应用启动脚本（生成） |
| `loader.js` | 应用加载器（生成） |
| `config.json5` | 应用配置文件 |
| `.env.example` | 环境变量示例 |

---

## 版本兼容性矩阵

| 组件 | 版本要求 | 测试版本 |
|------|----------|----------|
| Node.js | 20.x / 22.x | 20.11.0, 22.0.0 |
| Docker | >= 20.10 | 24.0.7 |
| Docker Buildx | >= 0.4.0 | 0.12.0 |
| QEMU | >= 4.0 | 7.2 |
| Ubuntu (Orange Pi) | 20.04 / 22.04 | 20.04.3 LTS |
| pnpm | >= 8.0 | 8.15.0 |

---

## 参考资源

### 官方文档
- [Node.js ARM 版本下载](https://nodejs.org/en/download/package-manager)
- [Docker Buildx 文档](https://docs.docker.com/buildx/working-with-buildx/)
- [QEMU 用户模式模拟](https://www.qemu.org/docs/master/user/main.html)
- [Orange Pi 官方论坛](https://forum.orangepi.org/)

### 项目相关
- [serialport 文档](https://serialport.io/)
- [pnpm workspace 文档](https://pnpm.io/workspaces)
- [TypeScript 编译选项](https://www.typescriptlang.org/tsconfig)

---

## 维护和支持

### 构建脚本维护

修改构建流程时，需更新以下文件：
1. `scripts/build-arm7-plain.sh` - 构建逻辑
2. `Dockerfile.build-plain` - Docker 镜像配置
3. `scripts/BUILD_ENVIRONMENT.md` - 本文档

### 版本更新流程

```bash
# 1. 更新版本号
export VERSION="1.1.0"

# 2. 修改脚本中的版本变量
sed -i "s/VERSION=\"1.0.0\"/VERSION=\"${VERSION}\"/" scripts/build-arm7-plain.sh

# 3. 构建新版本
./scripts/build-arm7-plain.sh --clean

# 4. 测试部署
# 在 Orange Pi 上测试新版本

# 5. 提交更新
git add .
git commit -m "chore: bump version to ${VERSION}"
git tag v${VERSION}
```

---

## 附录：完整构建命令示例

```bash
# 标准构建
./scripts/build-arm7-plain.sh

# 清理构建
./scripts/build-arm7-plain.sh --clean

# 手动 Docker 构建
docker buildx build \
  --platform linux/arm/v7 \
  -f Dockerfile.build-plain \
  -t node-switch:arm7-build-plain \
  --load \
  .

# 提取产物（手动）
docker create --name temp-extract node-switch:arm7-build-plain /bin/true
docker cp temp-extract:/app ./dist/app
docker rm temp-extract

# 查看 Docker 镜像大小
docker images | grep node-switch

# 测试 QEMU 支持
docker run --rm -it arm32v7/node:20-slim uname -m
# 应输出: armv7l
```

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-31
**维护者**: Node Switch Team
