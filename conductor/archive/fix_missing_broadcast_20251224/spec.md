# Track Specification: Fix Missing apply_request Voice Broadcast on CH1 Closure

## 1. Overview
修复在硬件继电器 CH1（通常对应申请按钮）闭合时，系统未能触发 `apply-ammo-machine.ts` 中 `broadcastApply` 语音播报的问题。虽然日志显示继电器状态已成功从“断开”切换为“闭合”，但后续的业务逻辑或状态机转换未按预期执行。

## 2. Functional Requirements
- **事件流验证**：调查并确保 `src/index.ts` 中的 `onIncomingData` 逻辑在检测到 CH1 变化时，能够正确构造并向 `MainMachine` 发送 `apply_request` 事件。
- **状态机协调**：确保 `MainMachine` 在接收到 `apply_request` 后，能够正确切换至 `normal` 状态，并成功启动/通知 `applyAmmo` 子执行器。
- **动作执行**：确保 `applyAmmo` 状态机在启动或接收到申请信号后，立即执行 `broadcastApply` 动作。
- **调试增强**：在事件处理的关键路径（index.ts -> MainMachine -> applyAmmoMachine）增加必要的调试日志，以便追踪事件丢失的具体环节。

## 3. Non-Functional Requirements
- **确定性**：确保在任何系统状态下（只要是合法的申请时机），CH1 的闭合都能 100% 触发语音反馈。
- **低延迟**：从检测到继电器变化到触发语音播报的逻辑处理延迟应保持在毫秒级。

## 4. Acceptance Criteria
- 在模拟硬件响应（发送 `dostatus10000000`）时，日志中能明确看到 `broadcastApply` 动作被调用的记录。
- 系统在 CH1 闭合后，`MainMachine` 的状态能正确反映为 `normal`。
- 现有的集成测试及新增的针对该 Bug 的回归测试全部通过。

## 5. Out of Scope
- 修改除 CH1 逻辑外的其他继电器通道处理规则。
- 重新设计状态机架构（仅限于修复现有架构下的 Bug）。
