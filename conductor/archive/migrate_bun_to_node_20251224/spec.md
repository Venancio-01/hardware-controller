# 规格说明书 (spec.md) - 将项目从 Bun 迁移到 Node.js LTS

## 1. 概述 (Overview)
本任务旨在将 `node-switch` 项目从 Bun 运行环境完全迁移到 Node.js 生态。包括运行时、包管理器、全局 API 引用以及测试框架的替换，以提高生产环境的兼容性和稳定性。

## 2. 功能需求 (Functional Requirements)
- **环境切换**：
    - 将运行时从 Bun 切换到 Node.js v22 (LTS)。
    - 将包管理器从 Bun 切换到 pnpm。
- **依赖管理**：
    - 移除 `bun.lock` 和 `bunfig.toml`。
    - 生成 `pnpm-lock.yaml`。
    - 在 `package.json` 中更新引擎声明 (`engines`)。
- **API 替换**：
    - 将代码中引用的 `Bun.*` 全局 API（如 `Bun.file`, `Bun.serve` 等）替换为 Node.js 原生 API 或相应的三方库（如 `fs/promises`, `http` 等）。
- **测试框架迁移**：
    - 移除对 `Bun test` 的依赖。
    - 引入 **Vitest** 作为新的测试运行器。
    - 迁移现有测试用例，确保 API 兼容性并成功运行。
- **构建与运行脚本**：
    - 更新 `package.json` 中的 `scripts`，确保 `dev`, `build`, `test`, `start` 等命令在 Node.js 环境下正常工作。

## 3. 非功能需求 (Non-Functional Requirements)
- **性能保持**：迁移后启动速度和执行效率应处于可接受范围。
- **代码规范**：保持现有的 TypeScript 严格检查和代码风格。

## 4. 验收标准 (Acceptance Criteria)
- [ ] 所有 `Bun.*` API 均已从源码中移除或替换。
- [ ] 使用 `pnpm install` 能正常安装所有依赖。
- [ ] 执行 `pnpm test` 时，所有现有测试（已迁移至 Vitest）全部通过。
- [ ] 执行 `pnpm run build` 能成功生成 dist 文件（使用 tsc 或相应构建工具）。
- [ ] 项目能在 Node.js v22 环境下通过 `pnpm start` 正常启动并运行。

## 5. 超出范围 (Out of Scope)
- 暂不涉及业务逻辑的重构。
- 暂不涉及部署环境（如 Dockerfile）的修改（除非必要）。
