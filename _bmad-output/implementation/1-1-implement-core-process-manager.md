# Story 1.1: Implement Core Process Manager

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Developer,
I want to manage the Core as a separate child process,
so that its lifecycle is independent of the web server.

## Acceptance Criteria

1. **Start Core Process**
   - **Given** The Backend server is starting up
   - **When** `CoreProcessManager.start()` is called
   - **Then** The Core application is spawned using `child_process.fork()`
   - **And** An IPC communication channel is established between Backend and Core
   - **And** The Backend logs confirm the child process PID

2. **Stop Core Process**
   - **Given** The Core process is running
   - **When** `CoreProcessManager.stop()` is called
   - **Then** A SIGTERM signal is sent to the Core process
   - **And** The system waits for graceful exit (max 5s) before forcing kill (SIGKILL)

## Tasks / Subtasks

- [x] Define IPC Message Types in Shared
  - [x] Create `packages/shared/src/types/ipc.ts` (or extend existing)
  - [x] Define `IpcPacket` interface consistent with Architecture
  - [x] Define basic status/lifecycle event definitions (e.g. `CORE:READY`)
- [x] Implement CoreProcessManager Service
  - [x] Create `packages/backend/src/services/core-process-manager.ts`
  - [x] Implement `start(scriptPath: string)` method
    - [x] handle `child_process.fork`
    - [x] handle `SIGINT`/`SIGTERM` of parent to cleanup child
  - [x] Implement `stop()` method with timeout logic
  - [x] Bind IPC listeners for logging and feedback
- [x] Integrate with Backend Entry Point
  - [x] Update `packages/backend/src/index.ts` to initialize `CoreProcessManager`
  - [x] Ensure correct path resolution for Core entry point (dev vs prod)

## Dev Notes

- **Architecture Pattern**: Supervisor/Worker pattern. Backend is the Supervisor.
- **Process Separation**:
  - The Core process must be a `child_process.fork()` of the Backend.
  - **Dev Mode**: When running with `tsx`, you might need to point to `packages/core/src/index.ts`.
  - **Prod Mode**: Point to `packages/core/dist/index.js`.
  - Use `NODE_ENV` to determine the correct path or accept it as configuration.
- **Source Tree Components**:
  - `packages/backend/src/services/`
  - `packages/shared/src/`
  - `packages/backend/src/index.ts`
- **Testing Standards**:
  - Unit test `CoreProcessManager` by mocking `child_process`.
  - Integration test implies verifying PID existence.

### Project Structure Notes

- **Monorepo**: Ensure you are importing explicitly from local packages if needed, but for runtime `fork`, it's a file path reference.
- **Shared Library**: Use `packages/shared` for any message type definitions. Do not duplicate types between Core and Backend.

### References

- [Architecture: Process Separation](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/architecture.md#3-core-hardware-service-src)
- [Project Context: IPC Rules](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/project-context.md#ipc-integration-rules-critical)
- [Epics: Story 1.1 Requirements](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md#story-11-implement-core-process-manager)

## Dev Agent Record

### Agent Model Used

Antigravity (simulated)

### Debug Log References

- Check `packages/backend/logs` (if file logging enabled) or stdout.

### Completion Notes List

- [x] `CoreProcessManager` implemented and robust.
- [x] IPC channel verified working.
- [x] Graceful shutdown verified.

### File List

- `packages/backend/src/services/core-process-manager.ts`
- `packages/shared/src/types/ipc.ts`
- `packages/backend/src/index.ts`
- `packages/backend/src/services/__tests__/core-process-manager.service.test.ts`
- `packages/backend/src/utils/logger.ts` (DELETED)
- `packages/core/src/logger/*` (DELETED)

### Review Changes (AI)
- Implemented actual Auto-Restart logic in `CoreProcessManager` (previously only logged)
- Verified `tsup` build configuration for entry points
- Added missing deletions to File List
