/**
 * 冲突检测服务
 *
 * 提供网络配置冲突检测功能，包括IP冲突检测、端口占用检测和网络配置合理性检查
 */

import { ConflictDetectionRequest, ConflictDetectionResult, ConflictCheckType, createModuleLogger } from 'shared';
import { ConfigService } from './config.service.js';

const logger = createModuleLogger('ConflictDetectionService');

export class ConflictDetectionService {
  private configService: ConfigService;

  constructor(configService?: ConfigService) {
    this.configService = configService || new ConfigService();
  }

  /**
   * 执行冲突检测
   * 为每个检测方法添加超时保护
   */
  async checkConflict(request: ConflictDetectionRequest): Promise<ConflictDetectionResult> {
    const { config, checkTypes = ['all'], timeout = 5000 } = request;
    const startTime = Date.now();

    // 确定要执行的检查类型
    const typesToCheck: ConflictCheckType[] =
      checkTypes.includes('all') ? ['ip', 'network'] : checkTypes;

    const results: ConflictDetectionResult = {
      success: true,
      passedChecks: [],
      failedChecks: [],
      details: [],
    };

    // 依次执行每种类型的检查（每个都有超时保护）
    for (const checkType of typesToCheck) {
      const checkStartTime = Date.now();
      let checkSuccess = true;
      let checkError: string | undefined;
      let checkInfo: Record<string, any> | undefined;

      try {
        // 为每个检测操作添加超时保护
        const checkPromise = this.performCheck(checkType, config, timeout);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${checkType} 检测超时`)), timeout)
        );

        checkInfo = await Promise.race([checkPromise, timeoutPromise]) as Record<string, any>;
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

    logger.info('冲突检测完成', {
      success: results.success,
      passed: results.passedChecks,
      failed: results.failedChecks,
      totalLatency: results.totalLatency
    });

    return results;
  }

  /**
   * 执行单个类型的检测
   */
  private async performCheck(
    checkType: ConflictCheckType,
    config: any,
    timeout: number
  ): Promise<Record<string, any>> {
    switch (checkType) {
      case 'ip':
        return await this.checkIPConflict(config, timeout);
      case 'network':
        return await this.checkNetworkConfigValidity(config);
      default:
        throw new Error(`未知的冲突检测类型: ${checkType}`);
    }
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
      logger.error('检查网络段时出错', error as Error);
      return false;
    }
  }

  /**
   * 检测IP地址是否可达（ping操作）
   * 使用TCP连接尝试来检测目标主机是否存在
   * 按顺序尝试常见端口：SSH (22), HTTP (80), HTTPS (443)
   */
  private async pingIP(ipAddress: string, timeout: number): Promise<{ success: boolean; error?: string }> {
    const net = require('net');
    const portsToTry = [22, 80, 443];

    for (const port of portsToTry) {
      const result = await this.tryConnectToPort(ipAddress, port, timeout);
      if (result.success) {
        return { success: true };
      }
    }

    // 所有端口都连接失败，认为IP未被占用
    return { success: false };
  }

  /**
   * 尝试连接到指定IP和端口
   * @returns 连接成功返回 { success: true }, 失败或超时返回 { success: false }
   */
  private tryConnectToPort(
    ipAddress: string,
    port: number,
    timeout: number
  ): Promise<{ success: boolean }> {
    return new Promise<{ success: boolean }>((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      let resolved = false;

      const cleanupAndReturn = (success: boolean) => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({ success });
        }
      };

      socket.setTimeout(timeout);

      socket.connect(port, ipAddress, () => {
        // 连接成功 - 表示目标主机存在
        logger.debug(`成功连接到 ${ipAddress}:${port}`);
        cleanupAndReturn(true);
      });

      socket.on('error', () => {
        // 连接失败 - 尝试下一个端口
        cleanupAndReturn(false);
      });

      socket.on('timeout', () => {
        // 连接超时 - 尝试下一个端口
        cleanupAndReturn(false);
      });
    });
  }
}

// 导出单例实例
export const conflictDetectionService = new ConflictDetectionService();
