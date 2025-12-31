
import { TCPClient } from '../tcp/client.js';
import { SerialClient } from '../serial/client.js';

import { createModuleLogger } from 'shared';
import type { NetworkConfig, HardwareResponse, Protocol, SerialConfig, CommandEncoding } from '../types/index.js';

/**
 * 客户端注册表接口
 */
interface ClientRegistry {
  tcp: Map<string, TCPClient>;
  serial: Map<string, SerialClient>;
}

/**
 * 命令队列项
 */
interface QueuedCommand {
  protocol: Protocol;
  command: Buffer;
  clientId?: string;
  expectResponse: boolean;
  resolve: (result: Record<string, HardwareResponse | undefined>) => void;
  reject: (error: Error) => void;
}

/**
 * 硬件通信管理器 - 统一的硬件通信接口
 */
export class HardwareCommunicationManager {
  private clients: ClientRegistry = {
    tcp: new Map(),
    serial: new Map(),
  };

  // 命令队列相关属性
  private commandQueue: QueuedCommand[] = [];
  private isProcessingQueue = false;
  private queueInterval = 50; // 默认 50ms 间隔

  private isInitialized = false;
  private log = createModuleLogger('HardwareCommunicationManager');

  /**
   * 初始化通信管理器
   */
  async initialize(configs: {
    tcpClients?: {
      id: string;
      localPort?: number;
      targetHost: string;
      targetPort: number;
      timeout?: number;
      retries?: number;
      framing?: boolean;
      heartbeatInterval?: number;
      heartbeatTimeout?: number;
      reconnectDelay?: number;
      heartbeatStrict?: boolean;
    }[];
    serialClients?: (SerialConfig & { id: string })[];
    globalTimeout?: number;
    globalRetries?: number;
  }): Promise<void> {
    if (this.isInitialized) {
      this.log.info('硬件通信管理器已初始化');
      return;
    }

    const initPromises: Promise<void>[] = [];

    // 初始化 TCP 客户端
    if (configs.tcpClients) {
      for (const clientConfig of configs.tcpClients) {
        const netConfig: NetworkConfig = {
          host: clientConfig.targetHost,
          port: clientConfig.targetPort,
          timeout: clientConfig.timeout || configs.globalTimeout,
          retries: clientConfig.retries || configs.globalRetries,
          framing: clientConfig.framing,
          heartbeatInterval: clientConfig.heartbeatInterval,
          heartbeatTimeout: clientConfig.heartbeatTimeout,
          reconnectDelay: clientConfig.reconnectDelay,
          heartbeatStrict: clientConfig.heartbeatStrict,
        };
        const tcpClient = new TCPClient(netConfig);
        this.log.info(`DEBUG: Adding TCP client ${clientConfig.id} to map`, { clientId: clientConfig.id });
        this.clients.tcp.set(clientConfig.id, tcpClient);

        tcpClient.addMessageListener((data) => {
          const remoteAddress = tcpClient.getRemoteAddress();
          this.handleIncomingData('tcp', clientConfig.id, data, remoteAddress || { address: 'unknown', port: 0 });
        });

        // 设置连接状态变化回调
        tcpClient.onConnectionChange = (status) => {
          this.log.info(`TCP 客户端 '${clientConfig.id}' 连接状态变化: ${status}`);
          this.onConnectionChange?.('tcp', clientConfig.id, status);
        };

        initPromises.push(
          tcpClient.connect().catch((error) => {
            this.log.error(`TCP 客户端 '${clientConfig.id}' 启动连接失败，将在后台重连`, error as Error);
          })
        );
      }
    }

    // 初始化串口客户端
    if (configs.serialClients) {
      for (const clientConfig of configs.serialClients) {
        const serialClient = new SerialClient(clientConfig);
        this.clients.serial.set(clientConfig.id, serialClient);

        serialClient.onMessage = (data) => {
          // 串口通常没有 IP port 概念，这里用 path 代替 address
          this.handleIncomingData('serial', clientConfig.id, data, { address: clientConfig.path, port: 0 });
        };

        // 串口连接通常是本地资源打开，也放入 initPromises
        initPromises.push(
          serialClient.connect().catch((error) => {
            this.log.error(`串口客户端 '${clientConfig.id}' 打开失败`, error as Error);
          })
        );
      }
    }

    await Promise.all(initPromises);
    this.isInitialized = true;
    this.log.debug('硬件通信管理器初始化成功', {
      tcpClients: this.clients.tcp.size,
      serialClients: this.clients.serial.size
    });
  }

  /**
   * 发送硬件命令
   * @param protocol 协议类型
   * @param command 命令字符串
   * @param clientId 可选，指定客户端ID。如果不指定，则广播给该协议下的所有客户端
   * @param expectResponse 是否等待响应
   */
  async sendCommand(
    protocol: Protocol,
    command: Buffer,
    clientId?: string,
    expectResponse = true
  ): Promise<Record<string, HardwareResponse | undefined>> {
    const results: Record<string, HardwareResponse | undefined> = {};

    if (protocol === 'serial') {
      const clientsToSend: Map<string, SerialClient> = new Map();

      if (clientId) {
        const client = this.clients.serial.get(clientId);
        if (!client) throw new Error(`Serial client '${clientId}' not initialized`);
        clientsToSend.set(clientId, client);
      } else {
        this.clients.serial.forEach((client, id) => clientsToSend.set(id, client));
      }

      if (clientsToSend.size === 0) {
        this.log.warn('没有活跃的串口客户端可发送命令');
        return {};
      }

      const promises = Array.from(clientsToSend.entries()).map(async ([id, client]) => {
        this.log.debug(`正在发送串口命令到 ${id}`, {
          clientId: id,
          command
        });

        try {
          if (expectResponse) {
            const response = await client.send(command);
            const responseData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
            results[id] = this.parseHardwareResponse(responseData);
          } else {
            await client.sendNoWait(command);
            results[id] = undefined;
          }
        } catch (error) {
          this.log.error(`发送串口命令到 ${id} 失败`, error as Error);
          results[id] = {
            success: false,
            error: (error as Error).message,
            timestamp: Date.now()
          };
        }
      });

      await Promise.all(promises);

    } else {
      const clientsToSend: Map<string, TCPClient> = new Map();

      if (clientId) {
        const client = this.clients.tcp.get(clientId);
        if (!client) {
          this.log.error(`DEBUG: TCP client '${clientId}' not found. Available clients: ${Array.from(this.clients.tcp.keys()).join(', ')}`);
          throw new Error(`TCP client '${clientId}' not initialized`);
        }
        clientsToSend.set(clientId, client);
      } else {
        this.clients.tcp.forEach((client, id) => {
          clientsToSend.set(id, client);
        });
      }

      if (clientsToSend.size === 0) {
        this.log.warn(`没有活跃的 TCP 客户端可发送命令`);
        return {};
      }

      const promises = Array.from(clientsToSend.entries()).map(async ([id, client]) => {
        this.log.debug(`正在发送 TCP 命令到 ${id}`, {
          clientId: id,
          command,
          rawCommand: command.toString('utf8')
        });

        try {
          if (expectResponse) {
            const response = await client.send(command);
            const responseData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
            results[id] = this.parseHardwareResponse(responseData);
          } else {
            await client.sendNoWait(command);
            results[id] = undefined;
          }
        } catch (error) {
          this.log.error(`发送命令到 ${id} 失败`, error as Error);
          results[id] = {
            success: false,
            error: (error as Error).message,
            timestamp: Date.now(),
          };
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * 将命令加入队列，按间隔依次发送
   * @param protocol 协议类型
   * @param command 命令字符串
   * @param clientId 可选，指定客户端ID
   * @param expectResponse 是否等待响应
   * @returns 命令执行结果的 Promise
   */
  queueCommand(
    protocol: Protocol,
    command: Buffer,
    clientId?: string,
    expectResponse = false
  ): Promise<Record<string, HardwareResponse | undefined>> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({
        protocol,
        command,
        clientId,
        expectResponse,
        resolve,
        reject,
      });

      // 如果队列没有在处理中，启动处理
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * 设置队列命令发送间隔
   * @param interval 间隔时间（毫秒）
   */
  setQueueInterval(interval: number): void {
    this.queueInterval = interval;
  }

  /**
   * 获取当前队列长度
   */
  getQueueLength(): number {
    return this.commandQueue.length;
  }

  /**
   * 处理命令队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      this.log.debug('DEBUG: processQueue called but already processing');
      return;
    }
    this.isProcessingQueue = true;
    this.log.debug(`DEBUG: processQueue started. Queue length: ${this.commandQueue.length}`);

    while (this.commandQueue.length > 0) {
      const item = this.commandQueue.shift();
      if (!item) break;

      this.log.debug(`DEBUG: Processing item for ${item.clientId}, protocol ${item.protocol}`);

      try {
        const result = await this.sendCommand(
          item.protocol,
          item.command,
          item.clientId,
          item.expectResponse
        );
        item.resolve(result);
      } catch (error) {
        this.log.error('DEBUG: Error processing queue item', error as Error);
        item.reject(error as Error);
      }

      // 如果队列还有命令，等待间隔后继续
      if (this.commandQueue.length > 0) {
        this.log.debug(`DEBUG: Waiting ${this.queueInterval}ms before next item`);
        await this.delay(this.queueInterval);
      }
    }

    this.isProcessingQueue = false;
    this.log.debug('DEBUG: processQueue finished');
  }

  /**
   * 延迟辅助函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取所有客户端连接状态
   */
  getAllConnectionStatus(): Record<string, Record<string, string>> {
    const status: Record<string, Record<string, string>> = {
      tcp: {},
      serial: {},
    };

    this.clients.tcp.forEach((client, id) => {
      status.tcp[id] = client.getStatus();
    });

    this.clients.serial.forEach((client, id) => {
      status.serial[id] = client.getStatus();
    });

    return status;
  }

  /**
   * 关闭所有连接
   */
  async shutdown(): Promise<void> {
    this.log.info('正在关闭硬件通信管理器...');

    const disconnectPromises: Promise<void>[] = [];

    this.clients.tcp.forEach((client) => {
      disconnectPromises.push(client.disconnect().catch(err => this.log.error('TCP 断开连接错误', err as Error)));
    });

    this.clients.serial.forEach((client) => {
      disconnectPromises.push(client.disconnect().catch(err => this.log.error('Serial 断开连接错误', err as Error)));
    });

    await Promise.all(disconnectPromises);
    this.clients.tcp.clear();
    this.clients.serial.clear();
    this.isInitialized = false;
    this.log.info('硬件通信管理器关闭完成');
  }

  /**
   * 处理接收到的数据
   */
  private handleIncomingData(protocol: Protocol, clientId: string, data: Buffer, remote: { address: string; port: number }): void {
    try {
      const response = this.parseHardwareResponse(data);
      this.log.debug(`收到来自 ${clientId} (${remote.address}:${remote.port}) 的 ${protocol.toUpperCase()} 响应`, {
        protocol: protocol.toUpperCase(),
        clientId,
        remote: `${remote.address}:${remote.port}`,
        response
      });

      this.onIncomingData?.(protocol, clientId, data, remote, response);
    } catch (error) {
      this.log.error(`解析 ${protocol.toUpperCase()} 响应出错`, {
        error: error as Error,
        protocol: protocol.toUpperCase(),
        clientId,
        remote: `${remote.address}:${remote.port}`,
        dataLength: data.length
      });
    }
  }

  /**
   * 解析硬件响应
   */
  private parseHardwareResponse(data: Buffer): HardwareResponse {
    try {
      const parsed = JSON.parse(data.toString('utf8'));
      return {
        success: true,
        data: parsed,
        timestamp: Date.now(),
      };
    } catch (error) {
      // If JSON parsing fails, treat it as a raw string response
      const rawStr = data.toString('utf8');
      return {
        success: true,
        data: rawStr,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 自定义数据处理回调
   */
  public onIncomingData?: (
    protocol: Protocol,
    clientId: string,
    data: Buffer,
    remote: { address: string; port: number },
    parsedResponse: HardwareResponse
  ) => void;

  /**
   * 连接状态变化回调
   */
  public onConnectionChange?: (
    protocol: Protocol,
    clientId: string,
    status: 'connected' | 'disconnected' | 'error' | 'connecting'
  ) => void;
}
