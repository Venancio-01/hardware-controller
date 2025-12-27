import { createModuleLogger } from 'shared';

const logger = createModuleLogger('StatusService');
import type { DeviceStatus } from 'shared';

export class StatusService {
  async getStatus(): Promise<DeviceStatus> {
    logger.info('读取设备状态 (Mock)');

    // Mock data
    return {
      online: true,
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'TCP',
      uptime: Math.floor(process.uptime()),
    };
  }
}
