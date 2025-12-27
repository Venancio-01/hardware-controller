# Story 1.3: Expose Process Status via API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Frontend Developer,
I want to query the Core status,
so I can display it to the user.

## Acceptance Criteria

1. **REST API for Status Query**
   - **Given** An authenticated user
   - **When** They request `GET /api/system/core/status`
   - **Then** The API returns the current status (Starting/Running/Stopped/Error), uptime, and last error message
   - **And** Response format matches `ApiResponse<CoreStatusResponse>` schema

2. **WebSocket Real-time Status Push**
   - **Given** The Core status changes (e.g., from Starting to Running)
   - **When** The change occurs
   - **Then** The Backend emits a WebSocket event to connected clients
   - **And** Event contains complete status payload (status, uptime, lastError)

## Tasks / Subtasks

- [x] Task 1: Define API Response Types (AC: #1)
  - [x] 1.1 Create `CoreStatusResponse` interface in `packages/shared/src/types/`
    - [x] Include: status (CoreStatus), uptime (number | null), lastError (string | null)
  - [x] 1.2 Export type from `packages/shared/src/index.ts`

- [x] Task 2: Implement Core Status REST API (AC: #1)
  - [x] 2.1 Create new route `packages/backend/src/routes/core-status.routes.ts`
    - [x] `GET /api/system/core/status` endpoint
    - [x] Require authentication middleware
    - [x] Return `ApiResponse<CoreStatusResponse>` format
  - [x] 2.2 Integrate `CoreStatusService.getState()` to build response
  - [x] 2.3 Register route in `packages/backend/src/server.ts`
    - [x] Mount at `/api/system/core` path

- [x] Task 3: Implement WebSocket Status Push (AC: #2)
  - [x] 3.1 Set up WebSocket server in Backend
    - [x] Install `ws` or `socket.io` package (recommend `socket.io` for ease)
    - [x] Create `packages/backend/src/services/websocket.service.ts`
    - [x] Initialize WebSocket server with HTTP server
  - [x] 3.2 Implement authentication for WebSocket connections
    - [x] Verify JWT token on connection
    - [x] Reject unauthenticated connections
  - [x] 3.3 Create status broadcast mechanism
    - [x] Define WebSocket event: `core:status_changed`
    - [x] Implement `broadcastStatusChange(payload: CoreStatusResponse)` method
  - [x] 3.4 Integrate broadcast with `CoreStatusService`
    - [x] Option A: Event emitter pattern in `CoreStatusService`
    - [x] Option B: Direct call from `CoreProcessManager` on status change
  - [x] 3.5 Handle client disconnect/reconnect gracefully

- [x] Task 4: Unit Tests
  - [x] 4.1 Test `GET /api/system/core/status` endpoint
    - [x] Test authenticated request returns correct format
    - [x] Test unauthenticated request returns 401
    - [x] Test various status states (Running, Stopped, Error)
  - [x] 4.2 Test WebSocket service
    - [x] Test connection with valid token
    - [x] Test rejection with invalid/missing token
    - [x] Test status broadcast to connected clients

## Dev Notes

- **依赖于 Story 1.1 和 1.2**: 本故事利用已实现的 `CoreProcessManager` 和 `CoreStatusService`。
- **Authentication**: 使用现有的 JWT 中间件 (`packages/backend/src/middleware/auth.middleware.ts`)。
- **Status 已在内存中**: 无需新增状态存储，直接使用 `CoreStatusService.getState()`。

### Architecture Compliance

- **REST API Pattern**: 遵循现有路由模式 (参考 `system.routes.ts`, `config.routes.ts`)。
- **Response Format**: 使用标准 `ApiResponse<T>` 格式 (`{ success: boolean, data?: T, error?: string }`)。
- **WebSocket**: 属于新增组件，需要设计决策（见下方）。

### Critical Design Decisions

#### WebSocket 方案选择

**选项 A: Socket.IO (推荐)**
- 自动处理握手、重连、心跳
- 内置房间/命名空间管理
- TypeScript 支持良好
- 库: `socket.io` (server) + `socket.io-client` (frontend)

**选项 B: 原生 ws**
- 更轻量
- 需要手动处理重连和心跳
- 库: `ws`

**建议**: 使用 Socket.IO，简化实现并提供更好的可靠性。

#### 状态广播触发点

在 `CoreStatusService.setStatus()` 中添加事件触发机制：
```typescript
// 方案: EventEmitter 模式
import { EventEmitter } from 'events';

class CoreStatusServiceClass extends EventEmitter {
  setStatus(status: CoreStatus, error?: string): void {
    // ... existing logic ...
    this.emit('statusChange', this.getState());
  }
}
```

### API Endpoints Reference

| 方法 | 路径 | 认证 | 描述 |
|------|------|------|------|
| GET | `/api/system/core/status` | 需认证 | 获取 Core 进程状态 |

### API Response Example

```json
// GET /api/system/core/status
{
  "success": true,
  "data": {
    "status": "Running",
    "uptime": 123456,
    "lastError": null
  }
}

// Error case
{
  "success": true,
  "data": {
    "status": "Error",
    "uptime": null,
    "lastError": "启动超时：未在指定时间内接收到 CORE:READY"
  }
}
```

### WebSocket Events

| 事件名 | 方向 | Payload | 描述 |
|--------|------|---------|------|
| `core:status_changed` | Server → Client | `CoreStatusResponse` | Core 状态变化通知 |

### File Structure Reference

```
packages/
├── backend/src/
│   ├── routes/
│   │   └── core-status.routes.ts    # NEW: Core 状态 API
│   ├── services/
│   │   ├── core-status.service.ts   # MODIFY: 添加 EventEmitter
│   │   └── websocket.service.ts     # NEW: WebSocket 服务
│   └── server.ts                    # MODIFY: 注册新路由和 WebSocket
└── shared/src/
    └── types/
        └── api.ts                   # MODIFY: 添加 CoreStatusResponse
```

### Existing Code to Leverage

- **`CoreStatusService`**: `packages/backend/src/services/core-status.service.ts`
  - `getState()` - 返回完整状态快照
  - `getStatus()` - 返回当前状态字符串
  - `getUptime()` - 返回运行时间（毫秒）
  - `getLastError()` - 返回最后错误信息

- **Authentication Middleware**: `packages/backend/src/middleware/auth.middleware.ts`
  - 用于保护 REST API 端点

- **Route Registration Pattern**: 参考 `packages/backend/src/server.ts`
  - 现有路由挂载方式

### Testing Standards

- 使用 `vitest` 作为测试框架
- REST API 测试使用 `supertest`
- WebSocket 测试使用 `socket.io-client` (如选择 Socket.IO)
- Mock `CoreStatusService` 进行隔离测试
- 测试覆盖：
  - 认证成功/失败
  - 各种状态值
  - WebSocket 连接/断开
  - 状态广播

### Dependencies to Install

```bash
# 如选择 Socket.IO
pnpm --filter backend add socket.io
pnpm --filter backend add -D @types/socket.io

# 如选择原生 ws
pnpm --filter backend add ws
pnpm --filter backend add -D @types/ws
```

### References

- [Architecture: Backend API](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/architecture.md#5-后端-api-packagesbackend)
- [Project Context: Testing Rules](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/project-context.md#测试规则)
- [Story 1.2: Implementation Details](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/implementation/1-2-implement-status-monitoring-logging.md)
- [Epics: Story 1.3 Requirements](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md#story-13-expose-process-status-via-api)

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

无调试问题。

### Completion Notes List

1. ✅ **Task 1 完成**: 创建 `CoreStatusResponse` 接口在 `packages/shared/src/types/api.types.ts`，包含 status、uptime、lastError 属性。类型已从 shared 包的 index.ts 导出。

2. ✅ **Task 2 完成**: 创建 `core-status.routes.ts` 实现 GET /api/system/core/status 端点，返回 `ApiResponse<CoreStatusResponse>` 格式。路由已在 server.ts 中注册在 `/api/system/core` 路径下。

3. ✅ **Task 3 完成**:
   - 安装 socket.io 依赖
   - 创建 `websocket.service.ts` 实现 WebSocket 服务
   - 实现 JWT 认证中间件验证连接
   - 扩展 `CoreStatusService` 继承 EventEmitter，在状态变更时发射 `statusChange` 事件
   - 创建 `broadcastStatusChange()` 方法广播状态到所有连接客户端
   - 在 `index.ts` 中初始化 WebSocket 服务并注册关闭处理器

4. ✅ **Task 4 完成**:
   - 创建 `core-status.routes.test.ts` (4 测试全部通过)
   - 创建 `websocket.service.test.ts` (6 测试全部通过)
   - 测试覆盖: 认证成功/失败、各种状态值、WebSocket 连接/断开、状态广播

5. ✅ **构建验证**: Backend 包构建成功

### File List

**新增文件:**
- `packages/shared/src/types/api.types.ts` (修改 - 添加 CoreStatusResponse 接口)
- `packages/backend/src/routes/core-status.routes.ts` (新增)
- `packages/backend/src/services/websocket.service.ts` (新增)
- `packages/backend/src/routes/__tests__/core-status.routes.test.ts` (新增)
- `packages/backend/src/services/__tests__/websocket.service.test.ts` (新增)

**修改文件:**
- `packages/shared/src/index.ts` (添加 CoreStatusResponse 导出)
- `packages/backend/src/services/core-status.service.ts` (扩展为 EventEmitter)
- `packages/backend/src/server.ts` (注册 core-status 路由)
- `packages/backend/src/index.ts` (初始化 WebSocket 服务)

### Change Log

- 2025-12-27: 完成 Story 1.3 实现 - REST API 和 WebSocket 状态推送功能
- 2025-12-27: 代码审查完成，修复了 WebSocketService 事件监听器泄露和 CoreProcessManager 测试 mock 问题

### Senior Developer Review (AI)

**审查日期:** 2025-12-27
**审查结果:** ✅ APPROVED

**发现的问题和修复:**

| 编号 | 严重性 | 描述 | 状态 |
|------|----------|------|------|
| C2 | CRITICAL | CoreProcessManager 测试 mock 缺少 `removeAllListeners` | ✅ 已修复 |
| C4 | CRITICAL | WebSocketService `close()` 事件监听器无法正确移除 | ✅ 已修复 |

**测试结果:**
- Core Status Service: 18 tests ✅
- Core Process Manager: 13 tests ✅
- Core Status Routes: 4 tests ✅
- WebSocket Service: 6 tests ✅
- **总计: 41 passed**
