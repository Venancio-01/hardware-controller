# Story 3.2: 实现配置更新逻辑

Status: done

## Story

As a **系统**,
I want **安全地更新配置文件**,
so that **数据完整性得到保障**.

## Acceptance Criteria

1. **Given** 一个有效的配置 Payload
   **When** 调用 `PUT /api/config`
   **Then** 后端使用 Zod Schema 验证数据
   **And** 将新配置原子写入 `config.json`
   **And** 返回成功响应，指示需要重启

## Tasks / Subtasks

- [x] Task 1: 验证现有配置更新 API 实现 (AC: #1)
  - [x] 1.1 确认 `PUT /api/config` 端点正确接收配置并调用 `configService.updateConfig()`
  - [x] 1.2 确认 `ConfigService.updateConfig()` 使用 Zod `configSchema` 验证输入
  - [x] 1.3 确认原子写入实现：先写 `.tmp` 文件，再 `rename` 到目标文件
  - [x] 1.4 确认响应格式为 `{ success: true, message: '配置已保存', needsRestart: true }`

- [x] Task 2: 验证备份与错误处理机制 (AC: #1)
  - [x] 2.1 确认 `ensureBackup()` 在更新前创建 `.backup.json` 文件
  - [x] 2.2 确认验证失败返回 400 状态码和 `validationErrors` 字段
  - [x] 2.3 确认文件系统错误被正确捕获并传递给错误处理中间件

- [x] Task 3: 验证和完善单元/集成测试 (AC: #1)
  - [x] 3.1 运行 `config.service.test.ts` 确认 `updateConfig` 测试通过
  - [x] 3.2 运行 `config.routes.test.ts` 确认 `PUT /api/config` 测试通过
  - [x] 3.3 如有需要，补充边界情况测试（如部分字段更新）

- [x] Task 4:Review Follow-ups (AI)
  - [x] [AI-Review][High] Fix Story File List discrepancies
  - [x] [AI-Review][Medium] Refactor ConfigService for robust path resolution
  - [x] [AI-Review][Medium] Add temp file cleanup

## Dev Notes

### 现有实现分析

> [!IMPORTANT]
> **大部分功能已实现**。此故事主要是验证现有 `PUT /api/config` 实现并确保其符合产品需求。

**后端 API (已实现)**:
- `PUT /api/config` → [config.routes.ts:49-77](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/backend/src/routes/config.routes.ts#L49-L77)
- `ConfigService.updateConfig()` → [config.service.ts:77-108](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/backend/src/services/config.service.ts#L77-L108)
- `ConfigService.ensureBackup()` → [config.service.ts:110-129](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/backend/src/services/config.service.ts#L110-L129)

**配置 Schema (已实现)**:
- `configSchema` = `appConfigSchema.merge(networkConfigSchema).merge(envConfigSchema)`
- [config.schema.ts](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/shared/src/schemas/config.schema.ts)

### Architecture Compliance

| 规则 | 状态 | 说明 |
|------|------|------|
| Zod 验证 | ✅ | `configSchema.safeParse()` 在写入前验证 |
| 原子写入 | ✅ | 使用 `writeFile(tempPath)` + `rename(tempPath, targetPath)` |
| 自动备份 | ✅ | `copyFile(source, backup)` 在写入前执行 |
| 错误处理 | ✅ | ZodError 返回 400，其他错误传递给中间件 |

### Critical Design Decisions

1. **原子写入模式**：先写入 `.tmp` 临时文件，成功后 `rename` 覆盖目标文件，防止写入中断导致配置损坏
2. **备份策略**：每次更新前自动备份到 `config.backup.json`
3. **验证时机**：在任何文件操作之前先验证数据，验证失败则不执行写入
4. **配置写入边界**：根据 `project-context.md`，仅 `packages/backend` 可以写入 `config.json`

### Library/Framework Requirements

| 库 | 版本 | 用途 |
|---|---|---|
| zod | 4.2.1 | Schema 验证 |
| fs/promises | Node.js 内置 | 文件操作（readFile, writeFile, copyFile, rename） |

### File Structure Notes

**关键文件**:
- `packages/backend/src/routes/config.routes.ts` - PUT 端点实现
- `packages/backend/src/services/config.service.ts` - ConfigService 类
- `packages/shared/src/schemas/config.schema.ts` - Zod Schema 定义
- `packages/backend/src/routes/__tests__/config.routes.test.ts` - 路由集成测试
- `packages/backend/src/services/__tests__/config.service.test.ts` - 服务单元测试

### Testing Requirements

**单元测试命令**:
```bash
# 运行后端所有测试
pnpm --filter backend test

# 运行特定测试文件
pnpm --filter backend test -- config.service.test.ts
pnpm --filter backend test -- config.routes.test.ts
```

**已有测试覆盖**:
- `config.service.test.ts`:
  - 应该在写入前创建备份
  - 应该使用原子写入模式
  - 应该在配置验证失败时抛出错误
- `config.routes.test.ts`:
  - 应该成功更新配置并返回 200
  - 应该在验证失败时返回 400
  - 应该在其他错误时返回 500

### Previous Story Intelligence

**Story 3.1 完成情况**:
- 验证了配置加载 (`GET /api/config`) 和前端展示
- 确认 `configSchema` 正常工作
- 发现 React 19 + @hookform/resolvers 存在测试兼容性问题（已添加错误处理）

**从 Story 3.1 学到的**:
- 后端配置服务已完全实现，包括读取和写入
- 测试环境需要全局 Zod 错误处理器
- 配置文件不存在时后端返回默认配置

### References

- [Source: _bmad-output/epics.md#Story 3.2](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md#L261-L274)
- [Source: _bmad-output/architecture.md#后端 API](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/architecture.md#L174-L224)
- [Source: _bmad-output/project-context.md#边界控制](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/project-context.md#L172-L176)
- [Source: Story 3.1](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/implementation/3-1-retrieve-and-display-current-configuration.md)

## Dev Agent Record

### Agent Model Used

Gemini 2.5

### Debug Log References

无需调试 - 所有功能已正确实现

### Completion Notes List

- ✅ **Task 1 完成**: 验证 `PUT /api/config` 端点实现正确
  - 路由在 `config.routes.ts:50-72` 正确接收配置并调用 `configService.updateConfig()`
  - `ConfigService.updateConfig()` 在 `config.service.ts:82-108` 使用 `configSchema.safeParse()` 验证
  - 原子写入在 `config.service.ts:97-102` 实现：`writeFile(tempPath)` + `rename(tempPath, targetPath)`
  - 响应格式正确：`{ success: true, message: '配置已保存', needsRestart: true }`

- ✅ **Task 2 完成**: 验证备份与错误处理机制
  - `ensureBackup()` 在 `config.service.ts:113-129` 正确创建 `.backup.json`
  - ZodError 在路由中正确处理，返回 400 + `validationErrors`
  - 其他错误通过 `next(error)` 传递给错误中间件

- ✅ **Task 3 完成**: 运行测试验证
  - `config.service.test.ts`: 6 tests passed (备份、原子写入、验证失败测试)
  - `config.routes.test.ts`: 13 tests passed (PUT 成功/400/500 测试)
  - 测试覆盖完整，无需补充

- ✅ **Review Fixes Completed**:
  - 更新 ConfigService: 改进路径解析，增加临时文件清理，修复日志调用签名
  - 更新 Story 文档: 修正 File List

### File List

- `packages/backend/src/services/config.service.ts`

## Change Log

| 日期 | 变更描述 |
|------|---------|
| 2025-12-27 | 验证并确认现有配置更新 API 实现符合 AC 要求 |
| 2025-12-27 | [Code Review] 重构 ConfigService: 优化路径解析，增加临时文件清理，修复日志签名 |
