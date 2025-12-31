import { SerialPort } from 'serialport';
import { createModuleLogger } from 'shared';
import type { SerialConfig, MessagePayload, ConnectionStatus, CommunicationStats } from '../types/index.js';

interface ResponseHandler {
  resolve: (data: MessagePayload) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * 串口通信客户端类
 */
export class SerialClient {
  private port: SerialPort | null = null;
  private config: SerialConfig;
  private status: ConnectionStatus = 'disconnected';
  private stats: CommunicationStats = { messagesSent: 0, messagesReceived: 0, errors: 0 };
  private messageBuffer: Buffer = Buffer.alloc(0);
  private log = createModuleLogger('SerialClient');
  private responseHandlers = new Map<string, ResponseHandler>();
  private isConnecting = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private shouldReconnect = false;

  /**
   * 自定义消息事件处理器
   */
  public onMessage?: (data: Buffer) => void;

  constructor(config: SerialConfig) {
    const defaults: Partial<SerialConfig> = {
      timeout: 5000,
      retries: 3,
      reconnectDelay: 5000,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      autoOpen: false,
    };
    this.config = { ...defaults, ...config };
  }

  /**
   * 连接到串口设备
   */
  async connect(): Promise<void> {
    if (this.status === 'connected') {
      return;
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            if (this.status === 'connected') {
              resolve();
            } else {
              reject(new Error('Connection failed'));
            }
          }
        }, 100);
      });
    }

    this.shouldReconnect = true;
    return this.doConnect();
  }

  /**
   * 执行实际连接
   */
  private async doConnect(): Promise<void> {
    if (this.isConnecting) return;

    this.isConnecting = true;
    this.status = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        this.log.debug(`正在打开串口 ${this.config.path} (Baud: ${this.config.baudRate})`);

        this.port = new SerialPort({
          path: this.config.path,
          baudRate: this.config.baudRate,
          dataBits: this.config.dataBits,
          stopBits: this.config.stopBits,
          parity: this.config.parity,
          autoOpen: false,
        });

        // 监听错误 (在 open 之前绑定，以防 open 立即同步触发错误)
        this.port.on('error', (error) => {
          this.status = 'error';
          this.stats.errors++;
          this.log.error(`串口错误: ${error.message}`);

          if (this.isConnecting) {
            this.isConnecting = false;
            reject(error);
          }

          if (this.shouldReconnect && this.status !== 'connecting') {
             // 只有在非连接中状态下才调度重连 (连接中的重连由 open callback 处理)
             this.scheduleReconnect();
          }
        });

        this.port.on('close', () => {
          this.status = 'disconnected';
          this.log.warn('串口已关闭');

          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        });

        this.port.on('data', this.handleData.bind(this));

        this.port.open((error) => {
          if (error) {
            this.status = 'error';
            this.isConnecting = false;
            this.log.error(`打开串口失败: ${error.message}`);

            if (this.shouldReconnect) {
              this.scheduleReconnect();
            }

            reject(error);
          } else {
            this.status = 'connected';
            this.isConnecting = false;

            // 停止重连定时器
            if (this.reconnectInterval) {
              clearInterval(this.reconnectInterval);
              this.reconnectInterval = null;
            }

            this.log.info(`成功打开串口 ${this.config.path}`);
            resolve();
          }
        });

      } catch (error) {
        this.isConnecting = false;
        this.log.error('创建串口实例失败:', error as Error);

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }

        reject(error);
      }
    });
  }

  /**
   * 发送消息并等待响应
   */
  async send(message: string | Uint8Array): Promise<MessagePayload> {
    if (!this.port || this.status !== 'connected') {
      throw new Error('Serial port not connected. Call connect() first.');
    }

    const data = typeof message === 'string' ? Buffer.from(message, 'utf-8') : Buffer.from(message);
    const messageId = this.generateMessageId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(messageId);
        reject(new Error(`Message timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.responseHandlers.set(messageId, { resolve, reject, timeout });

      this.port!.write(data, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.responseHandlers.delete(messageId);
          reject(error);
        } else {
          this.stats.messagesSent++;
          this.port!.drain(); // 等待数据发送完成
        }
      });
    });
  }

  /**
   * 发送消息但不等待响应
   */
  async sendNoWait(message: string | Uint8Array): Promise<void> {
    if (!this.port || this.status !== 'connected') {
      throw new Error('Serial port not connected. Call connect() first.');
    }

    const data = typeof message === 'string' ? Buffer.from(message, 'utf-8') : Buffer.from(message);

    return new Promise((resolve, reject) => {
      this.port!.write(data, (error) => {
        if (error) {
          reject(error);
        } else {
          this.stats.messagesSent++;
          this.port!.drain();
          resolve();
        }
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  private handleData(data: Buffer): void {
    // 将新数据追加到缓冲区
    this.messageBuffer = Buffer.concat([this.messageBuffer, data]);

    const messageData = this.messageBuffer;
    this.messageBuffer = Buffer.alloc(0);
    this.processMessage(messageData);
  }

  private processMessage(data: Buffer): void {
    this.stats.messagesReceived++;
    this.stats.lastActivity = Date.now();

    // 触发消息事件
    this.onMessage?.(data);
  }

  private generateMessageId(): string {
     return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectInterval || !this.shouldReconnect) {
      return;
    }

    this.log.info(`${this.config.reconnectDelay}ms 后尝试重连串口...`);

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      try {
        await this.doConnect();
      } catch (error) {
        this.log.error('串口重连失败:', error as Error);
      }
    }, this.config.reconnectDelay);
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.port) {
      // 清理所有等待中的处理器
      for (const [id, handler] of this.responseHandlers) {
        clearTimeout(handler.timeout);
        handler.reject(new Error('Connection closed'));
      }
      this.responseHandlers.clear();

      return new Promise((resolve) => {
        if (!this.port!.isOpen) {
            this.port = null;
            this.status = 'disconnected';
            resolve();
            return;
        }

        this.port!.close((err) => {
          this.port = null;
          this.status = 'disconnected';
          resolve();
        });
      });
    }
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.port !== null && this.port.isOpen;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getStats(): CommunicationStats {
    return { ...this.stats };
  }
}
