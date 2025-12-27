# Story 1.2: Implement Status Monitoring & Logging

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Admin,
I want the system to monitor the Core's health,
so I know if it's running correctly.

## Acceptance Criteria

1. **Core Ready Notification**
   - **Given** The Core process starts successfully
   - **When** It enters the 'ready' state
   - **Then** It sends a status message via IPC to the Backend (`CORE:READY`)
   - **And** The Backend updates internal status to 'Running'

2. **Log Forwarding via IPC**
   - **Given** The Core process emits a log message
   - **When** The log is received via IPC
   - **Then** The Backend logger records it with a configured prefix (e.g., `[CORE]`)
   - **And** The log level is preserved (info/warn/error/debug)

3. **Crash/Exit Detection**
   - **Given** The Core process crashes or exits unexpectedly
   - **When** The exit event is detected
   - **Then** The Backend updates the status to 'Error' or 'Stopped' immediately
   - **And** The status change is logged with exit code and signal

4. **Startup Timeout Handling**
   - **Given** The Core process fails to start within 30 seconds
   - **When** The timeout is reached
   - **Then** The Backend marks the status as 'Error' and logs a timeout error
   - **And** The Core process is force-killed if still running

## Tasks / Subtasks

- [x] Task 1: Define Status Types & IPC Messages (AC: #1, #2, #3, #4)
  - [x] 1.1 Extend `packages/shared/src/types/ipc.ts` with new message types
    - [x] Add `CORE:LOG` message type for log forwarding
    - [x] Add `CORE:STATUS_CHANGE` for status updates
    - [x] Define `CoreStatus` enum: 'Starting' | 'Running' | 'Stopped' | 'Error'
  - [x] 1.2 Define `LogPayload` interface with level, message, timestamp
  - [x] 1.3 Define `StatusPayload` interface with status, uptime, lastError

- [x] Task 2: Implement Core-side Status & Logging (AC: #1, #2)
  - [x] 2.1 Create `packages/core/src/ipc/status-reporter.ts`
    - [x] Implement `sendReady()` to emit `CORE:READY` on startup
    - [x] Implement `sendStatus(status: CoreStatus)` helper
  - [x] 2.2 Create `packages/core/src/ipc/log-forwarder.ts`
    - [x] Wrap existing logger to forward logs via IPC
    - [x] Include original log level in payload
  - [x] 2.3 Integrate with Core entry point (`packages/core/src/index.ts` or `app.ts`)
    - [x] Send `CORE:READY` after successful initialization
    - [x] Ensure IPC connection check before sending

- [x] Task 3: Backend Status Management (AC: #1, #3, #4)
  - [x] 3.1 Create `packages/backend/src/services/core-status.service.ts`
    - [x] Define `CoreStatusState` type
    - [x] Implement singleton status store with initial state 'Starting'
    - [x] Methods: `getStatus()`, `setStatus()`, `getUptime()`, `getLastError()`
  - [x] 3.2 Extend `CoreProcessManager` IPC handlers
    - [x] Handle `CORE:READY` → update status to 'Running'
    - [x] Handle `CORE:ERROR` → update status to 'Error' with error message
    - [x] On `exit` event → update status to 'Stopped' or 'Error' based on code
  - [x] 3.3 Implement startup timeout mechanism
    - [x] Add configurable timeout (default: 30000ms)
    - [x] Timer starts on `start()`, clears on `CORE:READY`
    - [x] On timeout: log error, force-kill child, set status 'Error'

- [x] Task 4: Log Forwarding Integration (AC: #2)
  - [x] 4.1 Extend `CoreProcessManager` message handler
    - [x] Handle `CORE:LOG` messages
    - [x] Log with `[CORE]` prefix using Backend's Pino logger
    - [x] Map log levels correctly (debug, info, warn, error)
  - [x] 4.2 Implemented via `handleCoreLog()` method in CoreProcessManager

- [x] Task 5: Unit Tests
  - [x] 5.1 Test `CoreStatusService` state management (18 tests)
  - [x] 5.2 Test `CoreProcessManager` IPC message handling (13 tests)
  - [x] 5.3 Test startup timeout logic
  - [x] 5.4 Test log forwarding with various log levels

## Dev Notes

- **依赖于 Story 1.1**: 本故事在 `CoreProcessManager` 的基础上扩展，该服务已在 Story 1.1 中实现。
- **IPC 消息规范**: 必须遵循 `NAMESPACE:ACTION` 格式 (SCREAMING_SNAKE_CASE)，参考 `project-context.md`。
- **日志前缀**: 使用 `[CORE]` 前缀区分来自 Core 的日志，便于调试。
- **状态持久化**: 状态仅在内存中保持，无需持久化到文件。
- **超时配置**: 30秒启动超时应可通过环境变量配置 (`CORE_STARTUP_TIMEOUT_MS`)。

### Architecture Compliance

- **Supervisor/Worker Pattern**: Backend 作为 Supervisor 监控 Core 的健康状态。
- **IPC Only**: 所有通信必须通过 Node.js 原生 IPC (`fork`/`send`/`on`)。
- **Shared Types**: 所有 IPC 消息类型必须定义在 `packages/shared/src/types/ipc.ts`。
- **No Direct Import**: Backend 代码不能直接导入 Core 的运行时代码。

### Current Implementation Status

从 Story 1.1 已有的代码基础：
- `CoreProcessManager` 已实现基础的 `start()`/`stop()` 方法
- 已有基础的 `exit` 事件处理和自动重启逻辑
- `IpcMessages` 已定义 `CORE:READY`, `CORE:ERROR`, `CORE:STOPPED`
- 日志已使用共享的 `shared` 包中的 `logger`

### 需要新增的 IPC 消息类型

```typescript
// packages/shared/src/types/ipc.ts

export type CoreStatus = 'Starting' | 'Running' | 'Stopped' | 'Error';

export interface LogPayload {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface StatusPayload {
  status: CoreStatus;
  uptime?: number; // milliseconds since started
  lastError?: string;
}

export const IpcMessages = {
  CORE: {
    READY: 'CORE:READY',
    ERROR: 'CORE:ERROR',
    STOPPED: 'CORE:STOPPED',
    LOG: 'CORE:LOG',           // NEW
    STATUS_CHANGE: 'CORE:STATUS_CHANGE', // NEW
  },
  // ...
} as const;
```

### File Structure Reference

```
packages/
├── backend/src/
│   ├── services/
│   │   ├── core-process-manager.ts   # Extend with status handling
│   │   └── core-status.service.ts    # NEW: Status state management
│   └── index.ts
├── core/src/
│   ├── ipc/
│   │   ├── status-reporter.ts        # NEW: Status reporting
│   │   └── log-forwarder.ts          # NEW: Log forwarding
│   └── app.ts                        # Integrate status reporting
└── shared/src/
    └── types/
        └── ipc.ts                    # Extend with new types
```

### Testing Standards

- 使用 `vitest` 作为测试框架
- Mock `child_process` 进行隔离测试
- 测试覆盖：
  - 正常启动流程 (`CORE:READY` 接收)
  - 超时场景
  - 崩溃检测和状态更新
  - 日志转发各级别

### References

- [Architecture: Core Hardware Service](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/architecture.md#3-核心硬件服务-src)
- [Project Context: IPC Rules](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/project-context.md#ipc-与集成规则-关键)
- [Epics: Story 1.2 Requirements](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md#story-12-implement-status-monitoring--logging)
- [Story 1.1 Implementation](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/implementation/1-1-implement-core-process-manager.md)

## Dev Agent Record

### Agent Model Used

Claude (Antigravity)

### Debug Log References

无

### Completion Notes List

- **Task 1**: 扩展了 `packages/shared/src/types/ipc.ts`，添加了 `CoreStatus`、`IpcLogLevel`、`LogPayload`、`StatusPayload` 类型和 `CORE:LOG`、`CORE:STATUS_CHANGE` 消息类型。
- **Task 2**: 创建了 `packages/core/src/ipc/` 模块，包含 `status-reporter.ts`（发送状态消息）和 `log-forwarder.ts`（日志转发）。在 `app.ts` 中集成 `sendReady()` 调用。
- **Task 3**: 创建了 `CoreStatusService` 单例服务管理状态。扩展 `CoreProcessManager` 处理所有 IPC 消息类型，实现 30 秒启动超时机制（可通过 `CORE_STARTUP_TIMEOUT_MS` 环境变量配置）。
- **Task 4**: 在 `CoreProcessManager.handleCoreLog()` 中实现日志转发，使用 `[CORE]` 前缀并保留原始日志级别，添加了未知日志级别警告。
- **Task 5**: 创建了 Backend 测试（14 个 CoreStatusService + 13 个 CoreProcessManager）和 Core 端 IPC 测试（10 个 status-reporter + 15 个 log-forwarder），共计 52 个测试。

### File List

**新增文件:**
- `packages/core/src/ipc/index.ts` - IPC 模块入口
- `packages/core/src/ipc/status-reporter.ts` - 状态报告器
- `packages/core/src/ipc/log-forwarder.ts` - 日志转发器
- `packages/core/src/ipc/__tests__/status-reporter.test.ts` - 状态报告器测试
- `packages/core/src/ipc/__tests__/log-forwarder.test.ts` - 日志转发器测试
- `packages/backend/src/services/core-status.service.ts` - Core 状态服务
- `packages/backend/src/services/__tests__/core-status.service.test.ts` - 状态服务测试

**修改文件:**
- `packages/shared/src/types/ipc.ts` - 添加 IPC 类型定义
- `packages/shared/src/index.ts` - 导出新类型
- `packages/core/src/index.ts` - 导出 IPC 模块
- `packages/core/src/app.ts` - 集成 sendReady() 和 forwardLog 调用
- `packages/backend/src/services/core-process-manager.ts` - 扩展 IPC 处理和超时机制
- `packages/backend/src/services/__tests__/core-process-manager.service.test.ts` - 扩展测试覆盖
- `_bmad-output/implementation/sprint-status.yaml` - 更新 story 状态

### Change Log

- 2025-12-27: 完成 Story 1.2 所有任务实现和测试
- 2025-12-27: [Code Review] 新增 Core 端 IPC 测试，修复日志级别验证，修复启动超时状态覆盖问题，更新 File List
