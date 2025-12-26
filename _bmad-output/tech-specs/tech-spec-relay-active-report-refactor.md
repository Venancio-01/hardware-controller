# Tech-Spec: 移除轮询逻辑，采用硬件主动上报机制

**Created:** 2025-12-26
**Status:** Ready for Development
**Author:** 青山
**Related Docs:** [`继电器开关量主动上报协议规范.md`](../../../packages/core/docs/继电器开关量主动上报协议规范.md)

---

## Overview

### Problem Statement

当前系统在 `packages/core/src/app.ts` 中使用定时轮询机制来查询继电器状态，每隔 `QUERY_INTERVAL`（默认 1000ms）发送 `monitor_tick` 事件。然而，根据硬件协议规范，设备已经配置为"主动上传"模式，会在输入端口状态发生变化时主动推送数据帧（功能码 `C0`）。

**当前问题：**
- ❌ 不必要的网络流量和 CPU 开销（每秒一次轮询）
- ❌ 最多 1 秒的状态变化延迟（取决于轮询间隔）
- ❌ 代码维护负担（同时维护轮询和主动上报两套逻辑）

### Solution

**完全移除轮询机制，仅依赖硬件主动上报。**

现有的 `monitor-machine.ts` 已经实现了基于 `RELAY_DATA_RECEIVED` 事件的监听逻辑，这部分代码是正确的。本次重构主要是清理过时的轮询相关代码。

### Scope (In/Out)

**✅ In Scope:**
1. 移除 `app.ts` 中的定时轮询逻辑
2. 移除 `main-machine.ts` 中的 `monitor_tick` 事件处理
3. 移除 `monitor-machine.ts` 中未使用的 `TICK` 事件类型和状态
4. 移除 `types/state-machine.ts` 中的 `MonitorTickEvent` 类型
5. 移除 `config/index.ts` 中的 `QUERY_INTERVAL` 配置项
6. 更新 `.env.example` 文件

**❌ Out of Scope:**
1. ✅ 主动上报协议解析逻辑（已完成，位于 `relay/controller.ts`）
2. ✅ `RELAY_DATA_RECEIVED` 事件处理逻辑（已完成，位于 `monitor-machine.ts`）
3. 硬件通信层实现（`hardware/manager.ts`）
4. 业务逻辑状态机（`alarm-machine.ts`, `apply-ammo-machine.ts`）

---

## Context for Development

### Codebase Patterns

**项目使用的技术栈：**
- **状态机框架：** XState v5
- **通信方式：** UDP/TCP (RS485 硬件设备)
- **日志系统：** 结构化日志（`logger/index.ts`）
- **配置管理：** Zod schema 验证 + 环境变量

**代码组织结构：**
```
packages/core/src/
├── app.ts                      # 应用入口，包含轮询逻辑（需修改）
├── state-machines/
│   ├── main-machine.ts         # 主状态机，转发 monitor_tick（需修改）
│   └── monitor-machine.ts      # 监听子状态机，处理主动上报（需清理 TICK）
├── types/
│   └── state-machine.ts        # 事件类型定义（需移除 MonitorTickEvent）
├── config/
│   └── index.ts                # 配置 Schema（需移除 QUERY_INTERVAL）
└── relay/
    └── controller.ts           # 协议解析（✅ 已实现 parseActiveReportFrame）
```

### Files to Reference

**需要修改的文件：**

1. **`packages/core/src/app.ts`**
   - 移除第 22 行：`queryLoop` 变量声明
   - 移除第 42 行：初始 `monitor_tick` 发送
   - 移除第 44-47 行：`setInterval` 轮询循环
   - 移除第 52 行：`clearInterval(queryLoop)`

2. **`packages/core/src/state-machines/main-machine.ts`**
   - 移除第 36-38 行：`monitor_tick` 事件处理器

3. **`packages/core/src/state-machines/monitor-machine.ts`**
   - 移除第 19 行：`TICK` 事件类型
   - 简化状态机：移除 `idle` 和 `waiting` 状态（如果没有其他用途）

4. **`packages/core/src/types/state-machine.ts`**
   - 移除第 40 行：`MonitorTickEvent` 类型定义
   - 从 `SystemEvent` 联合类型中移除 `MonitorTickEvent`

5. **`packages/core/src/config/index.ts`**
   - 移除第 235-239 行：`QUERY_INTERVAL` 配置项

6. **`packages/core/.env.example`**
   - 移除第 37 行：`QUERY_INTERVAL=1000`

**关键参考文件（无需修改）：**

- **`packages/core/docs/继电器开关量主动上报协议规范.md`** - 协议文档
- **`packages/core/src/relay/controller.ts`** - `parseActiveReportFrame()` 函数解析 C0 协议帧
- **`packages/core/src/business-logic/relay-status-aggregator.ts`** - 状态聚合逻辑

### Technical Decisions

**Q1: 是否保留 MonitorMachine 的 `idle` 和 `waiting` 状态？**

**决策：** 如果状态机仅依赖主动上报事件，可以考虑简化为单状态或使用 XState 的 `always` 激活方式。但需要检查是否有其他启动/停止逻辑依赖这些状态。

**建议：** 先保持状态机结构不变，仅移除 `TICK` 事件类型。后续可以单独优化状态机结构。

**Q2: 是否需要在启动时进行一次性状态同步？**

**决策：** 不需要。硬件设备在连接时会主动发送当前状态（根据协议文档的描述），主动上报机制已经包含了初始状态。

**Q3: 如何验证重构后的功能正确性？**

**决策：**
1. 手动测试：触发硬件开关，观察日志中是否出现 `RELAY_DATA_RECEIVED` 事件
2. 检查业务逻辑是否正常触发（`apply_request`, `authorize_request`, `cabinet_lock_changed` 等事件）
3. 对比重构前后的网络流量（应该显著减少）

---

## Implementation Plan

### Tasks

- [ ] **Task 1: 移除 `app.ts` 中的轮询逻辑**
  - 删除 `queryLoop` 变量声明
  - 删除 `setInterval` 轮询循环
  - 删除初始 `monitor_tick` 发送
  - 删除 `shutdown()` 函数中的 `clearInterval(queryLoop)`

- [ ] **Task 2: 清理 `main-machine.ts` 的事件处理**
  - 移除 `monitor_tick` 事件处理器（第 36-38 行）

- [ ] **Task 3: 简化 `monitor-machine.ts`**
  - 移除 `MonitorEvent` 类型中的 `TICK` 事件
  - 检查是否可以简化状态机结构（可选）

- [ ] **Task 4: 更新类型定义**
  - 移除 `MonitorTickEvent` 类型
  - 从 `SystemEvent` 联合类型中移除该类型

- [ ] **Task 5: 清理配置项**
  - 移除 `QUERY_INTERVAL` 配置项（config/index.ts）
  - 从 `.env.example` 中删除该配置

- [ ] **Task 6: 验证功能**
  - 启动应用，检查日志中不再出现"开始 UDP 查询循环"
  - 触发硬件开关，验证状态变化能被正确捕获
  - 检查业务逻辑（报警、授权等）是否正常工作

### Acceptance Criteria

- [ ] **AC 1:** 应用启动后，日志中不再出现"开始 UDP 查询循环"消息
- [ ] **AC 2:** 硬件开关触发时，日志中出现 `RELAY_DATA_RECEIVED` 事件记录
- [ ] **AC 3:** 业务逻辑事件正常触发（`apply_request`, `authorize_request`, `cabinet_lock_changed`, `alarm_cancel_toggled`）
- [ ] **AC 4:** 代码编译通过，无 TypeScript 类型错误
- [ ] **AC 5:** 配置文件验证通过，移除了 `QUERY_INTERVAL` 相关配置

---

## Additional Context

### Dependencies

**上游依赖：**
- 硬件设备已配置为"主动上传"模式
- `hardware/manager.ts` 的 `onIncomingData` 回调正常工作
- `relay/controller.ts` 的 `parseActiveReportFrame()` 正确解析 C0 协议帧

**下游影响：**
- 无下游依赖（本次重构仅移除轮询逻辑，不影响外部接口）

### Testing Strategy

**单元测试：**
- 暂无相关单元测试需要更新（轮询逻辑本身没有测试）

**集成测试：**
- 手动测试：触发硬件开关，观察日志输出
- 验证业务逻辑状态机是否正常响应

**性能测试：**
- 对比重构前后的网络流量统计
- 验证状态变化响应延迟是否降低（从最多 1 秒降低到实时）

### Notes

**⚠️ 注意事项：**

1. **确保硬件配置正确**
   - 硬件设备必须配置为"主动上传"模式（通常通过硬件跳线或配置工具）
   - 如果硬件未配置为主动上报，重构后将无法获取状态更新

2. **日志级别**
   - 建议在测试时启用 DEBUG 日志级别，观察 `RELAY_DATA_RECEIVED` 事件详情
   - 关键日志位置：`monitor-machine.ts:38-43` (数据接收)

3. **回滚方案**
   - 如果发现硬件主动上报不稳定，可以临时恢复轮询逻辑
   - 建议保留旧代码的 Git 历史记录，方便回滚

**📚 参考资料：**

- 协议文档：`packages/core/docs/继电器开关量主动上报协议规范.md`
- XState 文档：https://xstate.js.org/docs/versions/v5/
- 相关 Issue/PR：（如果有，请在此添加链接）

---

## Appendix: Protocol Reference

**主动上报协议帧结构（9 字节）：**

```
Offset | Field | Value  | Description
-------|-------|--------|------------------------------------------
0-1    | Header| EE FF  | 帧头
2      | Func  | C0     | 2-8路开关量主动上报
3      | Addr  | 01     | 设备地址
4      | SL    | Bitmap | 继电器当前状态
5      | KL    | Bitmap | 输入端口当前电平状态
6      | OH    | Bitmap | 上升沿触发掩码
7      | OL    | Bitmap | 下降沿触发掩码
8      | Check | XX     | 校验位
```

**事件触发逻辑：**
- 遍历 `OH` 字节的每一位 → 触发 `Input_On` 事件（上升沿）
- 遍历 `OL` 字节的每一位 → 触发 `Input_Off` 事件（下降沿）
- 更新全局状态缓存：`KL` 和 `SL` 字节

**示例报文：** `EE FF C0 01 00 11 01 00 D3`
- 第 1 路输入刚刚触发上升沿（按下）
- 第 1 路和第 5 路输入当前为 ON
- 所有继电器均为 OFF
