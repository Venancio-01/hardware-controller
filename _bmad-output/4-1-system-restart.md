# Story 4.1: 实现系统重启功能 (System Restart)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 用户,
I want 能够通过 Web 界面重启系统,
So that 新的配置更改可以生效。

## Acceptance Criteria

1. **确认对话框** - 当用户点击"立即重启"按钮时，系统应弹出确认对话框，防止意外重启
2. **API 请求** - 确认后，前端应发送 `POST /api/system/restart` 请求到后端
3. **优雅关闭** - 后端接收到请求后，应执行优雅关闭（graceful shutdown）并重启进程
4. **前端反馈** - 前端应显示重启进度并在重启完成后自动重连
5. **错误处理** - 如果重启失败，应显示适当的错误信息

## Tasks / Subtasks

- [x] 后端：实现 `POST /api/system/restart` API 端点 (AC: 2, 3)
  - [x] 创建 `packages/backend/src/routes/system.routes.ts` 文件
  - [x] 实现 `RestartService` 用于管理进程重启
  - [x] 添加适当的错误处理和日志记录
- [x] 前端：添加重启按钮和确认对话框 (AC: 1)
  - [x] 在配置表单中添加重启按钮
  - [x] 使用 shadcn/ui 实现确认对话框
- [x] 前端：实现重启 API 调用 (AC: 2)
  - [x] 创建 `packages/frontend/src/services/system-api.ts` 用于重启请求
  - [x] 实现重启请求的错误处理
- [x] 前端：实现重启后自动重连 (AC: 4)
  - [x] 实现等待重启完成的逻辑
  - [x] 实现自动重连设备状态查询
- [x] 测试：编写相关测试 (AC: 3, 5)
  - [x] 后端：测试重启 API 端点
  - [x] 前端：测试重启按钮 UI 交互

## Dev Notes

- **API 端点**: `POST /api/system/restart`
- **后端实现**: 需要实现优雅关闭，确保所有状态机 actor 和硬件连接正确关闭
- **前端实现**: 使用 shadcn/ui 的 AlertDialog 组件实现确认对话框
- **安全考虑**: 此操作需要确认步骤以防止意外重启
- **错误处理**: 重启过程中可能出现权限不足或其他系统错误

### Project Structure Notes

- 遵循统一的项目结构：`packages/backend/src/routes/system.routes.ts` 和 `packages/frontend/src/services/system-api.ts`
- 符合现有代码模式：使用 Zod 验证、Pino 日志、XState 集成等
- 遵循命名约定：API 端点使用 kebab-case，TypeScript 代码使用 camelCase/PascalCase

### References

- [Source: _bmad-output/epics.md#Story 4.1: 实现系统重启功能] - 用户故事和验收标准
- [Source: _bmad-output/architecture.md#API Endpoints] - API 设计模式
- [Source: _bmad-output/project-context.md#优雅关闭处理] - 优雅关闭实现要求

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

### Completion Notes List

- 故事已根据史诗文档和架构要求创建
- 所有验收标准已转换为可执行的任务
- 前后端实现都已考虑架构约束
- 已实现后端重启API端点，包含优雅关闭逻辑
- 已实现前端重启按钮和确认对话框
- 已实现重启API调用和错误处理
- 已实现重启后自动重连机制
- 已编写前后端测试用例
- **代码审查修复 (2025-12-26)**:
  - 新增 ShutdownManager 统一管理优雅关闭流程
  - 完善 RestartService 实现,集成关闭处理器
  - 修复前端 API 路径错误 (/system/restart → /api/system/restart)
  - 统一后端 API 响应消息为中文
  - 集成前端 Pino 结构化日志
  - 新增 RestartService 和 useAutoReconnect 测试覆盖
  - 修复 process.exit 退出码,适配 systemd 重启机制

### File List

**后端文件:**
- packages/backend/src/routes/system.routes.ts (修改: API 响应消息中文化)
- packages/backend/src/services/restart.service.ts (修改: 集成 ShutdownManager)
- packages/backend/src/index.ts (修改: 注册关闭处理器)
- packages/backend/src/utils/shutdown-manager.ts (新增: 优雅关闭管理器)
- packages/backend/src/routes/__tests__/system-routes.test.ts (现有)
- packages/backend/src/services/__tests__/restart.service.test.ts (新增: 单元测试)

**前端文件:**
- packages/frontend/src/components/system/RestartButton.tsx (现有)
- packages/frontend/src/services/system-api.ts (修改: API 路径修复 + Pino 日志)
- packages/frontend/src/hooks/useRestartSystem.ts (现有)
- packages/frontend/src/hooks/useAutoReconnect.ts (现有)
- packages/frontend/src/lib/logger.ts (新增: Pino 日志配置)
- packages/frontend/src/components/system/__tests__/RestartButton.test.tsx (现有)
- packages/frontend/src/hooks/__tests__/useRestartSystem.test.tsx (现有)
- packages/frontend/src/hooks/__tests__/useAutoReconnect.test.tsx (新增: 测试)
