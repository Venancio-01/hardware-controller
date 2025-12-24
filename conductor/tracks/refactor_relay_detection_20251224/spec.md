# Specification: Refactor Relay Detection into MonitorMachine

## 1. Overview
重构继电器状态变化检测机制，将业务逻辑从 `index.ts` 迁移至 `MonitorMachine` (Actor)。通过让 `MonitorMachine` 直接订阅硬件管理器的数据流，并使用结构化的索引比较，修复 CH1/CH13 误匹配 Bug，同时大幅简化 `index.ts` 的逻辑。

## 2. Functional Requirements
### 2.1 逻辑下沉与解耦
- **移除** `index.ts` 中的继电器状态变化检测和 `mainActor.send` 逻辑。
- **增强** `MonitorMachine`：
    - 在启动时直接向 `HardwareCommunicationManager` 注册数据监听器。
    - 内部集成 `RelayStatusAggregator` 负责数据对比。
- **语义化事件**：当检测到特定继电器变化时，由 `MonitorMachine` 发送 `sendParent` 事件给 `MainMachine`：
    - `CH1 (APPLY_INDEX)` 闭合/断开 -> 发送 `apply_request` / `finish_request`。
    - `CH13 (AUTH_INDEX)` 闭合/断开 -> 发送 `authorize_request` / `refuse_request`。
    - `CH2 (ELECTRIC_LOCK_OUT_INDEX)` 变化 -> 发送 `cabinet_lock_changed`（携带 `isClosed` 状态）。

### 2.2 修复子串匹配 Bug
- 严禁使用 `changeDescriptions.some(d => d.includes('CHx'))` 作为业务判断依据。
- 必须在 `RelayStatusAggregator` 中实现并使用 `hasIndexChanged(index: number, combinedUpdate: RelayCombinedUpdate)` 方法进行精确匹配。

### 2.3 数据流转优化
- **直接监听**：`MonitorMachine` 在其生命周期内直接处理 `HardwareCommunicationManager` 的数据回调，无需经过 `index.ts` 或 `MainMachine` 中转。
- **去中心化**：`index.ts` 仅负责系统引导和基础进程管理，不再干预具体的硬件状态逻辑。

## 3. Non-Functional Requirements
- **可观察性**：保留并优化继电器变化的结构化日志输出（由 `MonitorMachine` 负责打印）。
- **类型安全**：确保硬件管理器回调与状态机内部逻辑之间的类型一致性。
- **并发安全**：确保轮询产生的查询结果与实时推送的响应在 `RelayStatusAggregator` 中能正确合并且不产生状态跳变。

## 4. Acceptance Criteria
- [ ] `index.ts` 变更为纯粹的引导脚本，不再包含继电器业务逻辑。
- [ ] `MonitorMachine` 成功订阅硬件数据并能正确识别状态变化。
- [ ] 单元测试验证：当 CH13 变化时，不会误触发 CH1 对应的业务逻辑。
- [ ] 集成测试验证：硬件数据流能够直接驱动 `MonitorMachine` 产生业务事件。

## 5. Out of Scope
- 不涉及硬件协议本身的更改。
- 不修改语音播报模块的底层驱动。