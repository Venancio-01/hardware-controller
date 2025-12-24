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

    // 设置数据处理逻辑
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
              // Priority 2: Business Logic Events
              
              // Handle Apply Button (Cabinet Relay 1, index 0)
              if (combinedUpdate.changeDescriptions.some(d => d.includes('CH1'))) {
                const isCabinetRelay1Closed = (combinedUpdate.combinedState[0]);
                if (isCabinetRelay1Closed) {
                   mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
                   // Also notify the child if it's already active
                   const snapshot = mainActor.getSnapshot();
                   if (snapshot.value === 'normal' && snapshot.children.applyAmmo) {
                      snapshot.children.applyAmmo.send({ type: 'APPLY' });
                   }
                } else {
                   // Button released - usually mapped to FINISHED in business logic
                   const snapshot = mainActor.getSnapshot();
                   if (snapshot.value === 'normal' && snapshot.children.applyAmmo) {
                      snapshot.children.applyAmmo.send({ type: 'FINISHED' });
                   }
                }
              }

              // Handle Authorization (Control Relay 5, index 12)
              if (combinedUpdate.changeDescriptions.some(d => d.includes('CH13'))) {
                 const isControlRelay5Closed = (combinedUpdate.combinedState[12]);
                 const snapshot = mainActor.getSnapshot();
                 if (snapshot.value === 'normal' && snapshot.children.applyAmmo) {
                    snapshot.children.applyAmmo.send({ type: isControlRelay5Closed ? 'AUTHORIZED' : 'REFUSE' });
                 }
              }

              // Handle Door Sensor (Cabinet Relay 2, index 1)
              if (combinedUpdate.changeDescriptions.some(d => d.includes('CH2'))) {
                 const isCabinetRelay2Closed = (combinedUpdate.combinedState[1]);
                 mainActor.send({ 
                   type: 'cabinet_lock_changed', 
                   priority: EventPriority.P2, 
                   isClosed: isCabinetRelay2Closed 
                 });
              }

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

      // 示例：模拟 P0 事件触发 (如果收到特定的硬件原始数据)
      if (rawStr.includes('ALARM_KEY')) {
        mainActor.send({ type: 'key_detected', priority: EventPriority.P0 });
      }

      // 其他响应
      appLogger.debug(`[${protocol.toUpperCase()}] Response from ${clientId}:`, { raw: rawStr, ...parsedResponse });
    };

    // 启动主状态机
    mainActor.start();
    
    // 启动 Monitor 子状态机 (Monitor is auto-invoked by Main)
    const monitorActor = mainActor.getSnapshot().children.monitor;
    if (monitorActor) {
      monitorActor.send({ type: 'START' });
    }

    appLogger.info(`开始 UDP 查询循环 (${config.QUERY_INTERVAL}ms 间隔)`);
    queryLoop = setInterval(() => {
      const currentMonitor = mainActor.getSnapshot().children.monitor;
      if (currentMonitor) {
        currentMonitor.send({ type: 'TICK' });
      }
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
