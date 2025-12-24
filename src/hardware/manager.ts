import { UDPClient } from '../udp/client.js';
import { TCPClient } from '../tcp/client.js';

import { createModuleLogger } from '../logger/index.js';
import type { NetworkConfig, HardwareResponse, Protocol } from '../types/index.js';

/**
 * 客户端注册表接口
 */
interface ClientRegistry {
  tcp: Map<string, TCPClient>;
}

/**
 * 硬件通信管理器 - 统一的硬件通信接口
 */
export class HardwareCommunicationManager {
  private clients: ClientRegistry = {
    tcp: new Map(),
  };
  private udpClient: UDPClient = new UDPClient();
  private udpTargets: Map<string, { host: string; port: number }> = new Map();
  private udpRemoteToId: Map<string, string> = new Map();

  private isInitialized = false;
  private log = createModuleLogger('HardwareCommunicationManager');

  /**
   * 初始化通信管理器
   */
  async initialize(configs: {
    udpClients?: { id: string; targetHost: string; targetPort: number; timeout?: number; retries?: number }[];
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
    udpPort?: number;
    globalTimeout?: number;
    globalRetries?: number;
  }): Promise<void> {
    if (this.isInitialized) {
      this.log.info('硬件通信管理器已初始化');
      return;
    }

    const initPromises: Promise<void>[] = [];

    // 初始化 UDP 客户端 (单例)
    if (configs.udpClients && configs.udpClients.length > 0) {
      // 使用配置的 UDP 端口或默认端口 8000
      const listenPort = configs.udpPort || 8000;

      initPromises.push(this.udpClient.start(listenPort));

      this.udpClient.setMessageHandler((data, remote) => {
        // Find client ID by remote address
        const remoteKey = `${remote.address}:${remote.port}`;
        const clientId = this.udpRemoteToId.get(remoteKey);

        if (clientId) {
          this.handleIncomingData('udp', clientId, data, { address: remote.address, port: remote.port });
        } else {
          this.log.warn(`收到来自未知远程地址的 UDP 消息: ${remoteKey}`);
        }
      });

      // 注册 UDP 目标
      for (const clientConfig of configs.udpClients) {
        this.udpTargets.set(clientConfig.id, {
          host: clientConfig.targetHost,
          port: clientConfig.targetPort,
        });

        // Register reverse mapping
        const remoteKey = `${clientConfig.targetHost}:${clientConfig.targetPort}`;
        this.udpRemoteToId.set(remoteKey, clientConfig.id);
      }
    }

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
        this.clients.tcp.set(clientConfig.id, tcpClient);

        tcpClient.addMessageListener((data) => {
          const remoteAddress = tcpClient.getRemoteAddress();
          this.handleIncomingData('tcp', clientConfig.id, data, remoteAddress || { address: 'unknown', port: 0 });
        });

        initPromises.push(
          tcpClient.connect().catch((error) => {
            this.log.error(`TCP 客户端 '${clientConfig.id}' 启动连接失败，将在后台重连`, error as Error);
          })
        );
      }
    }

    await Promise.all(initPromises);
    this.isInitialized = true;
    this.log.info('硬件通信管理器初始化成功', {
      udpTargets: this.udpTargets.size,
      tcpClients: this.clients.tcp.size
    });
  }

  /**
   * 发送硬件命令
   * @param protocol 协议类型
   * @param command 命令字符串
   * @param parameters 参数
   * @param clientId 可选，指定客户端ID。如果不指定，则广播给该协议下的所有客户端
   * @param expectResponse 是否等待响应
   */
  async sendCommand(
    protocol: Protocol,
    command: string | Buffer,
    parameters?: Record<string, unknown>,
    clientId?: string,
    expectResponse = true
  ): Promise<Record<string, HardwareResponse | undefined>> {
    let commandBuffer: Buffer;
    if (Buffer.isBuffer(command)) {
      commandBuffer = command;
    } else {
      const encoding = protocol === 'udp' ? 'ascii' : 'utf-8';
      commandBuffer = Buffer.from(String(command), encoding);
    }

    const results: Record<string, HardwareResponse | undefined> = {};

    if (protocol === 'udp') {
      const targets = new Map<string, { host: string, port: number }>();

      if (clientId) {
        const target = this.udpTargets.get(clientId);
        if (!target) throw new Error(`UDP client '${clientId}' not registered`);
        targets.set(clientId, target);
      } else {
        this.udpTargets.forEach((target, id) => targets.set(id, target));
      }

      if (targets.size === 0) {
        this.log.warn('没有活跃的 UDP 目标可发送命令');
        return {};
      }

      const promises = Array.from(targets.entries()).map(async ([id, target]) => {
        this.log.debug(`正在发送 UDP 命令到 ${id} (${target.host}:${target.port})`, {
          clientId: id,
          command: Buffer.isBuffer(command) ? '<Buffer>' : command,
          rawCommand: commandBuffer.toString('utf8')
        });

        try {
          await this.udpClient.send(commandBuffer, target.host, target.port);
          results[id] = undefined;
        } catch (error) {
          this.log.error(`发送 UDP 命令到 ${id} 失败`, error as Error);
          results[id] = { success: false, error: (error as Error).message, timestamp: Date.now() };
        }
      });

      await Promise.all(promises);

    } else {
      const clientsToSend: Map<string, TCPClient> = new Map();

      if (clientId) {
        const client = this.clients.tcp.get(clientId);
        if (!client) {
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
          command: Buffer.isBuffer(command) ? '<Buffer>' : command,
          rawCommand: commandBuffer.toString('utf8')
        });

        try {
          if (expectResponse) {
            const response = await client.send(commandBuffer);
            const responseData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
            results[id] = this.parseHardwareResponse(responseData);
          } else {
            await client.sendNoWait(commandBuffer);
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
   * 获取所有客户端连接状态
   */
  getAllConnectionStatus(): Record<string, Record<string, string>> {
    const status: Record<string, Record<string, string>> = {
      udp: {},
      tcp: {}
    };

    this.udpTargets.forEach((_, id) => {
      status.udp[id] = 'registered';
    });

    this.clients.tcp.forEach((client, id) => {
      status.tcp[id] = client.getStatus();
    });

    return status;
  }

  /**
   * 关闭所有连接
   */
  async shutdown(): Promise<void> {
    this.log.info('正在关闭硬件通信管理器...');

    const disconnectPromises: Promise<void>[] = [];

    // Stop UDP Client
    disconnectPromises.push(this.udpClient.stop());

    this.clients.tcp.forEach((client) => {
      disconnectPromises.push(client.disconnect().catch(err => this.log.error('TCP 断开连接错误', err as Error)));
    });

    await Promise.all(disconnectPromises);
    this.clients.tcp.clear();
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
}
