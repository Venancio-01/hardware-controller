# 源码树分析 - 根部分

## 目录结构

```
node-switch/
├── .agent/                 # AI Agent 配置
├── .bmad/                  # BMad 框架内部状态
├── _bmad-output/           # 生成的文档输出
├── config/                 # 配置加载（环境变量，模式）
├── docs/                   # 现有项目文档（协议，规范）
├── scripts/                # 实用脚本
├── src/                    # 应用程序源代码
│   ├── business-logic/     # 核心业务逻辑（继电器聚合）
│   ├── config/             # 配置加载器源码
│   ├── hardware/           # 硬件通信管理器（TCP/UDP）
│   ├── logger/             # 日志基础设施（Pino 包装器）
│   ├── relay/              # 继电器控制模块（命令构建器）
│   ├── state-machines/     # XState 状态机定义（主状态机，监控状态机，警报状态机）
│   ├── tcp/                # TCP 客户端实现
│   ├── types/              # TypeScript 定义（事件，协议）
│   ├── udp/                # UDP 客户端实现
│   ├── voice-broadcast/    # 语音模块驱动程序（CX-815E）
│   └── index.ts            # 应用程序入口点
├── test/                   # Vitest 单元测试
├── package.json            # 依赖项和脚本
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目概述
```

## 关键文件夹

### `src/state-machines/`
**用途**: 包含作为 XState 状态机定义的核心应用程序逻辑。
**关键文件**:
- `main-machine.ts`: 中央协调器，处理全局事件（`KeyDetected`, `Vibration`）。
- `apply-ammo-machine.ts`: 处理弹药申请的复杂业务流程。
- `monitor-machine.ts`: 定期健康检查。

### `src/hardware/` & `src/relay/` & `src/voice-broadcast/`
**用途**: 硬件抽象层 (HAL)。
**作用**: 这些模块将底层 UDP/TCP 协议细节（十六进制代码，字符串解析）与高级状态机逻辑隔离。

### `docs/`
**用途**: 包含关键参考规范。
**重要性**:
- `ETH 设备通信协议说明V42.md` 定义了继电器控制协议。
- `CX-815E 网口语音播报模块集成指南 (V1.0).md` 定义了语音广播协议。

## 入口点
- `src/index.ts`: 主应用程序引导。初始化硬件管理器、语音控制器并启动主 Actor。

## 集成点
- **UDP**: 用于继电器控制（通常为 9005 端口，根据标准 ETH 协议）。
- **TCP**: 用于语音广播模块。