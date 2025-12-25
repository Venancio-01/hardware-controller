import { config, getConfigSummary } from './config/index.js';
import { logger, createModuleLogger } from './logger/index.js';
import { HardwareCommunicationManager } from './hardware/manager.js';
import { initializeHardware } from './hardware/initializer.js';
import { initializeVoiceBroadcast } from './voice-broadcast/initializer.js';
import { resetAllRelays } from './relay/reset.js';
import { RelayStatusAggregator, type RelayClientId } from './business-logic/relay-status-aggregator.js';
import { createMainActor } from './state-machines/main-machine.js';
import { parseStatusResponse } from './relay/controller.js';
import { EventPriority } from './types/state-machine.js';

/**
 * 启动应用程序
 */
async function startApp() {
  const appLogger = createModuleLogger('App');
  const manager = new HardwareCommunicationManager();
  const relayAggregator = new RelayStatusAggregator();

  // Create Main State Machine Actor
  const mainActor = createMainActor(manager, appLogger);

  let queryLoop: NodeJS.Timeout | null = null;

  // 打印配置摘要
  appLogger.info('正在启动 Node Switch 应用程序');
  appLogger.info('配置信息:', getConfigSummary());

  try {
    //  初始化硬件通信
    await initializeHardware(manager, appLogger);

    // 初始化语音播报
    await initializeVoiceBroadcast(manager, appLogger);

    // 重置继电器状态
    await resetAllRelays(manager, appLogger);

    // 启动主状态机
    mainActor.start();

    // 启动 Monitor 子状态机
    mainActor.send({ type: 'monitor_tick', priority: EventPriority.P3 });

    appLogger.info(`开始 UDP 查询循环 (${config.QUERY_INTERVAL}ms 间隔)`);
    queryLoop = setInterval(() => {
      mainActor.send({ type: 'monitor_tick', priority: EventPriority.P3 });
    }, config.QUERY_INTERVAL);

    // 关闭处理
    const shutdown = async () => {
      appLogger.info('\n正在关闭...');
      if (queryLoop) clearInterval(queryLoop);
      mainActor.stop();
      await manager.shutdown();
      appLogger.info('应用程序已停止');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    appLogger.error('启动应用程序失败', error as Error);
    process.exit(1);
  }
}

startApp().catch((error) => {
  logger.error('运行应用程序失败', error as Error);
  process.exit(1);
});
