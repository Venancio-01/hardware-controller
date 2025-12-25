/**
 * 连接测试服务
 *
 * 提供网络连接测试功能，包括 TCP/UDP 连接性测试
 */

import { TestConnectionRequest, TestConnectionResult } from 'shared';
import { logger as baseLogger } from '../utils/logger.js';

const logger = baseLogger.child({ module: 'ConnectionTestService' });

export class ConnectionTestService {
  /**
   * 测试 TCP 连接
   */
  private async testTcpConnection(ipAddress: string, port: number, timeout: number): Promise<TestConnectionResult> {
    return new Promise((resolve) => {
      const net = require('net'); // 动态导入，避免在前端打包时出错
      const startTime = Date.now();

      const socket = net.createConnection({ host: ipAddress, port }, () => {
        const latency = Date.now() - startTime;
        logger.info(`TCP connection test successful to ${ipAddress}:${port}, latency: ${latency}ms`);
        socket.destroy(); // 连接成功后立即关闭
        resolve({
          success: true,
          latency,
          target: `${ipAddress}:${port}`,
        });
      });

      socket.setTimeout(timeout);

      socket.on('error', (err: Error) => {
        const latency = Date.now() - startTime;
        const errorMessage = err.message;
        logger.warn(`TCP connection test failed to ${ipAddress}:${port}, error: ${errorMessage}, latency: ${latency}ms`);
        socket.destroy();
        resolve({
          success: false,
          error: `TCP connection failed: ${errorMessage}`,
          latency,
          target: `${ipAddress}:${port}`,
        });
      });

      socket.on('timeout', () => {
        const latency = Date.now() - startTime;
        logger.warn(`TCP connection test timeout to ${ipAddress}:${port}, latency: ${latency}ms`);
        socket.destroy();
        resolve({
          success: false,
          error: 'TCP connection timeout',
          latency,
          target: `${ipAddress}:${port}`,
        });
      });
    });
  }

  /**
   * 测试 UDP 连接
   * 注意：UDP 是无连接协议，我们只能通过尝试发送数据包来测试可达性
   */
  private async testUdpConnection(ipAddress: string, port: number, timeout: number): Promise<TestConnectionResult> {
    return new Promise((resolve) => {
      const dgram = require('dgram'); // 动态导入，避免在前端打包时出错
      const startTime = Date.now();

      const socket = dgram.createSocket('udp4');
      let resolved = false; // 防止多次 resolve

      // 发送一个空数据包进行连通性测试
      const message = Buffer.from('ping');

      socket.send(message, 0, message.length, port, ipAddress, (err: Error) => {
        if (err && !resolved) {
          const latency = Date.now() - startTime;
          logger.warn(`UDP connection test failed to ${ipAddress}:${port}, error: ${err.message}, latency: ${latency}ms`);
          resolved = true;
          socket.close();
          resolve({
            success: false,
            error: `UDP connection failed: ${err.message}`,
            latency,
            target: `${ipAddress}:${port}`,
          });
        }
      });

      // 设置超时
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const latency = Date.now() - startTime;
          logger.info(`UDP connection test completed to ${ipAddress}:${port}, latency: ${latency}ms`);
          socket.close();
          resolve({
            success: true,
            latency,
            target: `${ipAddress}:${port}`,
          });
        }
      }, timeout);

      // 监听错误事件
      socket.on('error', (err: Error) => {
        if (!resolved) {
          resolved = true;
          const latency = Date.now() - startTime;
          logger.warn(`UDP connection test error to ${ipAddress}:${port}, error: ${err.message}, latency: ${latency}ms`);
          socket.close();
          resolve({
            success: false,
            error: `UDP connection error: ${err.message}`,
            latency,
            target: `${ipAddress}:${port}`,
          });
        }
      });
    });
  }

  /**
   * 执行连接测试
   */
  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResult> {
    const { ipAddress, port, protocol = 'tcp', timeout } = request;

    logger.info(`Starting ${protocol.toUpperCase()} connection test to ${ipAddress}:${port} with ${timeout}ms timeout`);

    try {
      let result: TestConnectionResult;

      switch (protocol) {
        case 'tcp':
          result = await this.testTcpConnection(ipAddress, port, timeout);
          break;
        case 'udp':
          result = await this.testUdpConnection(ipAddress, port, timeout);
          break;
        default:
          return {
            success: false,
            error: `Unsupported protocol: ${protocol}`,
            target: `${ipAddress}:${port}`,
          };
      }

      return result;
    } catch (error) {
      logger.error(`Unexpected error during connection test to ${ipAddress}:${port}`, error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        target: `${ipAddress}:${port}`,
      };
    }
  }
}

// 导出单例实例
export const connectionTestService = new ConnectionTestService();