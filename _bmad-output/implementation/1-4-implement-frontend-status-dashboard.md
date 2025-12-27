# Story 1.4: Implement Frontend Status Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to see the system status on the sidebar,
so I always know if the hardware controller is online.

## Acceptance Criteria

1. **连接状态徽章显示**
   - **Given** 我已登录仪表盘
   - **When** 我查看侧边栏/状态区域
   - **Then** 我能看到"连接状态"徽章 (Online/Offline)
   - **And** 我能看到"Core 状态"徽章 (Running/Stopped/Error/Starting)
   - **And** 我能看到当前配置的 IP 地址和端口

2. **Core 离线实时更新**
   - **Given** Core 进程正在运行
   - **When** Core 进程离线/发生错误
   - **Then** "Core 状态"徽章立即变为红色显示相应状态
   - **And** 状态更新通过 WebSocket 实时推送，无需手动刷新

## Tasks / Subtasks

- [x] Task 1: 创建 WebSocket 连接 Hook (AC: #2)
  - [x] 1.1 安装 `socket.io-client` 依赖至 frontend 包
  - [x] 1.2 创建 `packages/frontend/src/hooks/useCoreStatus.ts`
    - [x] 建立 Socket.IO 连接到 Backend
    - [x] 使用 JWT Token 进行认证 (`auth.token`)
    - [x] 监听 `core:status_changed` 事件
    - [x] 返回 `{ status, uptime, lastError, isConnected }` 状态
  - [x] 1.3 处理连接断开和重连逻辑
    - [x] 连接断开时显示"连接中..."状态
    - [x] 自动重连机制 (Socket.IO 内置支持)
  - [x] 1.4 添加 Hook 单元测试

- [x] Task 2: 重构 Sidebar 组件以显示 Core 状态 (AC: #1, #2)
  - [x] 2.1 在 `Sidebar.tsx` 中集成 `useCoreStatus` Hook
  - [x] 2.2 创建新的 Core 状态卡片 (与现有"设备状态"卡片并列)
    - [x] 显示 Core 状态 Badge (Running/Stopped/Error/Starting)
    - [x] 显示 Uptime (运行时间，格式化为人类可读)
    - [x] 状态为 Error 时显示错误信息
  - [x] 2.3 更新现有"设备状态"卡片
    - [x] 修改"连接状态"为实际 WebSocket 连接状态
    - [x] 保留"最后更新"时间显示
  - [x] 2.4 添加状态变化动画效果 (平滑过渡)

- [x] Task 3: 创建状态 Badge 组件 (AC: #1)
  - [x] 3.1 创建 `packages/frontend/src/components/system/CoreStatusBadge.tsx`
    - [x] 根据状态显示不同颜色 (Running=绿色, Error=红色, Stopped=灰色, Starting=黄色)
    - [x] 支持 Loading 动画 (Starting 状态)
  - [x] 3.2 添加组件测试

- [x] Task 4: 单元测试与集成测试
  - [x] 4.1 测试 `useCoreStatus` Hook
    - [x] 测试初始连接状态
    - [x] 测试状态变更接收
    - [x] 测试断开/重连行为
  - [x] 4.2 测试 Sidebar 组件
    - [x] 测试核心状态正确显示
    - [x] 测试状态变化时 UI 更新

## Dev Notes

- **依赖于 Story 1.3**: 本故事使用 Story 1.3 中实现的 WebSocket 服务 (`socket.io`) 和 REST API (`/api/system/core/status`)。
- **现有 Sidebar 组件**: 已存在基本的 Sidebar 组件 (`packages/frontend/src/components/layout/Sidebar.tsx`)，需要扩展以添加 Core 状态显示。
- **现有设备状态**: 当前 Sidebar 显示的是"设备状态"（网络连接相关），需要添加独立的"Core 进程状态"显示。

### Architecture Compliance

- **shadcn/ui 组件**: 继续使用 Card、Badge、Button 等 shadcn/ui 组件。
- **TanStack Query**: 初始状态可使用 REST API 获取，实时更新通过 WebSocket。
- **Socket.IO Client**: 使用 `socket.io-client` 连接后端 Socket.IO 服务器。

### Critical Design Decisions

#### WebSocket 连接认证

从 `localStorage` 获取 JWT Token，在 Socket.IO 连接时传递：
```typescript
import { io, Socket } from 'socket.io-client';

const socket = io('/', {
  auth: {
    token: localStorage.getItem('token'),
  },
});
```

#### 状态显示设计

根据 UX Design Specification，状态 Badge 的颜色映射：
| 状态 | 颜色 | 图标 |
|------|------|------|
| Running | 绿色 (emerald-500) | CheckCircle |
| Starting | 黄色 (amber-500) | Loader (动画) |
| Stopped | 灰色 | Circle |
| Error | 红色 (destructive) | XCircle |

#### Uptime 格式化

```typescript
function formatUptime(uptimeMs: number | null): string {
  if (uptimeMs === null) return '--';
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天 ${hours % 24}小时`;
  if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
}
```

### File Structure Reference

```
packages/frontend/src/
├── hooks/
│   └── useCoreStatus.ts                 # NEW: Core 状态 WebSocket Hook
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                  # MODIFY: 添加 Core 状态显示
│   └── system/
│       └── CoreStatusBadge.tsx          # NEW: Core 状态徽章组件
└── lib/
    └── formatters.ts                    # NEW/MODIFY: 添加 uptime 格式化函数
```

### Existing Code to Leverage

- **Sidebar.tsx**: `packages/frontend/src/components/layout/Sidebar.tsx`
  - 现有的状态显示卡片布局
  - TanStack Query 使用模式
  - shadcn/ui Card、Badge 组件使用

- **Authentication Context**: `packages/frontend/src/contexts/auth.context.tsx`
  - 获取 JWT Token: `localStorage.getItem('token')`

- **API Client**: `packages/frontend/src/lib/api.ts`
  - 可选择性使用 REST API 作为初始状态获取

- **WebSocket Service Events**: `packages/backend/src/services/websocket.service.ts`
  - 事件名: `core:status_changed`
  - Payload 类型: `CoreStatusResponse { status, uptime, lastError }`

### API Endpoints Used

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/system/core/status` | 初始状态获取 (可选) |
| WS | `core:status_changed` | 实时状态更新 |

### WebSocket Event Payload

```typescript
// core:status_changed 事件 payload
interface CoreStatusResponse {
  status: 'Starting' | 'Running' | 'Stopped' | 'Error';
  uptime: number | null;  // 毫秒
  lastError: string | null;
}
```

### Testing Standards

- 使用 `vitest` 作为测试框架
- React 组件测试使用 `@testing-library/react`
- WebSocket Mock 使用 `socket.io-mock` 或手动 mock
- 测试覆盖：
  - Hook 状态管理
  - 组件渲染和状态变化
  - WebSocket 连接/断开行为

### Dependencies to Install

```bash
# Socket.IO 客户端
pnpm --filter frontend add socket.io-client
```

### Previous Story Intelligence

**从 Story 1.3 学到的模式：**
- `CoreStatusService` 使用 EventEmitter 模式发射 `statusChange` 事件
- WebSocket 服务在连接时自动发送当前状态
- JWT Token 通过 `auth.token` 或 `headers.authorization` 传递

**从 Story 1.1/1.2 学到的模式：**
- 使用 `createModuleLogger` 进行日志记录
- 遵循单例模式管理服务实例
- 类型定义放在 `shared` 包中

### UX Design Compliance

根据 `ux-design-specification.md`：
- **状态可见性原则**: 用户始终能够看到设备的连接状态
- **shadcn/ui 美学原则**: 使用干净、现代的表单设计语言
- **明确反馈原则**: 状态变化有明显的视觉指示

**设计要求：**
- 仪表盘作为固定侧边栏，提供实时的设备上下文
- 状态变化时平滑过渡动画（不突兀但明显）
- 使用 Badge 组件显示简洁的状态信息

### References

- [UX Design: Status Dashboard](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/ux-design-specification.md#core-user-experience)
- [Architecture: Frontend](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/architecture.md#4-前端应用-packagesfrontend)
- [Project Context: Framework Rules](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/project-context.md#框架特定规则)
- [Story 1.3: WebSocket Implementation](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/implementation/1-3-expose-process-status-via-api.md)
- [Epics: Story 1.4 Requirements](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md#story-14-implement-frontend-status-dashboard)

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Anthropic)

### Debug Log References

无重大问题。所有测试通过。

### Completion Notes List

- 安装 `socket.io-client` 依赖
- 创建 `useCoreStatus` Hook，提供 WebSocket 连接和 Core 状态订阅
- 创建 `CoreStatusBadge` 组件，根据状态显示不同颜色和图标
- 创建 `formatUptime` 工具函数，格式化运行时间
- 重构 `Sidebar.tsx`，添加 Core 状态卡片和 WebSocket 连接状态显示
- 添加 vitest 测试 setup 文件以启用 jest-dom matchers
- 所有单元测试通过 (25 tests: 9 useCoreStatus + 8 CoreStatusBadge + 8 formatters)
- **[Auto-Fix]** 重写 `Sidebar.test.tsx`，添加对 `useCoreStatus` 的 Mock 和 UI 集成测试 (Core Status Card, WebSocket Badge)
- **[Auto-Fix]** 清理 `Sidebar.tsx` 中未使用的测试连接代码和 Mock 逻辑

### File List

**新增文件：**
- `packages/frontend/src/hooks/useCoreStatus.ts` - Core 状态 WebSocket Hook
- `packages/frontend/src/components/system/CoreStatusBadge.tsx` - Core 状态徽章组件
- `packages/frontend/src/lib/formatters.ts` - 格式化工具函数
- `packages/frontend/src/hooks/__tests__/useCoreStatus.test.tsx` - Hook 单元测试
- `packages/frontend/src/components/system/__tests__/CoreStatusBadge.test.tsx` - 组件单元测试
- `packages/frontend/src/lib/__tests__/formatters.test.ts` - 工具函数单元测试
- `packages/frontend/src/test/setup.ts` - Vitest 测试 setup 文件

**修改文件：**
- `packages/frontend/src/components/layout/Sidebar.tsx` - 添加 Core 状态显示
- `packages/frontend/vite.config.ts` - 添加 socket.io proxy 配置
- `packages/frontend/vitest.config.ts` - 添加 setupFiles 配置
- `packages/frontend/package.json` - 添加 socket.io-client 依赖
- `packages/frontend/src/components/layout/__tests__/Sidebar.test.tsx` - [CodeReview] 补充集成测试


## Change Log

| 日期 | 变更 |
|------|------|
| 2025-12-27 | 实现前端状态仪表盘 - 添加 Core 状态实时显示、WebSocket 连接、状态徽章组件 |
| 2025-12-27 | **代码审查修复** - 补充 Sidebar 集成测试，清理误导性 Mock 代码 |
| 2025-12-27 | **代码审查修复** - 修复 WebSocket Proxy 配置，改进断开连接状态显示，优化错误处理 |
