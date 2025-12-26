# Tech-Spec: 状态机监听逻辑重构 (移除 UDP)

**Created:** 2025-12-26
**Status:** Implementation Complete

## Overview

### Problem Statement

当前 `HardwareCommunicationManager` 和 `MonitorMachine` 仍包含 UDP 协议相关代码，但项目已不再使用 UDP 连接。具体问题：

1. **`monitor-machine.ts` 第 39 行**：`if (protocol === 'udp')` 判断导致 TCP/Serial 协议的数据无法被正确处理
2. **`manager.ts`**：包含大量 UDP 相关代码（`UDPClient`、`udpTargets`、`udpRemoteToId` 等），增加维护成本
3. **`types/index.ts`**：`Protocol` 类型仍包含 `'udp'`，与实际使用不符
4. **测试文件**：测试中使用 `'udp'` 作为协议参数，需要更新

### Solution

重构状态监听逻辑，移除所有 UDP 相关代码，确保 TCP 和 Serial 协议的硬件状态上报能被正确解析和处理。

### Scope

#### In Scope
- 移除 `HardwareCommunicationManager` 中所有 UDP 相关代码
- 修改 `MonitorMachine` 中的协议判断逻辑，支持 TCP/Serial
- 更新 `Protocol` 类型定义（移除 `'udp'`）
- 更新相关测试文件

#### Out of Scope
- 修改业务逻辑（继电器状态解析逻辑保持不变）
- 修改 `parseActiveReportFrame` 函数（已正确实现）

---

## Context for Development

### Codebase Patterns

1. **协议解析**：使用 `parseActiveReportFrame()` 解析继电器主动上报帧（9 字节，帧头 `EE FF`，功能码 `C0`）
2. **状态机模式**：使用 xstate 状态机管理状态，`entry` actions 中设置 `onIncomingData` 回调
3. **测试模式**：使用 vitest，mock `HardwareCommunicationManager`

### Files to Reference

| 文件 | 说明 |
|------|------|
| [controller.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/relay/controller.ts) | 包含 `parseActiveReportFrame` 函数 |
| [继电器开关量主动上报协议规范.md](file:///home/qingshan/workspace/front-end/node-switch/packages/core/docs/继电器开关量主动上报协议规范.md) | 协议规范文档 |
| [monitor-machine.enhanced.test.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/__tests__/state-machines/monitor-machine.enhanced.test.ts) | 现有测试文件 |

### Technical Decisions

1. **监听所有协议**：`onIncomingData` 回调应处理所有 TCP 和 Serial 协议的数据，不再进行协议过滤
2. **保留接口兼容**：`onIncomingData` 回调签名保持不变，仅修改内部逻辑

---

## Implementation Plan

### Tasks

- [x] **Task 1**: 修改 `monitor-machine.ts` - 移除 UDP 协议判断
  - 第 39 行：移除 `if (protocol === 'udp')` 条件，改为处理所有协议数据

- [x] **Task 2**: 清理 `manager.ts` - 移除 UDP 相关代码
  - 移除 `UDPClient` import 和实例化
  - 移除 `udpTargets` 和 `udpRemoteToId` Map
  - 移除 `initialize()` 中 UDP 初始化逻辑
  - 移除 `sendCommand()` 中 `protocol === 'udp'` 分支
  - 移除 `getAllConnectionStatus()` 中 UDP 状态
  - 移除 `shutdown()` 中 UDP 关闭逻辑

- [x] **Task 3**: 更新 `types/index.ts` - 修改 Protocol 类型
  - 将 `Protocol = 'udp' | 'tcp' | 'serial'` 改为 `Protocol = 'tcp' | 'serial'`

- [x] **Task 4**: 更新测试文件
  - `monitor-machine.enhanced.test.ts`：将测试中的 `'udp'` 改为 `'tcp'`
  - `monitor-machine.test.ts`：检查是否有 UDP 相关 mock
  - 删除 `udp-retry.test.ts`（如果存在且仅测试 UDP）

- [x] **Task 5**: 验证构建和测试通过

### Acceptance Criteria

- [x] AC 1: `MonitorMachine` 能正确处理来自 TCP 客户端的继电器状态上报
  - Given: TCP 客户端接收到继电器主动上报帧 `EE FF C0 01 00 01 01 00 XX`
  - When: `onIncomingData` 回调被调用
  - Then: `RELAY_DATA_RECEIVED` 事件被触发，状态被正确解析

- [x] AC 2: `MonitorMachine` 能正确处理来自 Serial 客户端的继电器状态上报
  - Given: Serial 客户端接收到继电器主动上报帧
  - When: `onIncomingData` 回调被调用
  - Then: `RELAY_DATA_RECEIVED` 事件被触发，状态被正确解析

- [x] AC 3: `HardwareCommunicationManager` 不再包含 UDP 相关代码
  - Given: 代码库已重构
  - When: 搜索 `udp` 关键字
  - Then: `manager.ts` 中不存在 UDP 相关代码

- [x] AC 4: 项目编译通过，无类型错误
  - Given: 所有修改完成
  - When: 运行 `pnpm -r build`
  - Then: 构建成功，无错误

- [x] AC 5: 所有单元测试通过
  - Given: 测试文件已更新
  - When: 运行 `pnpm --filter core test`
  - Then: 所有测试通过

---

## Additional Context

### Dependencies

- 无外部依赖变更
- 移除 `UDPClient` 的使用（但模块文件可保留以备将来使用）

### Testing Strategy

#### Automated Tests

1. **运行现有测试**（更新后）：
   ```bash
   pnpm --filter core test __tests__/state-machines/monitor-machine
   ```

2. **运行完整 core 包测试**：
   ```bash
   pnpm --filter core test
   ```

3. **构建验证**：
   ```bash
   pnpm -r build
   ```

#### Manual Verification

使用现有的 `manual-test-relay.ts` 脚本验证 TCP 连接下的继电器状态上报：

```bash
cd packages/core
npx tsx manual-test-relay.ts
```

预期：能够接收并正确解析继电器设备的主动上报帧。

### Notes

- 现有 `controller.ts` 中的 `parseActiveReportFrame` 函数已正确实现，无需修改
- 协议规范中新增了响应帧 `OK!`（`4F 4B 21`），但这是控制命令的响应，与状态监听无关
