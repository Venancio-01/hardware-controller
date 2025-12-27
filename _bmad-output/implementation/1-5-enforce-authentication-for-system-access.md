# Story 1.5: Enforce Authentication for System Access

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Security Officer,
I want to restrict system access,
so only authorized admins can see status.

## Acceptance Criteria

1. **API 安全保护**
   - **Given** 一个未认证的请求
   - **When** 试图访问 `/api/system/*` 或 `/api/config/*` 等受保护端点
   - **Then** 服务器返回 401 Unauthorized
   - **And** 响应体包含 `{ success: false, error: '...' }`

2. **前端路由拦截**
   - **Given** 用户未登录（无 Token）
   - **When** 试图访问首页 `/` 或其他受保护路由
   - **Then** 立即重定向到 `/login`
   - **And** 不会渲染受保护页面的任何内容（无闪烁）

3. **系统状态保护**
   - **Given** `/api/status` 端点的安全审计
   - **When** 检查访问权限
   - **Then** 必须要求认证（修正现有白名单配置）
   - **And** 只有 `/api/auth/login` 和 `/health` 是公开的

## Tasks / Subtasks

- [x] Task 1: 强化后端认证中间件 (AC: #1, #3)
   - [x] 1.1 修改 `packages/backend/src/middleware/auth.middleware.ts`
     - [x] 移除 `/api/status` 从 `publicPaths` 白名单
     - [x] 确保白名单仅包含 `/api/auth/login` 和 `/health`
   - [x] 1.2 验证 `packages/backend/src/routes/system.routes.ts` 正确应用中间件
   - [x] 1.3 添加 API 集成测试：验证受保护路由返回 401

- [x] Task 2: 实现前端路由保护 (AC: #2)
   - [x] 2.1 修改 `packages/frontend/src/routes/_auth.tsx`
     - [x] 使用 TanStack Router 的 `beforeLoad` 钩子
     - [x] 检查 `context.auth` 或 `localStorage` 中的 Token
     - [x] 如果无 Token，抛出 `redirect({ to: '/login' })`
   - [x] 2.2 验证 `packages/frontend/src/routes/login.tsx`
     - [x] 确保登录已有重定向逻辑（已存在，需验证）

- [x] Task 3: 验证会话管理
   - [x] 3.1 验证 `packages/frontend/src/lib/api.ts` 的 401 拦截逻辑
     - [x] 确保 401 响应触发 `localStorage.removeItem('token')`
     - [x] 确保重定向到 `/login`
     - [x] 确保抛出 "认证已过期" 错误
   - [x] 3.2 确保 Token 过期或无效时前端能自动退出并跳转 (通过 3.1 验证)

## Dev Notes

- **Existing Implementation**:
  - Frontend `login.tsx` 已经存在并且看起来功能完整（使用 shadcn/ui Form）。
  - Frontend `apiFetch` (`lib/api.ts`) 已经包含 401 自动跳转逻辑。
  - Backend `auth.middleware.ts` 已经实现，但配置有点宽松（`/api/status` 在白名单）。

- **TanStack Router**:
  - 使用 `beforeLoad` 进行路由守卫是最佳实践。
  - 参考 `login.tsx` 中的 `beforeLoad` 用于反向重定向（已登录则跳首页），`_auth.tsx` 需要正向重定向（未登录则跳登录）。

### Architecture Compliance

- **Backend**: 继续使用 Express Middleware 模式。
- **Frontend**: 使用 TanStack Router 的路由守卫机制。
- **Shared**: 复用 `loginRequestSchema`（已在 `login.tsx` 中使用）。

### Critical Design Decisions

#### 路由保护策略
不要并在组件渲染（UseEffect）中检查 Auth，那样会导致页面闪烁。必须在 `beforeLoad` 中通过 `throw redirect(...)` 进行拦截。

```typescript
// packages/frontend/src/routes/_auth.tsx
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    // 检查 Token
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthLayout,
})
```

#### API 白名单
根据 PRD，`/api/system/*` 必须受保护。当前 `auth.middleware.ts` 代码：
```typescript
const publicPaths = ['/api/auth/login', '/api/status', '/health'];
```
`/api/status` 应该被移除，因为 Story 1.3 明确指出 "Given An authenticated user ... When They request GET /api/system/core/status"。虽然 `/api/status` 是 backend 系统状态，但通常包含敏感信息，建议默认保护。

### File Structure Reference

```
packages/backend/src/
├── middleware/
│   └── auth.middleware.ts       # MODIFY: 收紧白名单
packages/frontend/src/
├── routes/
│   └── _auth.tsx                # MODIFY: 添加 beforeLoad 路由守卫
```

### Testing Standards

- **API Test**: 使用 `supertest` 或类似工具测试 `/api/system/restart` 不带 Token 应该返回 401。
- **Route Test**: 单元测试无法轻易测试路由跳转，建议通过 E2E 或手动验证。
- **Security Check**: 确保没有后门或硬编码的旁路。

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Anthropic)

### Debug Log References

- 分析了 `auth.middleware.ts`，发现 `/api/status` 暴露问题。
- 分析了 `_auth.tsx`，发现缺少路由守卫。
- 确认 `login.tsx` 和 `api.ts` 现有的 Auth 逻辑可复用。

### Completion Notes List

### File List

- packages/frontend/src/routes/_auth.tsx
- packages/backend/src/middleware/auth.middleware.ts
- packages/backend/src/middleware/auth.middleware.test.ts
- packages/backend/src/routes/system.routes.ts
- packages/backend/src/server.ts
- packages/backend/src/services/restart.service.ts

