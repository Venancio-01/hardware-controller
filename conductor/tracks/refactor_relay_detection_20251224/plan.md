# Implementation Plan - Refactor Relay Detection into MonitorMachine

本计划旨在通过让 `MonitorMachine` 直接订阅硬件数据并下沉检测逻辑，实现更清晰的架构，并彻底修复继电器索引误匹配的 Bug。

## Phase 1: 基础工具类重构与单元测试 (TDD)
**目标**：在 `RelayStatusAggregator` 中实现基于索引的检测方法，并验证其准确性。

- [x] **Task 1.1**: 为 `RelayStatusAggregator` 编写单元测试，模拟 CH1 和 CH13 的冲突场景 [325e94c]
- [x] **Task 1.2**: 在 `RelayStatusAggregator` 中实现 `hasIndexChanged` 方法并添加边界检查 [325e94c]
- [x] **Task 1.3**: 验证 Task 1.1 的测试通过并达到 >80% 覆盖率 [325e94c]
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)**

## Phase 2: MonitorMachine 订阅与事件下沉 (TDD)
**目标**：重构 `MonitorMachine` 使其具备直接订阅硬件数据的能力，并能发出语义化事件。

- [ ] **Task 2.1**: 扩展 `MonitorMachine` 单元测试，模拟硬件管理器回调触发业务事件
- [ ] **Task 2.2**: 在 `MonitorMachine` 中实现对 `HardwareCommunicationManager` 的直接订阅逻辑
- [ ] **Task 2.3**: 在 `MonitorMachine` 内部集成 `RelayStatusAggregator` 并实现逻辑分发（发送 `sendParent`）
- [ ] **Task 2.4**: 验证 `MonitorMachine` 的所有测试通过
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: MonitorMachine Subscription' (Protocol in workflow.md)**

## Phase 3: 系统集成与清理
**目标**：移除 `index.ts` 中的冗余逻辑，完成最终集成。

- [ ] **Task 3.1**: 重构 `index.ts` 移除 `manager.onIncomingData` 中的继电器业务代码
- [ ] **Task 3.2**: 调整 `MainMachine` 确保其作为父 Actor 能够正确接收并转发 `MonitorMachine` 的语义化事件
- [ ] **Task 3.3**: 编写端到端集成测试，验证“硬件原始数据 -> MonitorMachine -> MainMachine -> 业务流转”的完整闭环
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Integration & Cleanup' (Protocol in workflow.md)**