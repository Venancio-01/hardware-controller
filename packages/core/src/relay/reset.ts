import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { RelayCommandBuilder } from './controller.js';

/**
 * 重置所有注册设备的继电器状态为断开
 */
export async function resetAllRelays(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  logger.info('初始化所有继电器状态 (全部置为断开)...');
  const resetCmd = RelayCommandBuilder.open('all');
  logger.info(`[Reset] Generated reset command (Hex): ${resetCmd.toString('hex').toUpperCase()}`);

  // 动态检测已初始化的客户端，只向已连接的发送命令
  const status = manager.getAllConnectionStatus();
  const targets: { id: string; protocol: 'tcp' | 'serial' }[] = [];

  // Cabinet 设备通过 TCP 连接
  if (status.tcp['cabinet']) {
    targets.push({ id: 'cabinet', protocol: 'tcp' });
  }

  // Control 设备通过 Serial 连接
  if (status.serial['control']) {
    targets.push({ id: 'control', protocol: 'serial' });
  }

  if (targets.length === 0) {
    logger.warn('未检测到已初始化的继电器客户端 (cabinet/control)，跳过继电器重置');
    return;
  }

  const results = await Promise.allSettled(targets.map(async ({ id, protocol }) => {
    try {
      logger.debug(`[${id}] 正在通过 ${protocol.toUpperCase()} 发送重置命令...`);
      await manager.sendCommand(protocol, resetCmd, undefined, id, false);
      logger.info(`[${id}] 继电器重置命令发送成功`, { protocol });
      return { id, success: true };
    } catch (err) {
      logger.error(`[${id}] 继电器重置命令发送失败: ${(err as Error).message}`, { protocol });
      throw err;
    }
  }));

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    logger.warn(`部分设备重置失败: ${failed.length}/${targets.length}`);
  } else if (targets.length > 0) {
    logger.info('所有目标设备重置命令发送完成');
  }
}
