# 组件清单 - 根部分

## 概述

该应用程序被设计为一个模块化的后端服务，具有用于硬件交互和业务逻辑的不同控制器。

## 硬件组件

### 1. 继电器控制器
- **位置**: `src/relay/`
- **类型**: 硬件驱动程序
- **用途**: 通过 UDP/TCP 控制基于 ETH 的继电器设备。
- **关键特性**:
  - `RelayCommandBuilder`: 构建协议命令（`doon`, `dooff`, `dostatus`）。
  - 验证: 使用 Zod 进行通道（1-8）和延迟输入验证。
  - 通道支持: 1-8 个独立通道 + 'all'（通道 99）。
- **接口**:
  - `close(channel: RelayChannel, options?)`
  - `open(channel: RelayChannel)`
  - `queryRelayStatus()`
  - `queryInputStatus()`

### 2. 语音广播控制器
- **位置**: `src/voice-broadcast/`
- **类型**: 硬件驱动程序
- **用途**: 通过 TCP 与 CX-815E 网络语音模块接口。
- **关键特性**:
  - 文本转语音 (TTS) 参数：
    - 音量: `[v0-10]`
    - 语速: `[s0-10]`
    - 声音: `[m3]`（女声），`[m51]`（男声）
  - GB2312 编码以支持中文字符。
  - 模式: 中断（`CC DD F3 00`）vs 缓存（`CC DD F3 01`）。
- **接口**:
  - `broadcast(text, options)`
  - `playSound(soundId)`
  - `setInterruptMode()`, `setCacheMode()`

### 3. 硬件管理器
- **位置**: `src/hardware/`
- **类型**: 核心基础设施
- **用途**: 所有硬件设备的集中通信管理器。
- **关键特性**:
  - 管理 UDP/TCP 套接字。
  - 处理连接生命周期（连接/断开连接）。
  - 分派来自上层（状态机）的命令。

## 业务逻辑组件

### 继电器状态聚合器
- **位置**: `src/business-logic/relay-status-aggregator.ts`
- **类型**: 逻辑模块
- **用途**: 将原始继电器状态更新聚合为有意义的业务事件。
- **角色**:
  - 监控高频状态轮询。
  - 去抖动或过滤变化（可能）。
  - 向状态机发出标准化事件。