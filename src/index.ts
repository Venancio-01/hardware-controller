import { logger, createModuleLogger } from './logger/index.js';
import { getConfigSummary } from './config/index.js';
import { HardwareCommunicationManager } from './hardware/manager.js';
import { BusinessLogicManager } from './business-logic.js';

/**
 * 启动应用程序
 */
async function startApp() {
  const manager = new HardwareCommunicationManager();
  const appLogger = createModuleLogger('App');

  // 1. 打印配置摘要
  appLogger.info('正在启动 Node Switch 应用程序');
  appLogger.info('配置信息:', getConfigSummary());

  try {
    // 2. 初始化业务逻辑
    const businessLogic = new BusinessLogicManager(manager, appLogger);
    await businessLogic.initialize();

    // 3. 启动查询循环
    businessLogic.startLoop();

    // 4. 关闭处理
    process.on('SIGINT', async () => {
      appLogger.info('\n正在关闭...');
      businessLogic.stop();

      await manager.shutdown();
      appLogger.info('应用程序已停止');
      process.exit(0);
    });
  } catch (error) {
    appLogger.error('启动应用程序失败', error as Error);
    process.exit(1);
  }
}

startApp().catch((error) => {
  logger.error('运行应用程序失败', error as Error);
  process.exit(1);
});
