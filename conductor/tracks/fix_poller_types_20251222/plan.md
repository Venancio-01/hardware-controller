# Implementation Plan - Fix Type Errors in Poller Machine

## Phase 1: 现状分析与基线确认 [checkpoint: b96d9d1]
- [x] **Task 1: 确定所有类型错误** 322939c
  - 运行 `bun x tsc --noEmit` 并记录 `src/state-machines/poller-machine.ts` 中的所有报错信息。
- [x] **Task 2: 验证现有测试基线** 5cd918b
  - 运行 `bun test test/state-machines/poller-machine.test.ts` 确保在修复类型前逻辑测试是正常通过的。
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: 现状分析与基线确认' (Protocol in workflow.md)**

## Phase 2: 类型重构与修复 (TDD 模式) [checkpoint: 579e958]
- [x] **Task 1: 定义状态机类型契约 (Red Phase)** 4702b2e
- [x] **Task 2: 实施类型修复 (Green Phase)**
  - 修正状态机内部 `context` 初始化和 `input` 处理的逻辑，使其符合定义的接口。
  - 确保所有动作（actions）和赋值（assign）均符合类型安全要求。
- [x] **Task 3: 验证修复结果** 4f6c9ff
  - 再次运行 `bun x tsc --noEmit` 确认该文件已无类型错误。
- [x] **Task: Conductor - User Manual Verification 'Phase 2: 类型重构与修复' (Protocol in workflow.md)**

## Phase 3: 最终验证与交付
- [x] **Task 1: 全量测试与覆盖率检查** 2b6cf94
  - 运行所有测试用例，确保类型修复未引入回归。
  - 检查代码覆盖率，确保相关代码仍被充分覆盖。
- [x] **Task 2: 代码清理与提交** 463271e
  - 移除任何临时的调试代码。
  - 按照规范提交代码并附加 Git Notes。
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: 最终验证与交付' (Protocol in workflow.md)**