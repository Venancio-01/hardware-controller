# Tech-Spec: 硬件通信配置重构

**Created:** 2025-12-26
**Status:** Ready for Development

## Overview

### 问题陈述

当前硬件通信配置存在以下问题：
1. **柜体端**：继电器模块和语音播报模块分别使用独立的 HOST/PORT 配置，但实际硬件已将两个模块合并到同一设备
2. **控制端**：仍使用 TCP 连接配置，但实际硬件已改为串口连接
3. **语音播报模块环境变量**：独立配置导致冗余，语音模块已与主设备合并

### 解决方案

重构环境变量和配置模块，适配新的硬件架构：

| 端 | 原配置 | 新配置 |
|---|--------|--------|
| **柜体端** | UDP (`CABINET_TARGET_HOST/PORT`) + TCP 语音 (`VOICE_BROADCAST_CABINET_*`) | 统一 TCP (`CABINET_HOST/PORT`)，语音复用同一连接 |
| **控制端** | UDP (`CONTROL_TARGET_HOST/PORT`) + TCP 语音 (`VOICE_BROADCAST_CONTROL_*`) | 串口 (`CONTROL_SERIAL_PATH/BAUDRATE/...`) |
| **语音配置** | 独立 HOST/PORT | 保留分别配置 `VOLUME/SPEED`，复用主设备连接 |

### 范围

**包含：**
- 重构 `packages/core/src/config/index.ts` 环境变量定义
- 更新 `.env.example` 示例文件
- 新增串口通信客户端 `packages/core/src/serial/client.ts`
- 更新 `HardwareCommunicationManager` 支持串口协议
- 更新 `hardware/initializer.ts` 使用新配置结构
- 更新 `voice-broadcast/initializer.ts` 适配新架构

**不包含：**
- 继电器/语音播报的协议格式变更（保持现有命令格式）
- 前端配置界面更新（后续独立任务）

---

## Context for Development

### 代码库模式

```
packages/core/src/
├── config/index.ts          # Zod 环境变量验证 + 配置导出
├── hardware/
│   ├── manager.ts           # HardwareCommunicationManager 统一管理 TCP/UDP
│   └── initializer.ts       # 硬件初始化逻辑
├── tcp/client.ts            # TCP 长连接客户端
├── udp/client.ts            # UDP 客户端
├── serial/                  # [NEW] 串口通信模块
│   ├── client.ts            # 串口客户端
│   └── index.ts             # 导出
└── voice-broadcast/
    ├── initializer.ts       # 语音模块初始化
    └── types.ts             # 类型定义
```

### 需要参考的文件

- [config/index.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/config/index.ts) - 当前环境变量定义
- [hardware/manager.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/hardware/manager.ts) - 硬件通信管理器
- [hardware/initializer.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/hardware/initializer.ts) - 硬件初始化逻辑
- [tcp/client.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/tcp/client.ts) - TCP 客户端实现（串口模块参考）
- [voice-broadcast/initializer.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/voice-broadcast/initializer.ts) - 语音初始化逻辑

### 技术决策

1. **串口库选型**：使用 `serialport` 包（Node.js 生态最成熟的串口库）
2. **协议抽象**：串口客户端实现与 TCP 客户端相同的接口 (`send`, `sendNoWait`, `connect`, `disconnect`)
3. **配置向后兼容**：保留旧环境变量名但标记为 deprecated，优先读取新变量

---

## Implementation Plan

### Tasks

#### Phase 1: 环境变量重构

- [ ] **Task 1.1**: 更新 `config/index.ts` 环境变量 Schema
  - 新增柜体端 TCP 配置：`CABINET_HOST`, `CABINET_PORT`
  - 新增控制端串口配置：`CONTROL_SERIAL_PATH`, `CONTROL_SERIAL_BAUDRATE`, `CONTROL_SERIAL_DATABITS`, `CONTROL_SERIAL_STOPBITS`, `CONTROL_SERIAL_PARITY`
  - 简化语音配置：保留 `VOICE_CABINET_VOLUME/SPEED`, `VOICE_CONTROL_VOLUME/SPEED`（复用主设备连接）
  - 标记旧变量为 deprecated

- [ ] **Task 1.2**: 更新 `.env.example` 示例文件

#### Phase 2: 串口通信模块

- [ ] **Task 2.1**: 安装 `serialport` 依赖
  ```bash
  pnpm --filter @node-switch/core add serialport
  pnpm --filter @node-switch/core add -D @types/serialport
  ```

- [ ] **Task 2.2**: 创建 `serial/client.ts`
  - 实现 `SerialClient` 类，接口与 `TCPClient` 保持一致
  - 支持配置：`path`, `baudRate`, `dataBits`, `stopBits`, `parity`
  - 实现连接、断开、发送、接收功能
  - 实现自动重连机制

- [ ] **Task 2.3**: 创建 `serial/index.ts` 导出

#### Phase 3: 硬件管理器更新

- [ ] **Task 3.1**: 更新 `types/index.ts`
  - 新增 `Protocol` 类型支持 `'serial'`
  - 新增 `SerialConfig` 接口

- [ ] **Task 3.2**: 更新 `hardware/manager.ts`
  - 新增 `serial` 客户端注册表
  - 扩展 `initialize()` 支持串口客户端配置
  - 扩展 `sendCommand()` 支持 `protocol: 'serial'`
  - 更新 `getAllConnectionStatus()` 包含串口状态

- [ ] **Task 3.3**: 更新 `hardware/initializer.ts`
  - 柜体端：使用新的 TCP 配置 (`CABINET_HOST/PORT`)
  - 控制端：切换为串口配置
  - 移除冗余的语音独立连接配置

#### Phase 4: 语音模块适配

- [ ] **Task 4.1**: 更新 `voice-broadcast/initializer.ts`
  - 柜体端语音：复用已有的 TCP 连接（`cabinet` 客户端）
  - 控制端语音：复用串口连接（`control` 客户端）
  - 保留 volume/speed 配置

- [ ] **Task 4.2**: 更新 `voice-broadcast/types.ts`（如需要）

---

### Acceptance Criteria

- [ ] **AC 1**: 柜体端设备使用单一 TCP 连接（继电器 + 语音）
  - Given: 配置 `CABINET_HOST=192.168.0.18`, `CABINET_PORT=50000`
  - When: 应用启动
  - Then: 只建立一个 TCP 连接到柜体端

- [ ] **AC 2**: 控制端设备使用串口连接
  - Given: 配置 `CONTROL_SERIAL_PATH=/dev/ttyUSB0`, `CONTROL_SERIAL_BAUDRATE=9600`
  - When: 应用启动
  - Then: 建立串口连接到控制端设备

- [ ] **AC 3**: 继电器命令通过正确的通道发送
  - Given: 柜体端 TCP 连接已建立
  - When: 发送继电器控制命令到柜体端
  - Then: 命令通过 TCP 发送，响应正确解析

- [ ] **AC 4**: 语音播报使用复用连接
  - Given: 柜体端 TCP 连接已建立
  - When: 发送语音播报命令
  - Then: 通过同一 TCP 连接发送，使用配置的 volume/speed

- [ ] **AC 5**: 配置验证失败时应用启动失败
  - Given: 串口配置缺失或无效
  - When: 应用启动
  - Then: 显示明确的错误消息并退出

---

## Additional Context

### Dependencies

```json
{
  "dependencies": {
    "serialport": "^12.0.0"
  },
  "devDependencies": {
    "@types/serialport": "^8.0.0"
  }
}
```

### 新环境变量结构

```bash
# 柜体端配置（TCP）
CABINET_HOST=192.168.0.18
CABINET_PORT=50000

# 控制端配置（串口）
CONTROL_SERIAL_PATH=/dev/ttyUSB0
CONTROL_SERIAL_BAUDRATE=9600
CONTROL_SERIAL_DATABITS=8
CONTROL_SERIAL_STOPBITS=1
CONTROL_SERIAL_PARITY=none

# 语音播报配置（复用主设备连接）
VOICE_CABINET_VOLUME=10
VOICE_CABINET_SPEED=5
VOICE_CONTROL_VOLUME=10
VOICE_CONTROL_SPEED=5

# 已废弃（保留向后兼容，将在未来版本移除）
# CABINET_TARGET_HOST, CABINET_TARGET_PORT
# CONTROL_TARGET_HOST, CONTROL_TARGET_PORT
# VOICE_BROADCAST_CABINET_HOST, VOICE_BROADCAST_CABINET_PORT
# VOICE_BROADCAST_CONTROL_HOST, VOICE_BROADCAST_CONTROL_PORT
```

### Testing Strategy

1. **单元测试**：
   - 环境变量 Schema 验证测试
   - SerialClient 模拟测试（mock serialport）

2. **集成测试**：
   - HardwareCommunicationManager 多协议测试
   - 使用虚拟串口测试串口通信

3. **手动验证**：
   - 真实硬件连接测试
   - 继电器控制和语音播报功能验证

### Notes

- 串口路径在 Linux 通常为 `/dev/ttyUSB0` 或 `/dev/ttyACM0`
- Windows 系统使用 `COM3` 等格式
- 需考虑串口设备热插拔的重连机制
