# Story 4.2: 实现配置导入/导出

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统管理员,
I want 导出当前配置并在其他设备上导入,
So that 我可以快速复制配置或备份设置。

## Acceptance Criteria

1. **导出功能**: 当用户点击"导出配置"时，浏览器应下载当前的 config.json 文件
2. **导入功能**: 当用户点击"导入配置"并上传文件时，系统应验证文件格式和内容有效性
3. **应用导入**: 验证通过后应用配置并提示重启
4. **错误处理**: 导入无效配置时显示清晰的错误信息
5. **用户反馈**: 提供导入/导出操作的成功或失败反馈

## Tasks / Subtasks

- [x] 4.2.1 实现后端导入/导出API端点 (AC: 1,2,3,4)
  - [x] 后端实现 /api/config/export 端点
  - [x] 后端实现 /api/config/import 端点
  - [x] 配置验证逻辑（使用共享Zod schema）
  - [x] 实现文件上传处理
- [x] 4.2.2 实现前端导入/导出界面 (AC: 1,2,5)
  - [x] 添加导出配置按钮
  - [x] 添加导入配置按钮和文件选择器
  - [x] 实现导入/导出操作反馈（Toasts）
  - [x] 错误信息显示
- [x] 4.2.3 集成导入/导出功能与现有的配置表单 (AC: 3)
  - [x] 导入后更新配置表单
  - [x] 提示用户保存导入的配置
  - [x] 提示用户重启系统

## Dev Notes

- 相关架构模式和约束：
  - 使用共享的Zod验证schema（在packages/shared中）
  - 遵循现有的API端点命名约定（kebab-case）
  - 实现双层验证（前端+后端）

- 源码树组件：
  - packages/backend/src/config/ - 配置管理服务
  - packages/backend/src/routes/ - API路由
  - packages/frontend/src/components/config/ - 配置表单组件
  - packages/frontend/src/services/ - API服务

- 测试标准摘要：
  - 单元测试：API端点和配置服务
  - 集成测试：导入/导出流程
  - 文件格式验证测试

### Project Structure Notes

- 遵循统一的项目结构（monorepo模式，packages/backend, packages/frontend, packages/shared）
- 使用现有文件路径和命名约定

### References

- 配置导入/导出功能需求 [Source: _bmad-output/epics.md#Story-4.2]
- API端点命名约定 [Source: _bmad-output/architecture.md#API-Endpont-Naming]
- Zod验证schema [Source: _bmad-output/architecture.md#Data-Validation-Strategy]
- 文件上传处理 [Source: UX设计规范]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

- 实现了完整的配置导入/导出功能
- 集成验证逻辑确保配置格式正确
- 提供用户友好的错误信息和操作反馈
- 实现了前后端端到端的导入/导出流程
- 添加了前端UI组件和用户交互反馈
- 集成了配置导入后的保存和重启提示

### Code Review Fixes Applied (2025-12-26)

**HIGH Priority Fixes:**
- ✅ 修复原子写入实现: 使用 `fs.rename()` 替代错误的复制操作
- ✅ 添加配置备份机制: 导入前自动创建 `.backup` 文件
- ✅ 统一前后端验证: 前端使用共享 `configSchema` 而非手动检查

**MEDIUM Priority Fixes:**
- ✅ 添加 TanStack Query 缓存失效: 导入后调用 `invalidateQueries`
- ✅ 统一错误处理: 所有 ZodError 检查使用 `instanceof`

### File List

**Backend Files:**
- packages/backend/src/routes/config.routes.ts (修改: 统一 ZodError 处理)
- packages/backend/src/services/config-import-export.service.ts (修改: 添加备份、修复原子写入)
- packages/backend/src/services/__tests__/config-import-export.service.test.ts (现有测试)
- packages/backend/src/routes/__tests__/config.routes.test.ts (现有测试)

**Frontend Files:**
- packages/frontend/src/hooks/useImportExportConfig.ts (修改: 使用 configSchema, 添加缓存失效)
- packages/frontend/src/services/config-api.ts (现有)
- packages/frontend/src/components/dashboard/ConfigForm.tsx (集成导入/导出按钮)

**Shared Files:**
- packages/shared/src/schemas/config.schema.ts (现有,被前端引用)
