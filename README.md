# Node Switch

基于 Node.js + TypeScript 的硬件通信服务，用于继电器控制和语音播报。

## 功能

-  **UDP 通信** - 与柜体端、控制端等设备通信
-  **继电器控制** - 8路继电器开闭、延时控制、状态查询
-  **语音播报** - CX-815E 语音模块集成，支持 TTS 播报
-  **状态轮询** - 自动轮询设备状态并记录变化
- 📝 **日志系统** - 基于Pino 的结构化日志

## Quick Start

### 1. Installation

```bash
bun install
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 3. Development

```bash
bun dev
```

### 4. Production

Build:

```bash
bun run build
```

Start:

```bash
bun start
```

### 5. Binary Build

```bash
bun run build:binary
```

## 配置

复制 `.env.example` 为 `.env` 并修改：

```bash
# 环境
NODE_ENV=production

# 硬件通信 - 柜体端
CABINET_TARGET_HOST=192.168.1.101
CABINET_TARGET_PORT=8000

# 硬件通信 - 控制端
CONTROL_TARGET_HOST=192.168.1.102
CONTROL_TARGET_PORT=8000

# 语音播报模块
VOICE_BROADCAST_HOST=192.168.1.103
VOICE_BROADCAST_PORT=50000

# 轮询间隔 (ms)
QUERY_INTERVAL=1000

# UDP 本地端口
UDP_LOCAL_PORT=8000
```

## 项目结构

```
src/
├── index.ts              # 应用入口
├── business-logic.ts     # 业务逻辑管理
├── config/               # 配置管理 (Zod 校验)
├── hardware/             # 硬件通信管理器
├── udp/                  # UDP 客户端
├── tcp/                  # TCP 客户端
├── relay/                # 继电器命令构建器
├── voice-broadcast/      # 语音播报控制器
├── logger/               # Pino 日志封装
└── types/                # 类型定义
```

## 服务部署

项目提供 systemd 服务文件，支持开机自启和崩溃重启。

### 安装

```bash
# 构建并部署
pnpm build
sudo mkdir -p /opt/node-switch
sudo cp -r dist package.json pnpm-lock.yaml .env /opt/node-switch/
cd /opt/node-switch && sudo pnpm install --prod

# 安装服务
sudo cp config/node-switch.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now node-switch
```

### 服务管理

```bash
sudo systemctl start node-switch    # 启动
sudo systemctl stop node-switch     # 停止
sudo systemctl restart node-switch  # 重启
sudo systemctl status node-switch   # 状态
journalctl -u node-switch -f        # 日志
```

## 协议文档

- [ETH 设备通信协议说明 V42](docs/ETH%20设备通信协议说明V42.md)
- [CX-815E 语音播报模块集成指南](docs/CX-815E%20网口语音播报模块集成指南%20(V1.0).md)

## License

MIT
