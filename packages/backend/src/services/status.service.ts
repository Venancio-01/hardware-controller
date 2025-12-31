import { createModuleLogger } from 'shared';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const logger = createModuleLogger('StatusService');
import type { DeviceStatus } from 'shared';

const execAsync = promisify(exec);

export class StatusService {
  async getStatus(): Promise<DeviceStatus> {
    logger.info('读取设备状态');

    // 获取真实网络接口信息
    let ipAddress = '127.0.0.1';
    let port = 8080;
    let subnetMask = '255.255.255.0';
    let gateway = '127.0.0.1';

    try {
      const interfaces = os.networkInterfaces();

      // 优先使用eth1接口
      if (interfaces.eth1) {
        const eth1Info = interfaces.eth1.find((iface) => iface.family === 'IPv4');
        if (eth1Info) {
          ipAddress = eth1Info.address;
          subnetMask = eth1Info.netmask;
        }
      }

      // 尝试获取网关信息
      try {
        const { stdout } = await execAsync('ip route show default');
        const match = stdout.match(/default via ([\d.]+)/);
        if (match && match[1]) {
          gateway = match[1];
        }
      } catch (error) {
        logger.warn('无法获取网关信息', { error: (error as Error).message });
      }
    } catch (error) {
      logger.warn('获取网络接口信息失败，使用默认值', { error: (error as Error).message });
    }

    return {
      online: true,
      ipAddress,
      subnetMask,
      gateway,
      port,
      protocol: 'TCP',
      uptime: Math.floor(process.uptime()),
    };
  }
}

