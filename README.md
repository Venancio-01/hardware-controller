# Hardware Controller

硬件控制器项目 - 正在进行 Go 重构。

## 项目结构

```
hardware-controller/
├── backend/          # Go 后端服务（新实现）
│   ├── cmd/          # 主程序入口
│   ├── internal/     # 私有代码
│   └── pkg/          # 公共库
├── frontend/         # 前端项目
├── reference/        # 原 Node.js 实现（参考）
│   ├── packages/
│   │   ├── core/     # 核心业务逻辑
│   │   ├── backend/  # Node.js 后端
│   │   ├── frontend/ # Node.js 前端
│   │   └── shared/   # 共享代码
│   └── scripts/      # 构建脚本
├── docs/             # 文档
└── _bmad-output/     # 项目管理文档
```

## 开发

### 后端 (Go)

```bash
cd backend
go run cmd/server/main.go
```

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

### 参考实现

原 Node.js 实现位于 `reference/` 目录，可作为 Go 重构的参考。

## 功能

- **UDP 通信** - 与柜体端、控制端等设备通信
- **继电器控制** - 8路继电器开闭、延时控制、状态查询
- **语音播报** - CX-815E 语音模块集成，支持 TTS 播报
- **状态轮询** - 自动轮询设备状态并记录变化

## 协议文档

- [ETH 设备通信协议说明 V42](docs/ETH%20设备通信协议说明V42.md)
- [CX-815E 语音播报模块集成指南](docs/CX-815E%20网口语音播报模块集成指南%20(V1.0).md)

## License

MIT
