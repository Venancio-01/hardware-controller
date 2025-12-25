/**
 * 冲突检测服务
 *
 * 提供网络配置冲突检测功能，包括IP冲突检测、端口占用检测和网络配置合理性检查
 */

import { ConflictDetectionRequest, ConflictDetectionResult, ConflictCheckType } from 'shared';
import { logger as baseLogger } from '../utils/logger.js';
import { ConfigService } from './config.service.js';
import { connectionTestService } from './connection-test.service.js';

const logger = baseLogger.child({ module: 'ConflictDetectionService' });

export class ConflictDetectionService {
  private configService: ConfigService;

  constructor(configService?: ConfigService) {
    this.configService = configService || new ConfigService();
  }

  /**
   * 执行冲突检测
   */
  async checkConflict(request: ConflictDetectionRequest): Promise<ConflictDetectionResult> {
    const { config, checkTypes = ['all'], timeout = 5000 } = request;
    const startTime = Date.now();

    // 确定要执行的检查类型
    const typesToCheck: ConflictCheckType[] =
      checkTypes.includes('all') ? ['ip', 'port', 'network'] : checkTypes;

    const results: ConflictDetectionResult = {
      success: true,
      passedChecks: [],
      failedChecks: [],
      details: [],
    };

    // 依次执行每种类型的检查
    for (const checkType of typesToCheck) {
      const checkStartTime = Date.now();
      let checkSuccess = true;
      let checkError: string | undefined;
      let checkInfo: Record<string, any> | undefined;

      try {
        switch (checkType) {
          case 'ip':
            checkInfo = await this.checkIPConflict(config, timeout);
            break;
          case 'port':
            checkInfo = await this.checkPortConflict(config, timeout);
            break;
          case 'network':
            checkInfo = await this.checkNetworkConfigValidity(config);
            break;
          default:
            throw new Error(`未知的冲突检测类型: ${checkType}`);
        }
      } catch (error) {
        checkSuccess = false;
        checkError = error instanceof Error ? error.message : '未知错误';
      }

      const checkLatency = Date.now() - checkStartTime;

      // 记录检查详情
      results.details?.push({
        type: checkType,
        success: checkSuccess,
        error: checkError,
        latency: checkLatency,
        info: checkInfo,
      });

      if (checkSuccess) {
        results.passedChecks?.push(checkType);
      } else {
        results.failedChecks?.push({
          type: checkType,
          error: checkError || '未知错误',
        });
        results.success = false; // 如果有任何检查失败，整体结果为失败
      }
    }

    results.totalLatency = Date.now() - startTime;

    logger.info({
      success: results.success,
      passed: results.passedChecks,
      failed: results.failedChecks,
      totalLatency: results.totalLatency
    }, '冲突检测完成');

    return results;
  }

  /**
   * 检测IP地址冲突
   * 尝试ping目标IP地址，如果能通说明IP已被占用
   */
  private async checkIPConflict(config: any, timeout: number): Promise<Record<string, any>> {
    const networkConfig = config.network;
    if (!networkConfig || !networkConfig.ipAddress) {
      return { message: '未提供网络配置或IP地址，跳过IP冲突检测' };
    }

    const { ipAddress } = networkConfig;
    const pingResult = await this.pingIP(ipAddress, timeout);

    if (pingResult.success) {
      throw new Error(`IP 地址 ${ipAddress} 已被占用，可能会导致冲突`);
    }

    return {
      message: `IP 地址 ${ipAddress} 未检测到冲突`,
      pingSuccessful: pingResult.success,
    };
  }

  /**
   * 检测端口占用冲突
   * 检查指定端口是否已被系统或其他服务占用
   */
  private async checkPortConflict(config: any, timeout: number): Promise<Record<string, any>> {
    const networkConfig = config.network;
    if (!networkConfig || !networkConfig.port) {
      return { message: '未提供网络配置或端口，跳过端口冲突检测' };
    }

    const { port } = networkConfig;

    // 使用连接测试服务来测试端口是否可达
    const connectionResult = await connectionTestService.testConnection({
      ipAddress: 'localhost',
      port,
      protocol: 'tcp',
      timeout: Math.min(timeout, 1000), // 端口检测使用较短超时时间
    });

    if (connectionResult.success) {
      logger.warn(`端口 ${port} 似乎已被占用`);
      throw new Error(`端口 ${port} 已被占用，无法使用`);
    }

    return {
      message: `端口 ${port} 未检测到冲突`,
      portTestSuccessful: !connectionResult.success,
    };
  }

  /**
   * 检查网络配置合理性
   * 验证IP地址、子网掩码、网关是否在同一网段，检查网关是否可达
   */
  private async checkNetworkConfigValidity(config: any): Promise<Record<string, any>> {
    const networkConfig = config.network;
    if (!networkConfig) {
      return { message: '未提供网络配置，跳过网络配置合理性检查' };
    }

    const { ipAddress, subnetMask, gateway } = networkConfig;

    // 检查IP地址格式
    if (!this.isValidIPv4(ipAddress)) {
      throw new Error(`IP 地址格式无效: ${ipAddress}`);
    }

    // 检查子网掩码格式
    if (!this.isValidIPv4(subnetMask)) {
      throw new Error(`子网掩码格式无效: ${subnetMask}`);
    }

    // 检查网关格式（如果提供了网关）
    if (gateway && !this.isValidIPv4(gateway)) {
      throw new Error(`网关格式无效: ${gateway}`);
    }

    // 验证IP地址、子网掩码和网关是否在同一网段
    if (ipAddress && subnetMask && gateway) {
      if (!this.isInSameNetwork(ipAddress, gateway, subnetMask)) {
        throw new Error(`IP 地址 ${ipAddress} 与网关 ${gateway} 不在同一网段 (${subnetMask})`);
      }
    }

    // 如果提供了网关，检查网关是否可达
    if (gateway) {
      const gatewayPingResult = await this.pingIP(gateway, 3000); // 网关检测使用3秒超时
      if (!gatewayPingResult.success) {
        logger.warn(`网关 ${gateway} 不可达或响应缓慢`);
        // 注意：这里我们只发出警告而不是错误，因为网关可能仅在设备重启后才可用
      }
    }

    return {
      message: '网络配置合理性检查通过',
      ipValid: this.isValidIPv4(ipAddress),
      subnetValid: this.isValidIPv4(subnetMask),
      gatewayValid: !gateway || this.isValidIPv4(gateway),
      sameNetwork: !ipAddress || !gateway || !subnetMask || this.isInSameNetwork(ipAddress, gateway, subnetMask),
    };
  }

  /**
   * 检查IP地址格式是否有效
   */
  private isValidIPv4(ip: string): boolean {
    if (!ip) return false;

    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);

    if (!match) return false;

    // 检查每个部分是否在0-255范围内
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查两个IP是否在同一网段
   */
  private isInSameNetwork(ip1: string, ip2: string, subnetMask: string): boolean {
    try {
      const ip1Octets = ip1.split('.').map(Number);
      const ip2Octets = ip2.split('.').map(Number);
      const maskOctets = subnetMask.split('.').map(Number);

      for (let i = 0; i < 4; i++) {
        if ((ip1Octets[i] & maskOctets[i]) !== (ip2Octets[i] & maskOctets[i])) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error({ error }, '检查网络段时出错');
      return false;
    }
  }

  /**
   * 检测IP地址是否可达（ping操作）
   * 这里使用一个简化的模拟实现，实际应用中可以使用真正的ping命令
   */
  private async pingIP(ipAddress: string, timeout: number): Promise<{ success: boolean; error?: string }> {
    try {
      // 使用 Node.js 内置的 dns 模块尝试解析 IP 地址
      // 对于真正的ping操作，我们可以使用 net 模块尝试TCP连接到常见端口
      // 或者执行系统ping命令（需要根据操作系统适配）
      const net = require('net');

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const socket = new net.Socket();
        let responded = false;

        // 尝试连接到目标 IP 的常见端口（例如 SSH 22，HTTP 80）
        // 这是检测设备是否存在的一个简单方法
        socket.setTimeout(timeout);

        socket.connect(22, ipAddress, () => {
          // 端口22连接成功（SSH）- 表示目标主机存在
          if (!responded) {
            responded = true;
            socket.destroy();
            resolve({ success: true });
          }
        });

        socket.on('error', (err: any) => {
          // 端口22连接失败，尝试常见端口80
          if (!responded) {
            const httpSocket = new net.Socket();
            httpSocket.setTimeout(timeout);

            httpSocket.connect(80, ipAddress, () => {
              // 端口80连接成功 - 表示目标主机存在
              if (!responded) {
                responded = true;
                httpSocket.destroy();
                resolve({ success: true });
              }
            });

            httpSocket.on('error', () => {
              // 端口80也连接失败，尝试端口443
              if (!responded) {
                const httpsSocket = new net.Socket();
                httpsSocket.setTimeout(timeout);

                httpsSocket.connect(443, ipAddress, () => {
                  if (!responded) {
                    responded = true;
                    httpsSocket.destroy();
                    resolve({ success: true });
                  }
                });

                httpsSocket.on('error', () => {
                  // 所有常见端口都连接失败，认为IP未被占用
                  if (!responded) {
                    responded = true;
                    httpsSocket.destroy();
                    resolve({ success: false });
                  }
                });

                httpsSocket.on('timeout', () => {
                  if (!responded) {
                    responded = true;
                    httpsSocket.destroy();
                    resolve({ success: false });
                  }
                });
              }
            });

            httpSocket.on('timeout', () => {
              if (!responded) {
                responded = true;
                httpSocket.destroy();
                resolve({ success: false });
              }
            });
          }
        });

        socket.on('timeout', () => {
          if (!responded) {
            responded = true;
            socket.destroy();
            // 端口22连接超时，尝试其他端口（如上面的逻辑）
          }
        });
      });
    } catch (error) {
      logger.error({ error, ipAddress }, 'ping IP 时出错');
      return { success: false, error: (error as Error).message };
    }
  }
}

// 导出单例实例
export const conflictDetectionService = new ConflictDetectionService();