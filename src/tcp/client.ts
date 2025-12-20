import { connect, Socket } from 'node:net';
import { createModuleLogger } from '../logger/index.js';
import type { NetworkConfig, MessagePayload, ConnectionStatus, CommunicationStats } from '../types/index.js';

interface ResponseHandler {
  resolve: (data: MessagePayload) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * TCP 客户端类
 */
export class TCPClient {
  private socket: Socket | null = null;
  private config: NetworkConfig;
  private status: ConnectionStatus = 'disconnected';
  private stats: CommunicationStats = { messagesSent: 0, messagesReceived: 0, errors: 0 };
  private messageBuffer: Buffer = Buffer.alloc(0);
  private log = createModuleLogger('TCPClient');
  private responseHandlers = new Map<string, ResponseHandler>();
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private shouldReconnect = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatResponse = 0;

  /**
   * 自定义消息事件处理器
   */
  public onMessage?: (data: Buffer) => void;

  constructor(config: NetworkConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      framing: true,
      heartbeatInterval: 30000, // 心跳间隔30秒
      heartbeatTimeout: 5000,   // 心跳超时5秒
      reconnectDelay: 5000,     // 重连延迟5秒
      heartbeatStrict: true,
      ...config,
    };
  }

  /**
   * 连接到 TCP 服务器（长连接模式）
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
        this.log.debug(`连接到 ${this.config.host}:${this.config.port}`);
        this.socket = connect(this.config.port, this.config.host);

        this.socket.on('connect', () => {
          this.status = 'connected';
          this.isConnecting = false;

          // 启用 TCP KeepAlive
          this.socket!.setKeepAlive(true, 30000);
          this.log.debug(`TCP KeepAlive 已启用 (initialDelay: 30000ms)`);

          // 清除连接超时 - 长连接模式下不需要自动超时
          this.socket!.setTimeout(0);

          // 启动心跳
          this.startHeartbeat();

          // 停止重连定时器
          if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }

          this.log.info(`成功连接到 ${this.config.host}:${this.config.port}`);
          resolve();
        });

        this.socket.on('error', (error: Error) => {
          this.status = 'error';
          this.stats.errors++;
          this.isConnecting = false;
          this.stopHeartbeat();
          this.log.error(`连接错误: ${error.message}`);

          // 如果应该重连，启动重连机制
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }

          reject(error);
        });

        this.socket.on('close', () => {
          this.status = 'disconnected';
          this.isConnecting = false;
          this.stopHeartbeat();
          this.log.warn('连接已关闭');

          // 如果应该重连，启动重连机制
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        });

        this.socket.on('data', this.handleData.bind(this));

        // 只在连接阶段设置超时，连接成功后会清除
        this.socket.setTimeout(this.config.timeout!, () => {
          this.socket?.destroy(new Error('Connection timeout'));
          this.isConnecting = false;
        });

      } catch (error) {
        this.isConnecting = false;
        this.log.error('连接失败:', error as Error);

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
      const messageData = this.messageBuffer;
      this.messageBuffer = Buffer.alloc(0);
      this.processMessage(messageData);
      return;
    }

    while (this.messageBuffer.length >= 4) {
      const messageLength = this.messageBuffer.readUInt32BE(0);

      if (this.messageBuffer.length < 4 + messageLength) {
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

    const messageStr = data.toString('utf8').trim();

    // 检查是否是心跳响应
    if (messageStr === 'HEARTBEAT_ACK' || messageStr.includes('HEARTBEAT')) {
      this.log.debug('收到心跳响应');
      this.lastHeartbeatResponse = Date.now();

      // 清除心跳超时定时器
      if (this.heartbeatTimer) {
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      return;
    }

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
    this.onMessage?.(data);
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
   * 强制关闭连接（立即关闭）
   */
  forceDisconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

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
   * 获取详细的连接状态信息
   */
  getConnectionInfo(): {
    status: ConnectionStatus;
    isConnected: boolean;
    isConnecting: boolean;
    shouldReconnect: boolean;
    hasHeartbeat: boolean;
    remoteAddress?: { address: string; port: number };
    lastActivity?: number;
  } {
    return {
      status: this.status,
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      shouldReconnect: this.shouldReconnect,
      hasHeartbeat: this.heartbeatInterval !== null,
      remoteAddress: this.getRemoteAddress() || undefined,
      lastActivity: this.stats.lastActivity,
    };
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
   * 从数据中提取消息ID
   */
  private extractMessageId(data: Buffer): string | null {
    return null;
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

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // 确保没有重复的心跳

    if (!this.config.heartbeatInterval || this.config.heartbeatInterval <= 0) {
      this.log.debug('心跳已禁用');
      return;
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.status !== 'connected' || !this.socket) {
        return;
      }

      try {
        // 发送心跳包
        const heartbeatMsg = Buffer.from('HEARTBEAT', 'utf8');
        await this.sendNoWait(heartbeatMsg);
        this.log.debug('发送心跳包');

        // 设置心跳超时检查
        this.lastHeartbeatResponse = Date.now();
        this.heartbeatTimer = setTimeout(() => {
          const elapsed = Date.now() - this.lastHeartbeatResponse;
          if (elapsed > this.config.heartbeatTimeout!) {
            if (this.config.heartbeatStrict) {
              this.log.warn('心跳超时，主动断开连接');
              this.socket?.destroy(new Error('Heartbeat timeout'));
              return;
            }

            this.log.warn('心跳超时，保持连接');
          }
        }, this.config.heartbeatTimeout);

      } catch (error) {
        this.log.error('心跳发送失败:', error as Error);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectInterval || !this.shouldReconnect) {
      return;
    }

    this.log.info(`${this.config.reconnectDelay}ms 后尝试重连...`);

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      try {
        await this.doConnect();
      } catch (error) {
        this.log.error('重连失败:', error as Error);
      }
    }, this.config.reconnectDelay);
  }

  /**
   * 停止长连接模式（不再重连）
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

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
}
