import { logger } from './logger.js';

/**
 * 关闭处理器类型
 */
type ShutdownHandler = () => Promise<void> | void;

/**
 * 优雅关闭管理器
 *
 * 负责协调系统重启时的优雅关闭流程
 * - XState 状态机 actors
 * - 硬件连接
 * - HTTP 服务器
 * - 其他资源
 */
export class ShutdownManager {
  private static instance: ShutdownManager;
  private handlers: Map<string, ShutdownHandler> = new Map();
  private isShuttingDown: boolean = false;

  private constructor() {}

  public static getInstance(): ShutdownManager {
    if (!ShutdownManager.instance) {
      ShutdownManager.instance = new ShutdownManager();
    }
    return ShutdownManager.instance;
  }

  /**
   * 注册关闭处理器
   *
   * @param name - 处理器名称（用于日志记录）
   * @param handler - 关闭处理函数
   */
  public registerHandler(name: string, handler: ShutdownHandler): void {
    if (this.isShuttingDown) {
      logger.warn(`Attempted to register handler "${name}" during shutdown`);
      return;
    }

    this.handlers.set(name, handler);
    logger.debug(`Registered shutdown handler: ${name}`);
  }

  /**
   * 移除关闭处理器
   *
   * @param name - 处理器名称
   */
  public unregisterHandler(name: string): void {
    this.handlers.delete(name);
    logger.debug(`Unregistered shutdown handler: ${name}`);
  }

  /**
   * 执行所有关闭处理器
   *
   * 按照注册顺序的逆序执行（后注册的先关闭）
   *
   * @returns 关闭是否成功完成
   */
  public async executeShutdown(): Promise<boolean> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return false;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown sequence');

    try {
      // 获取所有处理器名称（按注册顺序的逆序）
      const handlerNames = Array.from(this.handlers.keys()).reverse();

      // 执行每个关闭处理器
      for (const name of handlerNames) {
        const handler = this.handlers.get(name);
        if (!handler) continue;

        try {
          logger.info(`Executing shutdown handler: ${name}`);
          await handler();
          logger.info(`Shutdown handler completed: ${name}`);
        } catch (error) {
          logger.error({ err: error }, `Shutdown handler failed: ${name}`);
          // 继续执行其他处理器，即使某个失败
        }
      }

      logger.info('Graceful shutdown completed successfully');
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Graceful shutdown failed');
      return false;
    }
  }

  /**
   * 清空所有处理器（用于测试）
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * 重置关闭状态（用于测试）
   */
  public reset(): void {
    this.isShuttingDown = false;
  }
}

/**
 * 全局关闭管理器实例
 */
export const shutdownManager = ShutdownManager.getInstance();
