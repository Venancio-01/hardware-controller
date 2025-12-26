import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { RelayCommandBuilder } from './controller.js';

/**
 * 重置所有注册设备的继电器状态为断开
 */
export async function resetAllRelays(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  logger.info('初始化所有继电器状态 (全部置为断开)...');
  const resetCmd = RelayCommandBuilder.open('all');

  const targets = ['cabinet', 'control'];

  const promises = targets.map(async (target) => {
    try {
      await manager.sendCommand('udp', resetCmd, undefined, target, false);
      logger.info(`[${target}] 继电器初始化重置成功`);
    } catch (err) {
      logger.error(`[${target}] 继电器初始化重置失败: ${(err as Error).message}`);
    }
  });

  await Promise.all(promises);
}
