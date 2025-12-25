import { spawn } from 'child_process';
import { logger } from '../utils/logger.js';

/**
 * 重启服务管理器
 * 负责处理应用的优雅关闭和重启逻辑
 */
export class RestartService {
  private static instance: RestartService;
  private isRestarting: boolean = false;

  private constructor() {}

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

      // 1. 通知所有状态机准备关闭（通过全局事件）
      this.notifyStateMachinesPrepareShutdown();

      // 2. 等待短暂时间让状态机响应
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. 清理硬件连接
      logger.info('Cleaning up hardware connections');
      this.cleanupHardwareConnections();

      // 4. 关闭服务器连接
      logger.info('Closing server connections');
      this.closeServerConnections();

      // 5. 等待一段时间确保清理完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6. 执行重启 - 使用当前执行环境重启应用
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
    // 在实际实现中，这里会向全局状态管理器发送关闭信号
    // 暂时记录日志
    logger.info('Notifying state machines of impending shutdown');
  }

  /**
   * 清理硬件连接
   * 关闭所有硬件通信连接
   */
  private cleanupHardwareConnections(): void {
    // 在实际实现中，这里会调用硬件管理器的清理方法
    // 暂时记录日志
    logger.info('Cleaning up hardware connections');
  }

  /**
   * 关闭服务器连接
   * 关闭所有服务器相关连接
   */
  private closeServerConnections(): void {
    // 在实际实现中，这里会关闭HTTP服务器等连接
    // 暂时记录日志
    logger.info('Closing server connections');
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

    // 等待子进程启动
    setTimeout(() => {
      // 安全退出当前进程
      process.exit(0);
    }, 500);
  }
}