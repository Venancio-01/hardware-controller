import { createSocket, Socket, RemoteInfo } from 'node:dgram';
import { createModuleLogger } from 'shared';
import type { NetworkConfig } from '../types/index.js';

export class UDPClient {
  private socket: Socket | null = null;
  private log = createModuleLogger('UDPClient');
  private isListening = false;
  private onMessage?: (data: Buffer, remote: RemoteInfo) => void;
  private config: Partial<NetworkConfig>;

  constructor(config: Partial<NetworkConfig> = {}) {
      this.config = {
          retries: 3,
          timeout: 5000,
          ...config
      };
  }

  async start(port: number): Promise<void> {
    if (this.isListening) {
      this.log.warn('UDP 客户端已在监听');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = createSocket('udp4');

        this.socket.on('error', (error) => {
          this.log.error('UDP 客户端错误', error);
          if (!this.isListening) {
            reject(error);
          }
        });

        this.socket.on('message', (msg, rinfo) => {
          this.log.debug(`收到来自 ${rinfo.address}:${rinfo.port} 的 UDP 消息`, { length: msg.length });
          this.onMessage?.(msg, rinfo);
        });

        this.socket.on('listening', () => {
          const address = this.socket?.address();
          this.log.info(`UDP 客户端正在监听 ${address?.address}:${address?.port}`);
          this.isListening = true;
          resolve();
        });

        this.socket.bind(port);
      } catch (error) {
        this.log.error('启动 UDP 客户端失败', error as Error);
        reject(error);
      }
    });
  }

  async send(message: Buffer, host: string, port: number): Promise<void> {
    if (!this.socket || !this.isListening) {
      throw new Error('UDP client not started');
    }

    const maxRetries = this.config.retries || 0;
    let attempt = 0;

    const trySend = (): Promise<void> => {
        attempt++;
        return new Promise((resolve, reject) => {
            this.socket!.send(message, port, host, (error) => {
                if (error) {
                    if (attempt <= maxRetries) {
                        this.log.warn(`发送 UDP 消息到 ${host}:${port} 失败，准备重试 (${attempt}/${maxRetries}): ${error.message}`);
                        setTimeout(() => {
                            trySend().then(resolve).catch(reject);
                        }, 100 * attempt);
                    } else {
                        this.log.error(`发送 UDP 消息到 ${host}:${port} 最终失败`, error);
                        reject(error);
                    }
                } else {
                    this.log.debug(`已发送 UDP 消息到 ${host}:${port}`, { length: message.length });
                    resolve();
                }
            });
        });
    };

    return trySend();
  }

  setMessageHandler(handler: (data: Buffer, remote: RemoteInfo) => void): void {
    this.onMessage = handler;
  }

  async stop(): Promise<void> {
    if (this.socket) {
      return new Promise((resolve) => {
        this.socket!.close(() => {
          this.log.info('UDP 客户端已停止');
          this.socket = null;
          this.isListening = false;
          resolve();
        });
      });
    }
  }
}
