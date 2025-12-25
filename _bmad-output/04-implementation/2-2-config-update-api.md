# Story 2.2: 实现后端配置更新 API (Config Update API)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 接收并处理前端发送的配置更新请求,
So that 用户的更改可以被持久化保存到 `config.json` 文件中。

## Acceptance Criteria

1. **API 端点实现**:
   - 实现 `PUT /api/config` 接口。
   - 接口接收 JSON 格式的配置数据。

2. **数据验证**:
   - 使用 `packages/shared` 中定义的 `configSchema` 验证请求体数据。
   - 验证失败时返回 HTTP 400，并包含详细的错误信息（使用中文）。

3. **配置持久化**:
   - 验证通过后，将新配置写入 `config.json` 文件。
   - 写入操作必须是原子的（Atomic Write），防止文件损坏。

4. **自动备份**:
   - 在写入新配置之前，必须将当前的 `config.json` 复制为 `config.backup.json`。

5. **响应反馈**:
   - 成功更新后，返回 HTTP 200。
   - 响应体应包含 `needsRestart: true` 标志，提示前端需要重启系统。

## Technical Requirements

### 1. ConfigService 增强

修改 `packages/backend/src/services/config.service.ts`，添加 `updateConfig` 方法。

**功能要求**:
- **输入**: 完整的配置对象 (`Config` 类型)。
- **验证**: 再次使用 `configSchema.parse` (或 `safeParse`) 确保数据有效性。
- **备份逻辑**:
  - 检查 `config.json` 是否存在。
  - 如果存在，使用 `fs.copyFile` 将其复制到 `config.backup.json` (路径应相对于 `this.configPath`)。
- **原子写入逻辑**:
  - 使用 `fs.writeFile` 将新配置写入临时文件（例如 `config.json.tmp`）。**注意：临时文件必须与原文件在同一目录，以确保 `rename` 操作的原子性。**
  - 使用 `fs.rename` 将临时文件重命名为 `config.json`。
  - 确保使用 `JSON.stringify(data, null, 2)` 格式化输出，保持可读性。

### 2. API 路由实现

修改 `packages/backend/src/routes/config.routes.ts`。

**功能要求**:
- 添加 `PUT /` 路由处理程序。
- 调用 `await configService.updateConfig(req.body)`。
- 处理可能的错误：
  - 验证错误 (ZodError) -> 400 Bad Request
  - 文件系统错误 -> 500 Internal Server Error
- 成功响应格式:
  ```json
  {
    "success": true,
    "message": "配置已保存",
    "needsRestart": true
  }
  ```

### 3. 数据类型同步

- 确保后端使用的 `Config` 类型与 `packages/shared` 中的定义完全一致。
- 确保正确导入 `configSchema` (`import { configSchema } from 'shared'`)。

## Architecture Compliance

- **Service Layer Pattern**: 所有的文件操作逻辑必须封装在 `ConfigService` 中。
- **Error Handling**: 遵循架构文档定义的错误响应格式。
- **Logging**: 引入 `logger` (`import { logger } from '../utils/logger.js'`) 并记录关键操作（备份、写入、错误）。
- **Monorepo Structure**: 遵守 `packages/backend` 的目录结构。

## File Structure Requirements

### Modify

- `packages/backend/src/services/config.service.ts`
- `packages/backend/src/routes/config.routes.ts`

### New

- `packages/backend/src/routes/__tests__/config.routes.test.ts`
- `packages/backend/src/services/__tests__/config.service.test.ts` (Modify/New)

## Testing Strategy

### 1. Unit Tests (ConfigService)

- **Mocking**: 模拟 `fs/promises` 模块。
- **Test Cases**:
  - `updateConfig` 应该在写入前创建备份。
  - `updateConfig` 应该使用原子写入模式（write temp -> rename）。
  - `updateConfig` 应该在数据无效时抛出错误。

### 2. Integration Tests (API Route)

- 使用 `supertest` (如果可用) 或 `vitest` 集成测试。
- **Test Cases**:
  - `PUT /api/config` 发送有效数据 -> 200 OK & needsRestart: true。
  - `PUT /api/config` 发送无效数据 -> 400 Bad Request。

## Dev Notes

- **原子写入重要性**: 在工业/嵌入式环境中，断电可能随时发生。直接写入目标文件可能导致文件损坏，原子写入是必须的。
- **路径处理**: 使用 `path.join` 处理所有文件路径。

## Project Context Reference

- **Backend Rules**:
  - 使用 `fs/promises` 进行异步文件操作。
  - 错误处理必须使用 `try-catch` 并记录日志。

## Dev Agent Record

### Agent Model Used

_To be filled by Dev Agent_

### Completion Notes List

### File List

- packages/backend/src/services/config.service.ts
- packages/backend/src/routes/config.routes.ts
- packages/backend/src/services/__tests__/config.service.test.ts

## Tasks/Subtasks

- [ ] Task 1: Enhance `ConfigService` with `updateConfig` <!-- id: task-1 -->
  - [x] Write failing unit tests for `updateConfig` (backup, atomic write, validation) <!-- id: task-1-1 -->
  - [x] Implement `updateConfig` method in `ConfigService` <!-- id: task-1-2 -->
  - [x] Verify tests pass <!-- id: task-1-3 -->
- [ ] Task 2: Implement `PUT /api/config` Route <!-- id: task-2 -->
  - [x] Write failing integration tests for `PUT /api/config` (success, invalid data, error handling) <!-- id: task-2-1 -->
  - [x] Implement `PUT /` route handler in `config.routes.ts` <!-- id: task-2-2 -->
  - [x] Verify tests pass <!-- id: task-2-3 -->
- [ ] Task 3: Final Verification <!-- id: task-3 -->
  - [x] Run full backend test suite <!-- id: task-3-1 -->
  - [x] Ensure `config.json` updates correctly in a manual test (optional but recommended) <!-- id: task-3-2 -->

### Review Follow-ups (AI)
- [ ] [AI-Review][MEDIUM] 后端配置更新API需要增强日志记录，记录配置更新前后的关键信息，便于审计和调试
- [ ] [AI-Review][MEDIUM] 文件系统操作缺少更详细的错误处理，应添加对特定文件系统错误的处理和重试逻辑
