# Specification: Externalize Hardware Indices to Configuration

## 1. Overview
当前项目中，`src/business-logic/apply-ammo-flow.ts` 里的输入状态索引（如 `APPLY_INDEX`, `CABINET_DOOR_INDEX` 等）以及 `src/state-machines/apply-ammo-machine.ts` 里的继电器操作索引（如 `open(2)`, `close(8)`）是硬编码的。为了提高系统的灵活性和可维护性，本项目旨在将这些索引提取到环境变量 (`.env`) 中，并通过 Zod 进行严格的类型和范围校验。

## 2. Functional Requirements
- **环境变量化**：
  - 将 `apply-ammo-flow.ts` 中定义的 16 个输入索引（0-15）移动到 `.env`。
  - 将 `apply-ammo-machine.ts` 中使用的继电器操作索引（电锁、柜体报警灯、控制端报警灯等）移动到 `.env`。
- **配置校验**：
  - 在 `src/config/index.ts` 中扩展 Zod Schema，确保所有提取的索引均为数字且在合法范围内（通常为 0-15 或 1-8，视硬件协议而定）。
  - 提供合理的默认值或要求必须配置。
- **代码重构**：
  - 修改 `src/business-logic/apply-ammo-flow.ts`，从 `config` 对象获取索引而非使用本地常量。
  - 修改 `src/state-machines/apply-ammo-machine.ts`，在构造 `RelayCommandBuilder` 指令时使用语义化的配置项。

## 3. Non-Functional Requirements
- **健壮性**：系统启动时若配置项缺失或非法，应通过 Zod 抛出清晰的错误并阻止启动。
- **可读性**：在配置中使用语义化的名称（如 `RELAY_CABINET_ALARM` 而非 `RELAY_INDEX_8`）。

## 4. Acceptance Criteria
- [ ] 应用能够成功加载 `.env` 中的索引配置并正常启动。
- [ ] 若 `.env` 中索引配置非法（如非数字、超出范围），系统在启动阶段报错。
- [ ] 现有的业务流程（供弹申请、柜门监控等）功能保持不变。
- [ ] 所有受影响的测试用例（单元测试与集成测试）通过。

## 5. Out of Scope
- 修改业务流程的状态机逻辑。
- 重构与硬件索引无关的其他硬编码常量。
