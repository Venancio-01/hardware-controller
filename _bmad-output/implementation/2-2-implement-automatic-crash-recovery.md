# Story 2.2: Implement Automatic Crash Recovery

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Owner,
I want the system to auto-recover from crashes,
So that downtime is minimized without manual intervention.

## Acceptance Criteria

1. **崩溃检测与自动重启**
   - **Given** Core 进程以非零退出码退出 (崩溃)
   - **When** Backend 检测到退出事件
   - **Then** 等待 1 秒后尝试重启进程
   - **And** 增加重试计数器

2. **稳定期重置**
   - **Given** 重启成功且运行超过 1 小时
   - **When** 稳定期过后
   - **Then** 重试计数器重置为 0

3. **最大重试限制**
   - **Given** 进程在短时间内连续崩溃 3 次
   - **When** 达到最大重试限制
   - **Then** Backend 停止尝试重启
   - **And** 记录严重错误日志 (critical)
   - **And** 状态保持 "Error" 直到手动干预

## Tasks / Subtasks

- [x] Task 1: 扩展 CoreProcessManager 自动恢复逻辑 (AC: #1, #2, #3)
  - [x] 1.1 添加配置常量
    - [x] `RESTART_DELAY_MS = 1000` (从 3000 改为 1000)
    - [x] `MAX_RESTART_RETRIES = 3`
    - [x] `STABILITY_PERIOD_MS = 60 * 60 * 1000` (1 小时)
  - [x] 1.2 添加状态跟踪字段
    - [x] `private restartRetryCount: number = 0`
    - [x] `private lastStartTime: number | null = null`
  - [x] 1.3 修改 `start()` 方法
    - [x] 记录 `lastStartTime = Date.now()`
  - [x] 1.4 修改 exit 事件处理器
    - [x] 检查是否为非零退出码 (崩溃)
    - [x] 检查重试次数是否超过限制
    - [x] 超过限制：记录 critical 日志，设置状态为 "Error"，不重启
    - [x] 未超限：增加 `restartRetryCount++`，延迟后重启
  - [x] 1.5 添加稳定期检查逻辑
    - [x] 在 `handleCoreReady()` 中启动稳定期计时器
    - [x] 计时器到期后 (1 小时)：重置 `restartRetryCount = 0`

- [x] Task 2: 更新单元测试 (AC: #1, #2, #3)
  - [x] 2.1 测试崩溃后自动重启 (1 秒延迟)
  - [x] 2.2 测试重试计数器递增
  - [x] 2.3 测试达到最大重试限制后停止重启
  - [x] 2.4 测试稳定期后计数器重置
  - [x] 2.5 测试优雅停止 (`isShuttingDown`) 不触发自动重启

- [x] Task 3: 更新 CoreStatusService 支持恢复失败状态
  - [x] 3.1 添加方法 `markRecoveryFailed(retryCount: number)`
  - [x] 3.2 设置 `lastError` 为描述性消息 (如: "自动恢复失败，已重试 3 次")

## Dev Notes

### 现有代码分析

**当前 `core-process-manager.ts` 状态 (第 220-236 行):**
```typescript
this.child.on('exit', (code, signal) => {
  coreLogger.info(`Core process exited (code=${code}, signal=${signal})`);
  this.clearStartupTimer();
  this.child = null;
  CoreStatusService.markStopped(code, signal as string | null);

  if (!this.isShuttingDown) {
    coreLogger.warn(`Core process exited unexpectedly. Restarting in ${this.RESTART_DELAY_MS}ms...`);
    setTimeout(() => {
      if (!this.isShuttingDown && this.currentScriptPath) {
        this.start(this.currentScriptPath, this.currentOptions);
      }
    }, this.RESTART_DELAY_MS);
  }
});
```

**需要修改:**
1. `RESTART_DELAY_MS`: 从 3000 改为 1000
2. 添加重试计数器逻辑
3. 添加稳定期计时器
4. 区分崩溃退出 (`code !== 0`) 和正常退出 (`code === 0`)

### Architecture Compliance

- **Backend**: `CoreProcessManager` 是唯一管理子进程生命周期的位置
- **IPC**: 不需要新的 IPC 消息类型；使用现有的 `CORE:READY` 作为成功启动的信号
- **Logging**: 使用 `coreLogger.error()` 记录严重错误，符合 Pino 日志标准

### Critical Design Decisions

1. **崩溃判定**: 仅非零退出码 (`code !== 0 && code !== null`) 视为崩溃
   - `code === 0`: 正常退出，不计入重试
   - `signal !== null && code === null`: 被信号终止，根据 `isShuttingDown` 判断

2. **稳定期计时器**:
   - 在 `handleCoreReady()` 中启动
   - 使用 `private stabilityTimer: NodeJS.Timeout | null`
   - 每次启动时清除旧计时器，避免重复

3. **手动干预**:
   - 用户可通过 `POST /api/system/core/restart` (Story 2.1) 手动重启
   - 手动重启应重置 `restartRetryCount`

### File Structure Reference

```
packages/backend/src/services/
├── core-process-manager.ts       # MODIFY: add crash recovery logic
├── core-status.service.ts        # MODIFY: add markRecoveryFailed()
├── __tests__/
│   └── core-process-manager.service.test.ts  # MODIFY: add recovery tests
```

### Testing Standards

- **Mock**: 使用 `vi.useFakeTimers()` 测试延迟重启和稳定期
- **Spy**: 监视 `start()` 调用次数验证重试逻辑
- **Isolation**: Mock `child_process.fork` 和 `CoreStatusService`

### Previous Story Intelligence

**From Story 2.1:**
- `restart()` 方法已实现，调用 `await this.stop()` 然后 `this.start()`
- 手动重启时应调用 `restart()` 并重置计数器
- 测试模式下需 Mock `ChildProcess` 的 `kill` 和事件

### References

- [Source: _bmad-output/epics.md#Story-2.2]
- [Source: _bmad-output/architecture.md#Section-5.2]
- [Source: packages/backend/src/services/core-process-manager.ts#L220-L236]

## Dev Agent Record

### Agent Model Used

Claude claude-sonnet-4-20250514

### Debug Log References

无调试问题

### Completion Notes List

- ✅ 实现 `CoreProcessManager` 自动崩溃恢复逻辑
  - 修改 `RESTART_DELAY_MS` 从 3000ms 改为 1000ms
  - 添加 `MAX_RESTART_RETRIES = 3` 常量
  - 添加 `STABILITY_PERIOD_MS = 60 * 60 * 1000` (1小时) 常量
  - 添加 `restartRetryCount`、`lastStartTime`、`stabilityTimer` 状态字段
  - 修改 exit 事件处理器：区分崩溃/正常退出，实现重试限制
  - 添加稳定期计时器：`startStabilityTimer()`、`clearStabilityTimer()`
  - 手动 `restart()` 时重置重试计数器

- ✅ 实现 `CoreStatusService.markRecoveryFailed(retryCount)` 方法
  - 设置状态为 "Error"
  - 设置 `lastError` 为描述性消息

- ✅ 添加 7 个新单元测试覆盖所有验收标准
  - 崩溃后 1 秒延迟重启
  - 重试计数器递增
  - 达到最大限制 (3) 后停止重启
  - 稳定期 (1小时) 后重置计数器
  - 优雅停止 (`isShuttingDown`) 不触发重启
  - 正常退出 (code === 0) 不触发重启
  - 手动重启重置计数器

### Change Log

- 2025-12-27: 实现自动崩溃恢复功能 (Task 1, 2, 3)
- 2025-12-27: 修复 Manual Restart 重置计数器的单元测试 (Code Review Fix)

### File List

- `packages/backend/src/services/core-process-manager.ts` (MODIFIED)
- `packages/backend/src/services/core-status.service.ts` (MODIFIED)
- `packages/backend/src/services/__tests__/core-process-manager.service.test.ts` (MODIFIED)
