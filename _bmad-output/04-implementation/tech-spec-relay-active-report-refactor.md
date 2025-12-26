# Tech-Spec: 继电器主动上报协议重构

**Created:** 2025-09-26
**Status:** Implementation Complete

## Overview

### Problem Statement
当前 `packages/core/src/relay/controller.ts` 使用旧 ASCII 命令/响应（`doon/dooff/dostatus/distatus`）。新硬件协议采用二进制 Hex 帧：主动上报帧 (`EE FF C0 ...`) 与控制短帧 (`CC DD A1 ...`)。需要重构为新协议，且对外 API 保持不变，不做向后兼容。

### Solution
在不改变外部 API 的前提下，替换继电器命令生成与解析逻辑为新协议：
- 控制命令改为 A1 短帧协议（控制位+使能位）生成十字节帧。
- 状态获取以主动上报 `EE FF C0` 帧为主，解析 `SL/KL/OH/OL` 位图。
- 监控逻辑从轮询 `dostatus` 转为接收主动上报并触发业务事件。

### Scope (In/Out)
**In**
- 重构 `packages/core/src/relay/controller.ts` 为新协议解析/构建。
- 更新 `monitor-machine` 处理主动上报帧。
- 适配 `apply-ammo-machine`、`reset` 等命令构建调用。
- 更新 Zod 校验逻辑与必要的类型定义。

**Out**
- 旧 ASCII 协议兼容层。
- 与 16 路设备协议（功能码 `CE`）的支持。

## Context for Development

### Codebase Patterns
- TypeScript ESM，显式 `.js` 扩展导入。
- 依赖 Zod 做输入/响应校验。
- 继电器数据由 `RelayStatusAggregator` 聚合后驱动状态机事件。

### Files to Reference
- `packages/core/docs/继电器开关量主动上报协议规范.md`
- `packages/core/src/relay/controller.ts`
- `packages/core/src/relay/validation.ts`
- `packages/core/src/relay/reset.ts`
- `packages/core/src/state-machines/monitor-machine.ts`
- `packages/core/src/state-machines/apply-ammo-machine.ts`
- `packages/core/src/business-logic/relay-status-aggregator.ts`

### Technical Decisions
- 控制命令使用 A1 短帧（10 bytes），无需 A3 长帧。
- 主动上报帧解析后保留：继电器状态（SL）、输入电平（KL）、边沿触发（OH/OL）。
- 对外 API 不变：`RelayCommandBuilder.close/open/queryRelayStatus/queryInputStatus` 等方法继续存在，但行为适配新协议。
- 不要求向后兼容，旧 ASCII 状态解析移除或废弃。

## Implementation Plan

### Tasks
- [x] 定义新协议数据结构与解析函数：
  - 校验帧头 `EE FF` 与功能码 `C0`。
  - 解析 `SL/KL/OH/OL` 位图（1-8 路，bit0 -> 路1）。
  - 产出统一的 `RelayStatus` / 新增 `RelayInputEvent` 等类型。
- [x] 重构 `RelayCommandBuilder`：
  - `close/open` 生成 A1 短帧，使用控制位/使能位逻辑。
  - `queryRelayStatus/queryInputStatus` 若不再支持轮询，保留 API 但返回空或协议定义的读取指令（若需保留查询）。
- [x] 更新 `validation.ts`：
  - 新增帧长/帧头/功能码/位图校验。
- [x] 更新 `monitor-machine`：
  - 接收 UDP 数据后按 Hex 帧解析，触发 `RelayStatusAggregator` 更新。
  - 事件触发逻辑基于 `OH/OL` 边沿与 `KL` 状态。
- [x] 复核 `reset.ts` 与 `apply-ammo-machine.ts`：
  - 确保命令构建依旧可通过 `RelayCommandBuilder` 调用。

### Acceptance Criteria
- [x] 设备主动上报帧 `EE FF C0 ...` 可被正确解析并触发事件（上升沿/下降沿）。
- [x] `RelayCommandBuilder.open/close` 生成 A1 协议帧，且适配 1-8 路控制。
- [x] `monitor-machine` 不依赖 `dostatus` 字符串，业务事件触发逻辑保持一致。
- [x] 外部 API 不变，`packages/core/src/relay/index.ts` 导出结构保持一致。

## Additional Context

### Dependencies
- Zod（`packages/core/src/relay/validation.ts`）
- `HardwareCommunicationManager`（发送 UDP 帧）

### Testing Strategy
- 若补充测试：新增 `packages/core/src/relay/*.test.ts` 覆盖
  - 位图解析（SL/KL/OH/OL）
  - A1 命令生成的帧字节与校验和
  - Monitor 处理主动上报帧的更新逻辑

### Notes
- 新协议中 `Checksum` 字段可忽略，但需保留帧长度校验。
- 默认不带锁模式仅上升沿上报：需考虑 `OH` 触发时的业务行为。
