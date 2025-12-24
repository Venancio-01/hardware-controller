# 实施计划 (plan.md) - 从 Bun 迁移到 Node.js LTS (v22)

## 阶段 1: 基础设施与包管理器迁移
目标：建立 Node.js 运行环境，使用 pnpm 替换 bun，并确保基本依赖安装正常。

- [x] 任务: 更新环境配置。修改 `package.json` 中的 `engines` 字段，指定 Node.js v22，并创建/更新 `.npmrc`。 61541ea
- [x] 任务: 迁移包管理器。移除 `bun.lockb` 和 `bunfig.toml`，使用 `pnpm install` 生成 `pnpm-lock.yaml`。 3e5b3b7
- [x] 任务: 更新构建脚本。修改 `package.json` 中的 `scripts`，将 `bun run` 替换为 `pnpm` 或 `node`。 087b8f0
- [x] 任务: Conductor - User Manual Verification '阶段 1: 基础设施与包管理器迁移' (Protocol in workflow.md) [checkpoint: 70fb6a2]

## 阶段 2: 测试框架迁移 (Vitest)
目标：将测试运行器从 Bun Test 迁移到 Vitest，并确保所有现有测试通过。

- [x] 任务: 安装与配置 Vitest。安装 `vitest` 相关依赖，并创建 `vitest.config.ts`。 ae7974e
- [x] 任务: 迁移现有测试用例。将测试文件中的 `expect`, `test`, `describe`, `mock` 等从 Bun 全局变量迁移到 Vitest。 1919597
- [x] 任务: 验证测试套件。确保执行 `pnpm test` 时，所有已有的 20+ 个测试文件全部通过。 1919597
- [ ] 任务: Conductor - User Manual Verification '阶段 2: 测试框架迁移 (Vitest)' (Protocol in workflow.md)

## 阶段 3: 源码中的 Bun API 替换
目标：移除代码中对 `Bun.*` 全局 API 的直接依赖，替换为 Node.js 原生 API。

- [ ] 任务: 识别 Bun API 引用。使用 grep 查找项目中所有 `Bun.` 的调用（如 `Bun.file`, `Bun.serve`, `Bun.password` 等）。
- [ ] 任务: 替换文件/网络 API。将 `Bun.file` 替换为 `fs/promises`，将 `Bun.serve`（如有）替换为 Node.js 原生 http 或 Express/Fastify。
- [ ] 任务: 替换其他 Bun 特有 API。
- [ ] 任务: Conductor - User Manual Verification '阶段 3: 源码中的 Bun API 替换' (Protocol in workflow.md)

## 阶段 4: 最终验证与清理
目标：确保项目在 Node.js 环境下能够完整构建、运行并保持功能一致性。

- [ ] 任务: 完整构建验证。运行 `pnpm run build` 确保 TypeScript 编译无误。
- [ ] 任务: 运行时验证。在 Node.js 环境下启动项目，验证 TCP/UDP 通信、语音播报及业务流转是否正常。
- [ ] 任务: 清理冗余文件。删除任何残留的 Bun 相关配置文件。
- [ ] 任务: Conductor - User Manual Verification '阶段 4: 最终验证与清理' (Protocol in workflow.md)
