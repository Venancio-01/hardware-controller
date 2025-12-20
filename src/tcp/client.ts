import { connect, Socket } from 'node:net';
import { createModuleLogger } from '../logger/index.js';
import type { NetworkConfig, MessagePayload, ConnectionStatus, CommunicationStats } from '../types/index.js';

/**
 * TCP 客户端类 - 支持现代异步语法和消息分帧
 */
export class TCPClient {
  private socket: Socket | null = null;
  private config: NetworkConfig;
  private status: ConnectionStatus = 'disconnected';
  private stats: CommunicationStats = { messagesSent: 0, messagesReceived: 0, errors: 0 };
  private messageBuffer: Buffer = Buffer.alloc(0);
  private log = createModuleLogger('TCPClient');
  private responseHandlers = new Map<string, {
    resolve: (data: MessagePayload) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private isConnecting = false;

  constructor(config: NetworkConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      framing: true, // Default to true for backward compatibility
      ...config,
    };
  }

  /**
   * 连接到 TCP 服务器
   */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.status = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        this.socket = connect(this.config.port, this.config.host);

        this.socket.on('connect', () => {
          this.status = 'connected';
          this.isConnecting = false;
          resolve();
        });

        this.socket.on('error', (error: Error) => {
          this.status = 'error';
          this.stats.errors++;
          this.isConnecting = false;
          this.handleRejection(reject, error);
        });

        this.socket.on('close', () => {
          this.status = 'disconnected';
          this.isConnecting = false;
        });

        this.socket.on('data', this.handleData.bind(this));

        this.socket.setTimeout(this.config.timeout!, () => {
          this.socket?.destroy(new Error('Connection timeout'));
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        });

      } catch (error) {
        this.isConnecting = false;
        this.handleRejection(reject, error as Error);
      }
    });
  }

  /**
   * 发送消息并等待响应
   */
  async send(message: string | Uint8Array): Promise<MessagePayload> {
    if (!this.socket || this.status !== 'connected') {
      throw new Error('TCP socket not connected. Call connect() first.');
    }

    const data = typeof message === 'string' ? Buffer.from(message, 'utf-8') : Buffer.from(message);
    const framedMessage = this.config.framing ? this.frameMessage(data) : data;
    const messageId = this.generateMessageId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(messageId);
        reject(new Error(`Message timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.responseHandlers.set(messageId, { resolve, reject, timeout });

      this.socket!.write(framedMessage, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.responseHandlers.delete(messageId);
          reject(error);
        } else {
          this.stats.messagesSent++;
        }
      });
    });
  }

  /**
   * 发送消息但不等待响应
   */
  async sendNoWait(message: string | Uint8Array): Promise<void> {
    if (!this.socket || this.status !== 'connected') {
      throw new Error('TCP socket not connected. Call connect() first.');
    }

    const data = typeof message === 'string' ? Buffer.from(message, 'utf-8') : Buffer.from(message);
    const framedMessage = this.config.framing ? this.frameMessage(data) : data;

    return new Promise((resolve, reject) => {
      this.socket!.write(framedMessage, (error) => {
        if (error) {
          reject(error);
        } else {
          this.stats.messagesSent++;
          resolve();
        }
      });
    });
  }

  /**
   * 处理接收到的数据（支持分帧）
   */
  private handleData(data: Buffer): void {
    // 将新数据追加到缓冲区
    this.messageBuffer = Buffer.concat([this.messageBuffer, data]);

    // 尝试从缓冲区中提取完整的消息
    if (!this.config.framing) {
      // If framing is disabled, process all data immediately
      const messageData = this.messageBuffer;
      this.messageBuffer = Buffer.alloc(0);
      this.processMessage(messageData);
      return;
    }

    while (this.messageBuffer.length >= 4) {
      const messageLength = this.messageBuffer.readUInt32BE(0);

      if (this.messageBuffer.length < 4 + messageLength) {
        // 数据不完整，等待更多数据
        break;
      }

      // 提取完整消息
      const messageData = this.messageBuffer.slice(4, 4 + messageLength);
      this.messageBuffer = this.messageBuffer.slice(4 + messageLength);

      this.processMessage(messageData);
    }
  }

  /**
   * 处理单个消息
   */
  private processMessage(data: Buffer): void {
    this.stats.messagesReceived++;
    this.stats.lastActivity = Date.now();

    const messageId = this.extractMessageId(data);

    if (messageId && this.responseHandlers.has(messageId)) {
      const handler = this.responseHandlers.get(messageId)!;
      clearTimeout(handler.timeout);
      this.responseHandlers.delete(messageId);

      handler.resolve({
        data,
        timestamp: Date.now(),
      });
    }

    // 触发消息事件
    this.emitMessage?.(data);
  }

  /**
   * 消息分帧（添加长度前缀）
   */
  private frameMessage(data: Buffer): Buffer {
    const lengthPrefix = Buffer.allocUnsafe(4);
    lengthPrefix.writeUInt32BE(data.length, 0);
    return Buffer.concat([lengthPrefix, Buffer.from(data)]);
  }

  /**
   * 自定义消息事件处理器
   */
  public onMessage?: (data: Buffer) => void;
  private emitMessage?: (data: Buffer) => void;

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      // 清理所有等待中的处理器
      for (const [id, handler] of this.responseHandlers) {
        clearTimeout(handler.timeout);
        handler.reject(new Error('Connection closed'));
      }
      this.responseHandlers.clear();

      return new Promise((resolve) => {
        if (this.socket!.destroyed) {
          this.socket = null;
          this.status = 'disconnected';
          resolve();
          return;
        }

        this.socket!.end(() => {
          this.socket = null;
          this.status = 'disconnected';
          resolve();
        });
      });
    }
  }

  /**
   * 强制关闭连接（立即关闭）
   */
  forceDisconnect(): void {
    if (this.socket && !this.socket.destroyed) {
      // 清理所有等待中的处理器
      for (const [id, handler] of this.responseHandlers) {
        clearTimeout(handler.timeout);
        handler.reject(new Error('Connection forcibly closed'));
      }
      this.responseHandlers.clear();

      this.socket.destroy();
      this.socket = null;
      this.status = 'disconnected';
    }
  }

  /**
   * 检查连接是否活跃
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.socket !== null && !this.socket.destroyed;
  }

  /**
   * 获取连接状态
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 获取统计信息
   */
  getStats(): CommunicationStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = { messagesSent: 0, messagesReceived: 0, errors: 0 };
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从数据中提取消息ID（简化版本）
   */
  private extractMessageId(data: Buffer): string | null {
    // 这里可以根据实际协议来实现ID提取逻辑
    return null;
  }

  /**
   * 错误处理辅助方法
   */
  private handleRejection(reject: (reason?: unknown) => void, error: Error): void {
    if (this.responseHandlers.size > 0) {
      for (const [id, handler] of this.responseHandlers) {
        clearTimeout(handler.timeout);
        handler.reject(error);
      }
      this.responseHandlers.clear();
    }
    reject(error);
  }

  /**
   * 添加消息监听器
   */
  public addMessageListener(callback: (data: Buffer) => void): void {
    this.onMessage = callback;
  }

  /**
   * 移除消息监听器
   */
  public removeMessageListener(): void {
    this.onMessage = undefined;
  }

  /**
   * 设置 socket 选项
   */
  public setKeepAlive(enable: boolean, initialDelay?: number): void {
    if (this.socket) {
      this.socket.setKeepAlive(enable, initialDelay);
    }
  }

  /**
   * 设置 no delay
   */
  public setNoDelay(noDelay?: boolean): void {
    if (this.socket) {
      this.socket.setNoDelay(noDelay);
    }
  }

  /**
   * 获取远程地址信息
   */
  public getRemoteAddress(): { address: string; port: number } | null {
    if (this.socket) {
      return {
        address: this.socket.remoteAddress || '',
        port: this.socket.remotePort || 0,
      };
    }
    return null;
  }
}
