# Specification - Fix Type Errors in Poller Machine

## 1. Overview
修复 `src/state-machines/poller-machine.ts` 中与 XState 状态机 `context` 和 `input` 相关的 TypeScript 类型错误。目前由于缺乏明确的类型定义，导致 `input.hardware` 等属性无法被正确识别。

## 2. Functional Requirements
- **类型修复**：在 `poller-machine.ts` 中引入并应用 `src/types/index.ts` 或相关硬件模块中定义的正确类型。
- **状态机类型增强**：更新 `setup` 或 `createMachine` 的类型参数（如 `types: {} as { context: ...; input: ... }`），确保 `context` 和 `input` 的结构在状态机内部各处都能获得正确的智能提示和类型检查。
- **一致性校验**：确保修复后的类型定义与硬件初始化器（`initializer.ts`）和管理层（`manager.ts`）提供的硬件实例类型保持一致。

## 3. Non-Functional Requirements
- **代码整洁**：遵循现有的 TypeScript 编码规范，避免使用 `any`。
- **类型安全**：确保所有状态机动作（actions）和守护条件（guards）都能获得正确的类型推断。

## 4. Acceptance Criteria
- 运行 `bun x tsc --noEmit` 时，`src/state-machines/poller-machine.ts` 不再报错。
- 状态机的功能逻辑保持不变，且 `poller-machine.test.ts` 中的所有测试用例通过。

## 5. Out of Scope
- 对 `poller-machine.ts` 进行逻辑重构或增加新功能。
- 修改其他无关文件的类型定义。