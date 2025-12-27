import { ChildProcess, fork } from 'child_process';
import * as path from 'path';
import { logger, IpcMessages, createModuleLogger } from 'shared';
import type { IpcPacket, LogPayload, StatusPayload, IpcLogLevel } from 'shared';
import { CoreStatusService } from './core-status.service.js';

const coreLogger = createModuleLogger('CoreProcessManager');

/**
 * 默认启动超时时间（毫秒）
 * 可通过环境变量 CORE_STARTUP_TIMEOUT_MS 配置
 */
const DEFAULT_STARTUP_TIMEOUT_MS = parseInt(process.env.CORE_STARTUP_TIMEOUT_MS || '30000', 10);

/**
 * Core 进程的日志前缀
 */
const CORE_LOG_PREFIX = '[CORE]';

/**
 * CoreProcessManager - 管理 Core 子进程的生命周期
 * 负责启动、停止、监控状态和转发日志
 */
export class CoreProcessManager {
  private child: ChildProcess | null = null;
  private readonly RESTART_DELAY_MS = 1000;
  private readonly MAX_RESTART_RETRIES = 3;
  private readonly STABILITY_PERIOD_MS = 60 * 60 * 1000; // 1 hour
  private isShuttingDown = false;
  private restartRetryCount = 0;
  private lastStartTime: number | null = null;
  private stabilityTimer: NodeJS.Timeout | null = null;
  private currentScriptPath: string | null = null;
  private currentOptions: { execArgv?: string[] } = {};
  private startupTimer: NodeJS.Timeout | null = null;
  private startupTimeoutMs: number = DEFAULT_STARTUP_TIMEOUT_MS;

  private static instance: CoreProcessManager;

  constructor(options?: { startupTimeoutMs?: number }) {
    if (options?.startupTimeoutMs) {
      this.startupTimeoutMs = options.startupTimeoutMs;
    }
  }

  /**
   * Get the singleton instance of CoreProcessManager
   */
  public static getInstance(options?: { startupTimeoutMs?: number }): CoreProcessManager {
    if (!CoreProcessManager.instance) {
      CoreProcessManager.instance = new CoreProcessManager(options);
    }
    return CoreProcessManager.instance;
  }

  /**
   * Start the Core process
   */
  start(scriptPath: string, options: { execArgv?: string[] } = {}): void {
    this.currentScriptPath = scriptPath;
    this.currentOptions = options;

    if (this.child) {
      coreLogger.warn('Core process already running. Skipping start.');
      return;
    }

    this.isShuttingDown = false;
    this.lastStartTime = Date.now();
    CoreStatusService.reset();

    coreLogger.info(`Starting Core process from: ${scriptPath}`);

    try {
      // Using fork to spawn a node process
      this.child = fork(scriptPath, [], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        execArgv: options.execArgv,
        env: {
          ...process.env,
          // Ensure child knows it's a child
          IS_CORE_CHILD: 'true',
        },
      });

      if (!this.child.pid) {
        coreLogger.error('Failed to spawn Core process (no PID)');
        CoreStatusService.setStatus('Error', '无法生成 Core 进程');
        this.child = null;
        return;
      }

      coreLogger.info(`Core process spawned with PID: ${this.child.pid}`);

      this.setupListeners();
      this.startStartupTimer();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      coreLogger.error(`Error starting Core process: ${errorMsg}`);
      CoreStatusService.setStatus('Error', errorMsg);
      this.child = null;
    }
  }

  /**
   * Stop the Core process gracefully
   */
  async stop(timeoutMs = 5000): Promise<void> {
    this.clearStartupTimer();
    this.clearStabilityTimer();

    if (!this.child) {
      coreLogger.info('Core process not running.');
      return;
    }

    this.isShuttingDown = true;
    coreLogger.info(`Stopping Core process (PID: ${this.child.pid})...`);

    return new Promise<void>((resolve) => {
      if (!this.child) {
        resolve();
        return;
      }

      const killTimer = setTimeout(() => {
        if (this.child) {
          coreLogger.warn(`Core process did not exit within ${timeoutMs}ms. Sending SIGKILL...`);
          this.child.kill('SIGKILL');
          this.child = null;
          CoreStatusService.setStatus('Stopped', '进程被强制终止');
          resolve();
        }
      }, timeoutMs);

      this.child.once('exit', (code, signal) => {
        clearTimeout(killTimer);
        coreLogger.info(`Core process exited with code ${code} and signal ${signal}`);
        this.child = null;
        // 状态在 exit 事件处理器中已更新
        resolve();
      });

      // Send SIGTERM
      this.child.kill('SIGTERM');
    });
  }

  /**
   * Restart the Core process
   */
  async restart(): Promise<void> {
    if (!this.currentScriptPath) {
      const errorMsg = 'Cannot restart: Core process has never been started (no script path)';
      coreLogger.error(errorMsg);
      throw new Error(errorMsg);
    }

    coreLogger.info('Restarting Core process...');

    // 手动重启重置重试计数器
    this.restartRetryCount = 0;

    // Ensure clean stop first
    await this.stop();

    // Start again with saved configuration
    this.start(this.currentScriptPath, this.currentOptions);
  }

  /**
   * 获取当前状态服务（用于外部查询）
   */
  getStatusService(): typeof CoreStatusService {
    return CoreStatusService;
  }

  /**
   * 启动启动超时计时器
   */
  private startStartupTimer(): void {
    this.clearStartupTimer();

    this.startupTimer = setTimeout(() => {
      coreLogger.error(`Core process did not send READY within ${this.startupTimeoutMs}ms`);

      // 强制终止未响应的进程
      if (this.child) {
        coreLogger.warn('Force-killing Core process due to startup timeout');
        // 先移除所有监听器，避免 exit 事件覆盖超时状态
        this.child.removeAllListeners('exit');
        this.child.removeAllListeners('message');
        this.child.removeAllListeners('error');
        this.child.kill('SIGKILL');
        this.child = null;
      }

      // 在清理进程后设置超时状态，避免被 exit 事件覆盖
      CoreStatusService.markTimeout();
    }, this.startupTimeoutMs);

    coreLogger.debug(`Startup timeout set to ${this.startupTimeoutMs}ms`);
  }

  /**
   * 清除启动超时计时器
   */
  private clearStartupTimer(): void {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
  }

  /**
   * 设置进程事件监听器
   */
  private setupListeners(): void {
    if (!this.child) return;

    this.child.on('message', (message: unknown) => {
      this.handleIpcMessage(message as IpcPacket);
    });

    this.child.on('error', (err) => {
      coreLogger.error(`Core process error: ${err.message || err}`);
      CoreStatusService.setStatus('Error', err.message);
    });

    this.child.on('exit', (code, signal) => {
      coreLogger.info(`Core process exited (code=${code}, signal=${signal})`);
      this.clearStartupTimer();
      this.clearStabilityTimer();
      this.child = null;

      // 判断是否为崩溃（非零退出码）
      const isCrash = code !== null && code !== 0;

      // 正常停止或优雅关闭，无需自动重启
      if (this.isShuttingDown) {
        CoreStatusService.markStopped(code, signal as string | null);
        return;
      }

      // 正常退出（code === 0 或被信号终止）
      if (!isCrash) {
        CoreStatusService.markStopped(code, signal as string | null);
        return;
      }

      // 崩溃检测：检查是否超过最大重试次数
      if (this.restartRetryCount >= this.MAX_RESTART_RETRIES) {
        coreLogger.error(
          `Core 进程已崩溃 ${this.MAX_RESTART_RETRIES} 次，停止自动重启。需要手动干预。`
        );
        CoreStatusService.markRecoveryFailed(this.restartRetryCount);
        return;
      }

      // 增加重试计数器并延迟重启
      this.restartRetryCount++;
      coreLogger.warn(
        `Core 进程崩溃 (code=${code})。第 ${this.restartRetryCount}/${this.MAX_RESTART_RETRIES} 次重试，${this.RESTART_DELAY_MS}ms 后重启...`
      );
      CoreStatusService.markStopped(code, signal as string | null);

      setTimeout(() => {
        if (!this.isShuttingDown && this.currentScriptPath) {
          this.start(this.currentScriptPath, this.currentOptions);
        }
      }, this.RESTART_DELAY_MS);
    });
  }

  /**
   * 处理来自 Core 的 IPC 消息
   */
  private handleIpcMessage(packet: IpcPacket): void {
    const { type, payload } = packet;

    coreLogger.debug(`Received IPC message: ${type}`);

    switch (type) {
      case IpcMessages.CORE.READY:
        this.handleCoreReady();
        break;

      case IpcMessages.CORE.ERROR:
        this.handleCoreError(payload as { error?: string });
        break;

      case IpcMessages.CORE.LOG:
        this.handleCoreLog(payload as LogPayload);
        break;

      case IpcMessages.CORE.STATUS_CHANGE:
        this.handleCoreStatusChange(payload as StatusPayload);
        break;

      default:
        coreLogger.debug(`Unhandled IPC message type: ${type}`);
    }
  }

  /**
   * 处理 CORE:READY 消息
   */
  private handleCoreReady(): void {
    this.clearStartupTimer();
    CoreStatusService.markReady();
    coreLogger.info('Core process is ready');

    // 启动稳定期计时器 - 运行超过 STABILITY_PERIOD_MS 后重置重试计数器
    this.startStabilityTimer();
  }

  /**
   * 启动稳定期计时器
   * 当进程运行超过 STABILITY_PERIOD_MS 后，重置重试计数器
   */
  private startStabilityTimer(): void {
    this.clearStabilityTimer();

    this.stabilityTimer = setTimeout(() => {
      if (this.restartRetryCount > 0) {
        coreLogger.info(
          `Core 进程已稳定运行超过 ${this.STABILITY_PERIOD_MS / (60 * 1000)} 分钟，重置重试计数器 (${this.restartRetryCount} → 0)`
        );
        this.restartRetryCount = 0;
      }
    }, this.STABILITY_PERIOD_MS);

    coreLogger.debug(`稳定期计时器已启动: ${this.STABILITY_PERIOD_MS / (60 * 1000)} 分钟后重置重试计数器`);
  }

  /**
   * 清除稳定期计时器
   */
  private clearStabilityTimer(): void {
    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = null;
    }
  }

  /**
   * 处理 CORE:ERROR 消息
   */
  private handleCoreError(payload: { error?: string }): void {
    const errorMsg = payload?.error || 'Unknown error from Core';
    CoreStatusService.setStatus('Error', errorMsg);
    coreLogger.error(`Core reported error: ${errorMsg}`);
  }

  /**
   * 处理 CORE:LOG 消息 - 转发日志
   */
  private handleCoreLog(payload: LogPayload): void {
    if (!payload) return;

    const { level, message, context } = payload;
    const formattedMessage = `${CORE_LOG_PREFIX} ${message}`;

    // 使用 Backend 的 logger 按相应级别记录
    switch (level) {
      case 'debug':
        logger.debug(formattedMessage, context);
        break;
      case 'info':
        logger.info(formattedMessage, context);
        break;
      case 'warn':
        logger.warn(formattedMessage, context);
        break;
      case 'error':
        logger.error(formattedMessage, context);
        break;
      default:
        // 记录未知日志级别的警告
        coreLogger.warn(`Unknown log level received from Core: ${level}`);
        logger.info(formattedMessage, context);
    }
  }

  /**
   * 处理 CORE:STATUS_CHANGE 消息
   */
  private handleCoreStatusChange(payload: StatusPayload): void {
    if (!payload) return;

    const { status, lastError } = payload;
    CoreStatusService.setStatus(status, lastError);
    coreLogger.debug(`Core status changed to: ${status}`);
  }
}

