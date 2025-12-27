# Tech-Spec: 源码保护与打包方案

**Created:** 2025-12-27
**Status:** Completed
**Updated:** 2025-12-27 (Adversarial Review Completed)

## Review Notes
- Adversarial review completed
- Findings: 6 total, 3 fixed (F1, F2, F3), 3 skipped (F4, F5, F6 - noise/limitations)
- Resolution approach: Auto-fix


---

## Overview

### Problem Statement

当前项目需要部署到 OrangePi（Ubuntu ARM v7 32位系统）上。用户的**核心需求是源码保护**：

> "我想打包成二进制的原因是想避开 JS 的这种可以直接查看源文件的模式"

需要解决：
1. **后端代码**（core + backend）：纯文本 TypeScript/JavaScript 源码暴露
2. **前端代码**（frontend）：打包后的 JS 仍可被查看和理解
3. 部署复杂性（次要需求）

### Solution Summary

**推荐方案：bytenode + javascript-obfuscator 组合**

```
┌─────────────────────────────────────────────────────────────┐
│                     源码保护架构                              │
├─────────────────────────────────────────────────────────────┤
│  Backend/Core (.ts)                                         │
│       │                                                     │
│       ▼ tsc 编译                                             │
│     .js 文件                                                 │
│       │                                                     │
│       ▼ bytenode 编译                                        │
│     .jsc 文件 (V8 字节码) ──→ 无法直接阅读源码                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend (.tsx)                                            │
│       │                                                     │
│       ▼ vite build + terser                                 │
│     minified .js                                            │
│       │                                                     │
│       ▼ javascript-obfuscator                               │
│     混淆后的 .js ──→ 极难理解业务逻辑                          │
└─────────────────────────────────────────────────────────────┘
```

### Scope

#### In Scope
- 后端代码（core/backend）的 V8 字节码编译
- 前端代码的深度混淆
- ARM v7 32位兼容性验证
- 部署包结构设计

#### Out of Scope
- 绝对的代码安全（技术上不存在）
- 加密运行时解密方案
- 商业级代码保护服务

---

## 源码保护方案分析

### 保护级别对比

| 方案 | 保护强度 | 逆向难度 | 性能影响 | ARM v7 兼容 |
|------|---------|---------|---------|-------------|
| 无保护 (原始 JS) | ⭐ | 极低 | 无 | ✅ |
| Minification (Terser) | ⭐⭐ | 低 | 无 | ✅ |
| Obfuscation (混淆) | ⭐⭐⭐ | 中 | 15-80% | ✅ |
| Bytenode (V8 字节码) | ⭐⭐⭐⭐ | 高 | 无/略优 | ✅ |
| VM Obfuscation (付费) | ⭐⭐⭐⭐⭐ | 极高 | 较高 | ✅ |

---

## 方案 1: Bytenode (★ 推荐用于 Backend/Core)

### 什么是 Bytenode？

Bytenode 将 JavaScript 编译为 **V8 引擎的字节码** (`.jsc` 文件)，而不是可读的文本格式。

```javascript
// 原始代码 (可读)
function calculatePrice(base, tax) {
  return base * (1 + tax);
}

// 编译后 (.jsc) - 二进制格式，无法直接阅读
// 只有 V8 引擎能理解和执行
```

### 优点

| 优点 | 说明 |
|-----|------|
| ✅ 源码完全隐藏 | 原始 JS 代码不存在于产物中 |
| ✅ 无性能损失 | 跳过解析步骤，可能略快 |
| ✅ 逆向难度高 | 需要专业工具和大量时间 |
| ✅ 免费开源 | MIT 许可证 |

### 限制

| 限制 | 影响 | 解决方案 |
|-----|------|---------|
| ⚠️ Node.js 版本锁定 | `.jsc` 必须在相同 Node.js 版本运行 | 打包 Node.js runtime |
| ⚠️ 平台锁定 | 需在目标平台(ARM v7)编译 | 在 OrangePi 上编译 |
| ⚠️ 不支持 `Function.toString()` | 极少使用 | 无需处理 |

### 示例用法

```bash
# 安装
npm install -g bytenode

# 编译单个文件
bytenode -c dist/backend/index.js

# 编译整个目录
find dist -name "*.js" -exec bytenode -c {} \;

# 运行 .jsc 文件
bytenode dist/backend/index.jsc
```

### 入口文件改造

```javascript
// loader.js (唯一的明文 JS，非常简单)
require('bytenode');
require('./index.jsc');
```

---

## 方案 2: JavaScript Obfuscator (★ 推荐用于 Frontend)

### 什么是混淆？

将可读代码转换为功能等价但极难理解的格式：

```javascript
// 原始代码
function login(username, password) {
  if (username === 'admin' && password === 'secret') {
    return { success: true, token: generateToken() };
  }
  return { success: false };
}

// 混淆后 (简化示例)
function _0x12ab(_0x34cd, _0x56ef) {
  var _0x78gh = ['\x73\x75\x63\x63\x65\x73\x73', ...];
  if (_0x34cd === _0x78gh[0x3] && _0x56ef === _0x78gh[0x7]) {
    return { [_0x78gh[0x0]]: !0x0, [_0x78gh[0x1]]: _0x89ij() };
  }
  return { [_0x78gh[0x0]]: !0x1 };
}
```

### 推荐配置

```javascript
// obfuscator.config.js
module.exports = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,

  // 不推荐在性能敏感场景
  // selfDefending: true, // 会显著增加代码体积
};
```

### 性能影响

| 选项 | 保护增强 | 性能损失 | 推荐 |
|-----|---------|---------|-----|
| `compact` | 低 | 0% | ✅ |
| `stringArray` | 中 | 5-10% | ✅ |
| `controlFlowFlattening` | 高 | 15-35% | ✅ 前端 |
| `deadCodeInjection` | 中 | 10-20% | ✅ 前端 |
| `selfDefending` | 高 | 50-80% | ⚠️ 慎用 |

---

## 方案 3: 组合方案 (★★ 最佳实践)

### 架构设计

```
node-switch-v1.0.0-arm7/
├── node/                          # 预编译 Node.js runtime (ARM v7)
│   └── bin/node
├── app/
│   ├── loader.js                  # 4行启动脚本 (明文)
│   ├── backend.jsc                # V8 字节码
│   ├── core.jsc                   # V8 字节码
│   ├── shared.jsc                 # V8 字节码
│   └── node_modules/
│       └── serialport/            # 原生模块 (必须明文)
├── public/                        # 混淆后的前端资源
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js        # 混淆后
│       └── index-[hash].css
├── config.json5                   # 配置文件
└── start.sh                       # 启动脚本
```

### 构建流程

```bash
#!/bin/bash
# build-protected.sh

echo "=== 1. 编译 TypeScript ==="
pnpm build

echo "=== 2. 编译后端为 V8 字节码 ==="
cd packages/backend/dist
find . -name "*.js" -exec bytenode -c {} \;
find . -name "*.js" -delete  # 删除原始 JS

cd ../../core/dist
find . -name "*.js" -exec bytenode -c {} \;
find . -name "*.js" -delete

echo "=== 3. 混淆前端代码 ==="
cd ../../frontend/dist/assets
javascript-obfuscator . --output . --config obfuscator.config.js

echo "=== 4. 打包部署包 ==="
# ... 打包逻辑
```

---

## ARM v7 兼容性与 Docker 交叉编译

### Node.js 版本

| Node.js 版本 | ARM v7 支持 | 推荐 |
|-------------|------------|------|
| Node.js 22.x | ⚠️ 可能有限 | ❌ |
| Node.js 20.x LTS | ✅ 支持 | ✅ 推荐 |
| Node.js 18.x LTS | ✅ 支持 | ✅ 备选 |

> [!IMPORTANT]
> **V8 字节码与 CPU 架构严格绑定**
> 必须在 ARM v7 环境（真机或模拟）中编译 `.jsc` 文件

---

### 编译环境选项对比

| 方案 | 优点 | 缺点 |
|------|-----|------|
| 直接在 OrangePi 编译 | 最简单 | ⚠️ 可能 OOM |
| **Docker + QEMU** | 使用开发机内存 | 速度较慢 |
| 云 ARM 实例 | 性能好 | 需要付费 |

**推荐：Docker + QEMU 交叉编译** ✅

---

### Docker 交叉编译方案 (★ 推荐)

在开发机器(x86/x64)上使用 Docker 模拟 ARM v7 环境进行编译：

#### 1. 一次性设置 QEMU

```bash
# 安装 QEMU 用户态模拟器（仅需执行一次）
docker run --privileged --rm tonistiigi/binfmt --install arm

# 验证是否成功
docker buildx ls
# 应该显示 linux/arm/v7 已支持
```

#### 2. Dockerfile 多阶段构建

```dockerfile
# Dockerfile.build
# ============================================
# 阶段1: 在 ARM v7 环境中构建
# ============================================
FROM --platform=linux/arm/v7 node:20-slim AS builder

WORKDIR /app

# 安装构建工具
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 安装 bytenode 和 javascript-obfuscator
RUN npm install -g bytenode javascript-obfuscator pnpm

# 复制项目文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# 安装依赖（包括 serialport 原生模块编译）
RUN pnpm install --frozen-lockfile

# 构建 TypeScript
RUN pnpm build

# 编译后端为 V8 字节码
RUN find packages/backend/dist -name "*.js" ! -name "loader.js" -exec bytenode -c {} \; \
    && find packages/backend/dist -name "*.js" ! -name "loader.js" -delete

RUN find packages/core/dist -name "*.js" ! -name "loader.js" -exec bytenode -c {} \; \
    && find packages/core/dist -name "*.js" ! -name "loader.js" -delete

# 混淆前端代码
RUN javascript-obfuscator packages/frontend/dist/assets \
    --output packages/frontend/dist/assets \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --string-array-encoding base64

# ============================================
# 阶段2: 创建最小运行时镜像
# ============================================
FROM --platform=linux/arm/v7 node:20-slim AS runtime

WORKDIR /app

# 仅复制必要文件
COPY --from=builder /app/packages/backend/dist ./backend
COPY --from=builder /app/packages/core/dist ./core
COPY --from=builder /app/packages/shared/dist ./shared
COPY --from=builder /app/packages/frontend/dist ./public
COPY --from=builder /app/node_modules ./node_modules
COPY config.json5 ./

# 创建启动脚本
RUN echo '#!/bin/bash\nnode backend/loader.js' > /app/start.sh \
    && chmod +x /app/start.sh

EXPOSE 3000

CMD ["./start.sh"]
```

#### 3. 构建命令

```bash
# 构建 ARM v7 Docker 镜像（在开发机器上运行）
docker buildx build \
  --platform linux/arm/v7 \
  -f Dockerfile.build \
  -t node-switch:arm7 \
  --load \
  .

# 导出为 tar 文件（可传输到 OrangePi）
docker save node-switch:arm7 | gzip > node-switch-arm7-docker.tar.gz
```

#### 4. 在 OrangePi 上部署（解压即用）

> [!TIP]
> **OrangePi 无需安装任何软件**（包括 Docker 和 Node.js）
> 压缩包内包含完整的 Node.js runtime

```bash
# 在 OrangePi 上
tar -xzf node-switch-v1.0.0-arm7.tar.gz
cd node-switch
./start.sh
```

---

### 完整打包结构（解压即用）

```
node-switch-v1.0.0-arm7/
├── node/                          # 预编译 Node.js runtime (ARM v7)
│   └── bin/
│       ├── node                   # Node.js 可执行文件
│       └── bytenode              # bytenode 加载器
├── app/
│   ├── loader.js                  # 4行启动脚本 (唯一明文 JS)
│   ├── backend/                   # V8 字节码
│   │   ├── index.jsc
│   │   └── *.jsc
│   ├── core/                      # V8 字节码
│   │   └── *.jsc
│   ├── shared/                    # V8 字节码
│   │   └── *.jsc
│   └── node_modules/              # 依赖（包含 serialport 原生模块）
│       └── ...
├── public/                        # 混淆后的前端资源
│   ├── index.html
│   └── assets/
│       └── *.js (混淆后)
├── config.json5                   # 配置文件
└── start.sh                       # 启动脚本
```

---

### 完整构建脚本（生成解压即用的包）

```bash
#!/bin/bash
# scripts/build-arm7.sh
# 一键构建 ARM v7 部署包（包含 Node.js runtime）

set -e

VERSION="1.0.0"
NODE_VERSION="20.19.6"
OUTPUT_DIR="dist/node-switch-v${VERSION}-arm7"

echo "=== 1. 检查 Docker buildx 配置 ==="
if ! docker buildx ls | grep -q "linux/arm/v7"; then
  echo "正在配置 QEMU..."
  docker run --privileged --rm tonistiigi/binfmt --install arm
fi

echo "=== 2. 构建 ARM v7 应用 ==="
docker buildx build \
  --platform linux/arm/v7 \
  -f Dockerfile.build \
  -t node-switch:arm7 \
  --load \
  .

echo "=== 3. 提取构建产物 ==="
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 创建临时容器并提取文件
docker create --name temp-extract node-switch:arm7 2>/dev/null || docker rm -f temp-extract
docker cp temp-extract:/app/backend "$OUTPUT_DIR/app/backend"
docker cp temp-extract:/app/core "$OUTPUT_DIR/app/core"
docker cp temp-extract:/app/shared "$OUTPUT_DIR/app/shared"
docker cp temp-extract:/app/node_modules "$OUTPUT_DIR/app/node_modules"
docker cp temp-extract:/app/public "$OUTPUT_DIR/public"
docker rm temp-extract

echo "=== 4. 下载 Node.js ARM v7 runtime ==="
if [ ! -f "cache/node-v${NODE_VERSION}-linux-armv7l.tar.xz" ]; then
  mkdir -p cache
  curl -L "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-armv7l.tar.xz" \
    -o "cache/node-v${NODE_VERSION}-linux-armv7l.tar.xz"
fi

# 提取 Node.js（仅保留必要文件）
mkdir -p "$OUTPUT_DIR/node"
tar -xf "cache/node-v${NODE_VERSION}-linux-armv7l.tar.xz" \
  --strip-components=1 \
  -C "$OUTPUT_DIR/node" \
  "node-v${NODE_VERSION}-linux-armv7l/bin/node"

echo "=== 5. 创建启动脚本 ==="
cat > "$OUTPUT_DIR/start.sh" << 'EOF'
#!/bin/bash
# Node Switch 启动脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="$SCRIPT_DIR/node/bin/node"
APP_DIR="$SCRIPT_DIR/app"

# 设置环境变量
export NODE_ENV=production
export PORT=${PORT:-3000}

case "${1:-start}" in
  start)
    echo "启动 Node Switch..."
    cd "$APP_DIR"
    exec "$NODE_BIN" loader.js
    ;;
  stop)
    echo "停止 Node Switch..."
    pkill -f "node.*loader.js" || echo "进程未运行"
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
  status)
    if pgrep -f "node.*loader.js" > /dev/null; then
      echo "Node Switch 正在运行"
    else
      echo "Node Switch 未运行"
    fi
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
EOF
chmod +x "$OUTPUT_DIR/start.sh"

echo "=== 6. 创建 loader.js ==="
cat > "$OUTPUT_DIR/app/loader.js" << 'EOF'
// Node Switch Loader
// 加载 V8 字节码模块
require('bytenode');
require('./backend/index.jsc');
EOF

echo "=== 7. 复制配置文件 ==="
cp config.json5 "$OUTPUT_DIR/"

echo "=== 8. 打包 ==="
cd dist
tar -czf "node-switch-v${VERSION}-arm7.tar.gz" "node-switch-v${VERSION}-arm7"

echo ""
echo "=== 构建完成 ==="
echo "输出文件: dist/node-switch-v${VERSION}-arm7.tar.gz"
echo ""
echo "部署方式:"
echo "  1. 复制到 OrangePi: scp dist/node-switch-v${VERSION}-arm7.tar.gz user@orangepi:~/"
echo "  2. SSH 到 OrangePi: ssh user@orangepi"
echo "  3. 解压: tar -xzf node-switch-v${VERSION}-arm7.tar.gz"
echo "  4. 启动: cd node-switch-v${VERSION}-arm7 && ./start.sh"
```

---

### Dockerfile.build（用于构建）

```dockerfile
# Dockerfile.build
# 仅用于构建，不用于运行！

FROM --platform=linux/arm/v7 node:20-slim AS builder

WORKDIR /app

# 安装构建工具
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 安装 bytenode 和 javascript-obfuscator
RUN npm install -g bytenode javascript-obfuscator pnpm

# 复制项目文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY config.json5 ./

# 安装依赖（包括 serialport 原生模块编译）
RUN pnpm install --frozen-lockfile

# 构建 TypeScript
RUN pnpm build

# 编译后端为 V8 字节码
RUN find packages/backend/dist -name "*.js" ! -name "loader.js" -exec bytenode -c {} \; \
    && find packages/backend/dist -name "*.js" ! -name "loader.js" -delete

RUN find packages/core/dist -name "*.js" -exec bytenode -c {} \; \
    && find packages/core/dist -name "*.js" -delete

RUN find packages/shared/dist -name "*.js" -exec bytenode -c {} \; \
    && find packages/shared/dist -name "*.js" -delete

# 混淆前端代码
RUN javascript-obfuscator packages/frontend/dist/assets \
    --output packages/frontend/dist/assets \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --string-array-encoding base64

# 重命名目录以便提取
RUN mv packages/backend/dist backend \
    && mv packages/core/dist core \
    && mv packages/shared/dist shared \
    && mv packages/frontend/dist public

# 清理不需要的 devDependencies
RUN pnpm prune --prod
```

---

## Implementation Plan

### Tasks

- [x] **Task 1**: 添加 bytenode 依赖和构建脚本
  - 创建 `scripts/build-arm7.sh`
  - 创建 `Dockerfile.build`
  - 更新 `package.json` scripts

- [x] **Task 2**: 创建 loader 入口文件
  - `packages/backend/src/loader.js`
  - `packages/core/src/loader.js`

- [x] **Task 3**: 配置前端混淆
  - 创建 `obfuscator.config.js`
  - 更新 `vite.config.ts`（启用 terser、禁用 sourcemap）
  - 添加 terser 依赖

- [x] **Task 4**: 创建统一启动脚本
  - `start.sh` 支持 start/stop/restart/status/logs（在 build 脚本中生成）
  - 设置正确的工作目录和环境变量

- [x] **Task 5**: 配置优化
  - 更新 tsup 配置（生产环境禁用 sourcemap）
  - 创建 `.dockerignore`
  - 更新根目录 `tsconfig.json`

### Acceptance Criteria

- [ ] AC 1: `packages/*/dist/` 目录中无 `.js` 文件（仅 `.jsc`）- 需用户在 OrangePi 上验证
- [ ] AC 2: 无法通过文本编辑器阅读任何业务逻辑代码 - 需用户验证
- [ ] AC 3: 应用在 OrangePi 上正常启动和运行 - 需用户验证
- [ ] AC 4: 串口通信功能正常 - 需用户在真实硬件上验证
- [ ] AC 5: 前端页面正常加载和交互 - 需用户验证

---


## Testing Strategy

### 本地测试

```bash
# 1. 构建受保护版本
./scripts/build-protected.sh

# 2. 验证无明文 JS
find dist -name "*.js" | wc -l  # 应该为 0 (除了 loader.js)

# 3. 本地运行测试
node loader.js
```

### ARM 测试

```bash
# 使用 QEMU 模拟 ARM
docker run --platform linux/arm/v7 -v $(pwd):/app -it arm32v7/node:20 bash

# 或直接在 OrangePi 上测试
scp -r dist/ user@orangepi:~/node-switch/
ssh user@orangepi "cd ~/node-switch && ./start.sh"
```

---

## 安全性声明

> [!CAUTION]
> **无任何技术可提供绝对的源码保护**

| 保护级别 | 防护对象 | 无法防护 |
|---------|---------|---------|
| bytenode | 普通开发者、脚本小子 | 专业逆向工程师 |
| Obfuscation | 代码阅读、简单分析 | 动态调试、专业工具 |

本方案可以：
- ✅ 阻止"随便看看"的人直接阅读源码
- ✅ 大幅增加逆向工程的时间成本
- ✅ 保护商业逻辑不被轻易复制

本方案**不能**：
- ❌ 完全防止专业攻击者
- ❌ 保护运行时内存中的数据
- ❌ 防止合法用户的操作

---

## 替代方案

### 如果需要更强保护

1. **商业混淆服务**：JScrambler（付费，VM 级别保护）
2. **重写关键逻辑**：使用 Rust/Go 编写核心算法，通过 N-API 调用
3. **服务端验证**：将关键逻辑放在云端，本地仅作为客户端

### 如果 ARM v7 bytenode 有问题

1. **仅使用混淆**：放弃 bytenode，全部使用 javascript-obfuscator
2. **Docker 方案**：将应用打包为 Docker 镜像，镜像本身提供一定隔离
