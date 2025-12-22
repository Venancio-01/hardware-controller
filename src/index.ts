import { config, getConfigSummary } from './config/index.js';
import { logger, createModuleLogger } from './logger/index.js';
import { HardwareCommunicationManager } from './hardware/manager.js';
import { initializeHardware } from './hardware/initializer.js';
import { initializeVoiceBroadcast } from './voice-broadcast/initializer.js';
import { resetAllRelays } from './relay/reset.js';
import { RelayStatusAggregator, type RelayClientId } from './business-logic/relay-status-aggregator.js';
import { ApplyAmmoFlow } from './business-logic/apply-ammo-flow.js';
import { createPollerActor } from './state-machines/poller-machine.js';
import { parseStatusResponse } from './relay/controller.js';

/**
 * 启动应用程序
 */
async function startApp() {
  const appLogger = createModuleLogger('App');
  const manager = new HardwareCommunicationManager();
  const relayAggregator = new RelayStatusAggregator();
  const applyAmmoFlow = new ApplyAmmoFlow(appLogger);
  const pollerActor = createPollerActor(manager);

  let queryLoop: NodeJS.Timeout | null = null;

  // 打印配置摘要
  appLogger.info('正在启动 Node Switch 应用程序');
  appLogger.info('配置信息:', getConfigSummary());

  try {
    // 1. 初始化硬件通信
    await initializeHardware(manager, appLogger);

    // 2. 重置继电器状态
    await resetAllRelays(manager, appLogger);

    // 3. 初始化语音播报
    await initializeVoiceBroadcast(manager, appLogger);

    // 4. 设置数据处理逻辑
    manager.onIncomingData = async (protocol, clientId, data, remote, parsedResponse) => {
      const rawStr = data.toString('utf8').trim();

      // 解析继电器状态响应 (dostatus)
      if (rawStr.startsWith('dostatus')) {
        try {
          const status = parseStatusResponse(rawStr, 'dostatus');

          if (clientId === 'cabinet' || clientId === 'control') {
            const combinedUpdate = relayAggregator.update(
              clientId as RelayClientId,
              status
            );

            if (combinedUpdate && combinedUpdate.changed) {
              applyAmmoFlow.handleCombinedChange(
                combinedUpdate.previousCombined,
                combinedUpdate.combinedState
              );

              if (combinedUpdate.changeDescriptions.length > 0) {
                appLogger.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
                appLogger.info(
                  `[combined] 当前全部十六路状态: ${combinedUpdate.allStatusText} (raw: cabinet=${combinedUpdate.raw.cabinet} control=${combinedUpdate.raw.control})`
                );
              }
            }
          }
        } catch (err) {
          appLogger.error(`解析继电器状态失败: ${rawStr}`, err as Error);
        }
        return;
      }

      // 其他响应
      appLogger.debug(`[${protocol.toUpperCase()}] Response from ${clientId}:`, { raw: rawStr, ...parsedResponse });
    };

    // 5. 启动业务流
    applyAmmoFlow.start();

    // 6. 启动查询循环 (Poller)
    pollerActor.start();
    pollerActor.send({ type: 'START' });

    appLogger.info(`开始 UDP 查询循环 (${config.QUERY_INTERVAL}ms 间隔)`);
    queryLoop = setInterval(() => {
      pollerActor.send({ type: 'TICK' });
    }, config.QUERY_INTERVAL);

    // 关闭处理
    const shutdown = async () => {
      appLogger.info('\n正在关闭...');
      if (queryLoop) clearInterval(queryLoop);
      pollerActor.send({ type: 'STOP' });
      pollerActor.stop();
      applyAmmoFlow.stop();
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