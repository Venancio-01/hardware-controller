# Backend Server

Go 后端服务实现。

## 目录结构

```
backend/
├── cmd/
│   └── server/          # 主程序入口
├── internal/            # 私有代码
│   ├── config/          # 配置管理
│   ├── hardware/        # 硬件控制
│   ├── voice/           # 语音播报
│   ├── state/           # 状态机
│   ├── relay/           # 继电器控制
│   └── transport/       # 网络传输 (TCP/UDP)
└── pkg/                 # 公共库
    ├── types/           # 类型定义
    └── utils/           # 工具函数
```

## 开发

```bash
# 运行
go run cmd/server/main.go

# 构建
go build -o bin/server cmd/server/main.go

# 测试
go test ./...
```

## 参考实现

原 Node.js 实现在 `../reference/` 目录下，可供参考。
