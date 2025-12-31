/**
 * 网络配置服务
 *
 * 封装 nmcli 命令调用，用于管理 Orange Pi 设备的网络配置
 * 目标环境：Ubuntu 18, ARM v7l 架构
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { createModuleLogger } from 'shared';

const execAsync = promisify(exec);
const logger = createModuleLogger('NetworkService');

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
}

/**
 * 网络接口信息
 */
interface ConnectionInfo {
  name: string;
  device: string;
}

/**
 * 子网掩码转换为 CIDR 前缀长度
 * 例如：255.255.255.0 -> 24
 */
function subnetMaskToCidr(mask: string): number {
  const parts = mask.split('.').map(Number);
  let bits = 0;
  for (const part of parts) {
    bits += (part >>> 0).toString(2).split('1').length - 1;
  }
  return bits;
}

/**
 * CIDR 前缀长度转换为子网掩码
 * 例如：24 -> 255.255.255.0
 */
function cidrToSubnetMask(cidr: number): string {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const bits = Math.min(8, Math.max(0, cidr - i * 8));
    mask.push(256 - Math.pow(2, 8 - bits));
  }
  return mask.join('.');
}

/**
 * 网络配置服务类
 */
export class NetworkService {
  /**
   * 获取当前活动的网络连接信息
   * @returns 连接名称和设备名称
   */
  async getActiveConnection(): Promise<ConnectionInfo | null> {
    try {
      // 获取活动连接列表
      const { stdout } = await execAsync('nmcli -t -f NAME,DEVICE connection show --active');
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);

      // 查找第一个有效的以太网连接
      for (const line of lines) {
        const [name, device] = line.split(':');
        // 跳过回环接口
        if (device && device !== 'lo') {
          logger.info('找到活动连接', { name, device });
          return { name, device };
        }
      }

      logger.warn('未找到活动的以太网连接');
      return null;
    } catch (error: any) {
      logger.error('获取活动连接失败', { error: error.message });
      throw new Error(`获取活动连接失败: ${error.message}`);
    }
  }



  /**
   * 获取当前网络配置
   * 使用 Node.js 标准 API 获取 IP 和子网掩码
   * 使用 ip route 命令获取网关
   */
  async getNetworkConfig(): Promise<NetworkConfig> {
    try {
      // 1. 获取网络接口信息
      const interfaces = os.networkInterfaces();
      let ipAddress = '';
      let subnetMask = '';

      // 尝试找到活动的网络接口
      // 优先查找 eth0, eth1 等以太网接口，或者 wlan0 无线接口
      // 如果有明确的活动连接（通过 getActiveConnection 获取），则优先匹配该连接的设备名

      let targetInterfaceName = '';
      try {
        const activeConnection = await this.getActiveConnection();
        if (activeConnection) {
          targetInterfaceName = activeConnection.device;
        }
      } catch (e) {
        logger.warn('无法获取活动连接信息，将尝试自动检测接口', { error: (e as Error).message });
      }

      // 查找目标接口或第一个非内部 IPv4 接口
      const ifaceName = targetInterfaceName || Object.keys(interfaces).find(name => {
        const iface = interfaces[name];
        return iface?.some(info => !info.internal && info.family === 'IPv4');
      });

      if (ifaceName && interfaces[ifaceName]) {
        const info = interfaces[ifaceName]?.find(i => i.family === 'IPv4');
        if (info) {
          ipAddress = info.address;
          subnetMask = info.netmask;
        }
      }

      // 2. 获取网关信息 (Node.js os 模块不提供网关，需通过 ip route 获取)
      let gateway = '';
      try {
        const { stdout } = await execAsync('ip route show default');
        const match = stdout.match(/default via ([\d.]+)/);
        if (match && match[1]) {
          gateway = match[1];
        }
      } catch (error) {
        logger.warn('无法获取网关信息', { error: (error as Error).message });
      }

      const config: NetworkConfig = {
        ipAddress: ipAddress || '0.0.0.0',
        subnetMask: subnetMask || '255.255.255.0',
        gateway: gateway || '0.0.0.0',
      };

      logger.info('获取网络配置成功', { config });
      return config;
    } catch (error: any) {
      logger.error('获取网络配置失败', { error: error.message });
      throw new Error(`获取网络配置失败: ${error.message}`);
    }
  }

  /**
   * 应用网络配置
   * 使用 nmcli 命令修改系统网络配置
   *
   * @param config 新的网络配置
   */
  async applyNetworkConfig(config: NetworkConfig): Promise<void> {
    const { ipAddress, subnetMask, gateway } = config;

    try {
      const connection = await this.getActiveConnection();
      if (!connection) {
        throw new Error('未找到活动的网络连接');
      }

      const cidr = subnetMaskToCidr(subnetMask);
      const ipWithCidr = `${ipAddress}/${cidr}`;

      logger.info('开始应用网络配置', {
        connectionName: connection.name,
        ipWithCidr,
        gateway,
      });

      // 修改连接配置
      const modifyCmd = `nmcli connection modify "${connection.name}" ipv4.addresses "${ipWithCidr}" ipv4.gateway "${gateway}" ipv4.method manual`;
      logger.debug('执行命令', { cmd: modifyCmd });
      await execAsync(modifyCmd);

      // 重新激活连接以应用更改
      const upCmd = `nmcli connection up "${connection.name}"`;
      logger.debug('执行命令', { cmd: upCmd });
      await execAsync(upCmd);

      logger.info('网络配置应用成功', {
        ipAddress,
        subnetMask,
        gateway,
      });
    } catch (error: any) {
      logger.error('应用网络配置失败', { error: error.message });
      throw new Error(`应用网络配置失败: ${error.message}`);
    }
  }

  /**
   * 验证网络配置参数
   * @param config 待验证的配置
   * @returns 验证结果
   */
  validateConfig(config: NetworkConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipRegex.test(config.ipAddress)) {
      errors.push(`IP 地址格式无效: ${config.ipAddress}`);
    }

    if (!ipRegex.test(config.subnetMask)) {
      errors.push(`子网掩码格式无效: ${config.subnetMask}`);
    }

    if (!ipRegex.test(config.gateway)) {
      errors.push(`网关地址格式无效: ${config.gateway}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
