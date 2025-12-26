import { spawn } from 'child_process';
import { createSimpleLogger } from 'shared';

const logger = createSimpleLogger();
import { shutdownManager } from '../utils/shutdown-manager.js';

/**
 * 重启服务管理器
 * 负责处理应用的优雅关闭和重启逻辑
 */
export class RestartService {
  private static instance: RestartService;
  private isRestarting: boolean = false;

  private constructor() {
    // 注册 XState 状态机关闭处理器
    // TODO: 当实现 XState actors 时，在这里注册它们的关闭处理器
    shutdownManager.registerHandler('xstate-actors', async () => {
      this.notifyStateMachinesPrepareShutdown();
    });

    // 注册硬件连接关闭处理器
    // TODO: 当实现硬件管理器时，在这里注册它的关闭处理器
    shutdownManager.registerHandler('hardware-connections', async () => {
      this.cleanupHardwareConnections();
    });
  }

  public static getInstance(): RestartService {
    if (!RestartService.instance) {
      RestartService.instance = new RestartService();
    }
    return RestartService.instance;
  }

  /**
   * 执行系统重启
   * 实现优雅关闭并重启进程
   */
  public async restartSystem(): Promise<boolean> {
    if (this.isRestarting) {
      logger.warn('Restart already in progress, skipping duplicate request');
      return false;
    }

    try {
      logger.info('Initiating system restart sequence');
      this.isRestarting = true;

      // 1. 通知所有状态机准备关闭（通过 ShutdownManager 执行注册的处理器）
      logger.info('Notifying state machines of impending shutdown');
      // 注意：实际的关闭将在 executeShutdown() 中按顺序执行

      // 2. 等待短暂时间让状态机响应
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. 执行所有注册的关闭处理器（包括硬件连接和 HTTP 服务器）
      logger.info('Executing graceful shutdown sequence');
      const shutdownSuccess = await shutdownManager.executeShutdown();

      if (!shutdownSuccess) {
        logger.warn('Some shutdown handlers failed, proceeding with restart anyway');
      }

      // 4. 等待一段时间确保清理完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. 执行重启 - 使用当前执行环境重启应用
      logger.info('Executing process restart');
      this.restartProcess();

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to initiate restart sequence');
      this.isRestarting = false;
      throw error;
    }
  }

  /**
   * 通知状态机准备关闭
   * 发送关闭信号给所有活跃的状态机
   */
  private notifyStateMachinesPrepareShutdown(): void {
    // TODO: 当实现 XState actors 时，这里会：
    // 1. 获取所有活跃的 actor 引用
    // 2. 向每个 actor 发送 STOP 事件
    // 3. 等待 actor 完成清理逻辑
    logger.info('Notifying state machines of impending shutdown');
    logger.info('Note: XState actors integration is pending implementation');
  }

  /**
   * 清理硬件连接
   * 关闭所有硬件通信连接
   */
  private cleanupHardwareConnections(): void {
    // TODO: 当实现硬件管理器时，这里会：
    // 1. 调用 HardwareCommunicationManager 的 disconnect() 方法
    // 2. 关闭所有 TCP/UDP socket 连接
    // 3. 等待硬件响应关闭确认
    logger.info('Cleaning up hardware connections');
    logger.info('Note: Hardware manager integration is pending implementation');
  }

  /**
   * 重启进程
   * 根据运行环境决定如何重启应用
   */
  private restartProcess(): void {
    const currentProcess = process;

    // 记录重启信息
    logger.info({
      pid: currentProcess.pid,
      platform: currentProcess.platform,
      argv: currentProcess.argv
    }, 'Restarting process');

    // 设置重启标志
    process.env.NODE_SWITCH_RESTARTING = 'true';

    // 使用当前参数重启进程
    const child = spawn(currentProcess.argv[0], currentProcess.argv.slice(1), {
      detached: true,
      stdio: 'inherit',
      env: { ...process.env }
    });

    // 监听子进程错误
    child.on('error', (err) => {
      logger.error({ err }, 'Failed to spawn child process');
      process.exit(1);
    });

    // 等待子进程启动
    setTimeout(() => {
      // 使用退出码 1 告诉 systemd/pm2 这是重启（正常退出）
      // 大多数进程管理器会将非零退出码视为需要重启
      process.exit(1);
    }, 500);
  }
}