# Tech-Spec: 修复配置读取 400 并对齐 .env.example

**Created:** 2025-12-26
**Status:** Implementation Complete

## Overview

### Problem Statement
前端在加载配置时请求 `/api/config` 返回 400，错误提示 `ipAddress/subnetMask/gateway/port` 缺失。根因是后端读取的 `config.json` 不包含这些必填字段，`configSchema` 校验失败直接返回 400，导致前端无法初始化表单。与此同时，期望配置字段应与 `packages/core/.env.example` 中的每一项对应，但当前 `config.json` 与 `.env.example` 在字段集合与命名上存在不一致。

### Solution
在后端增加“配置默认值与补全”机制：基于 `.env.example` 生成完整默认配置（含网络字段默认 `127.0.0.1`），与现有 `config.json` 合并后再验证并返回；同时更新配置模型以保证与 `.env.example` 对齐。前端需要能接收完整配置，并在未提供字段时使用默认值而不是直接崩溃，同时保存时保持配置的完整性。

### Scope (In/Out)
**In scope**
- 修复 GET `/api/config` 返回 400 的问题（缺省字段自动补全）。
- 生成并维护与 `.env.example` 对齐的配置结构（字段集合一致）。
- 前端在读取配置时能够正确加载、展示并保存（不丢失未显示字段）。
- 默认网络配置使用 `127.0.0.1`（IP/网关）。

**Out of scope**
- UI 全量重构为“所有 env 字段可视化编辑”（除非确认需要）。
- 核心硬件逻辑或业务流程变更。

## Context for Development

### Codebase Patterns
- 后端 `ConfigService` 使用 shared 的 Zod schema 校验 `config.json`，校验失败即返回 400。
- 前端 `ConfigForm` 使用 `react-hook-form` + `configSchema` 做实时验证，依赖 `/api/config` 初始化数据。
- `.env.example` 的定义与 `packages/core/src/config/index.ts` 中 `envSchema` 保持一致。

### Files to Reference
- `packages/frontend/src/components/dashboard/ConfigForm.tsx`
- `packages/frontend/src/lib/api.ts`
- `packages/backend/src/services/config.service.ts`
- `packages/backend/src/routes/config.routes.ts`
- `packages/shared/src/schemas/config.schema.ts`
- `packages/shared/src/schemas/network.schema.ts`
- `packages/core/.env.example`
- `packages/core/src/config/index.ts`
- `config.json`

### Technical Decisions
- **配置补全位置**：在后端 `ConfigService.getConfig()` 读取后进行默认值合并，再进行 Zod 校验，避免 400。
- **字段对齐策略**：以 `.env.example` 为字段来源，生成默认配置对象；与现有 `config.json` 做浅/深合并，保留已有值。
- **前端数据保持**：如果后端返回包含更多字段，前端保存时需确保未显示字段不被丢失（保留完整对象）。

## Implementation Plan

### Tasks
- [x] **定义“对齐 .env.example” 的配置模型**
  - [x] 在 `packages/shared` 新增或扩展 schema，使其覆盖 `.env.example` 全字段（命名与 `.env.example` 一致或提供明确映射）。
  - [x] 明确字段类型（number/boolean/string）与默认值策略。

- [x] **生成默认配置并补全缺失字段**
  - [x] 后端新增工具函数：从 `packages/core/.env.example` 生成默认配置对象（含网络默认：`ipAddress/gateway=127.0.0.1`，`subnetMask=255.255.255.0`，`port=80`）。
  - [x] `ConfigService.getConfig()` 读取 `config.json` 后与默认配置合并，再执行 Zod 校验。
  - [x] 当 `config.json` 不存在时，返回默认配置（并可选择写回）。

- [x] **前端保持完整配置对象**
  - [x] 在 `ConfigForm` 中确保保存时提交完整配置对象（不仅是表单可见字段）。
  - [x] 若部分字段不在 UI 中，保留其原值（从 `/api/config` 返回的对象中保留）。

- [x] **错误处理与回归测试**
  - [x] 后端新增单元测试：缺失网络字段时 GET `/api/config` 不返回 400。
  - [x] 前端新增/更新测试：配置拉取成功、表单初始化、保存不丢字段。

### Acceptance Criteria
- [ ] GET `/api/config` 在 `config.json` 缺少网络字段时不再返回 400，前端可正常加载。
- [ ] 返回配置包含 `.env.example` 对应字段集合（字段一致）。
- [ ] 前端保存配置不会丢失未显示字段。
- [ ] 默认网络配置使用 `127.0.0.1`，且仍满足 Zod 校验。

## Additional Context

### Dependencies
- 依赖 shared schema 与 core env schema 的一致性；需要明确字段命名规则（是否直接使用 `.env.example` 的大写 key）。

### Testing Strategy
- 后端：`ConfigService` + `GET /api/config` 集成测试覆盖“缺字段 -> 自动补全”。
- 前端：组件测试验证 `apiFetch('/api/config')` 成功后表单初始化与保存。

### Notes
- 若确认需要“所有 env 字段可视化编辑”，需扩展 UI 并新增分组展示；这会显著扩大改动范围。
- 若字段命名需从 ENV 风格转为 UI 友好的 camelCase，需补充明确映射表与转换逻辑。
