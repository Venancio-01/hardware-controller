/**
 * WebSocket Service - 实时状态推送服务
 * @module services/websocket.service
 *
 * 使用 Socket.IO 提供 WebSocket 连接，支持：
 * - JWT 认证
 * - Core 状态变更实时推送
 */
import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createModuleLogger } from 'shared';
import type { CoreStatusResponse } from 'shared';
import { authConfig } from '../config/auth.config.js';
import { CoreStatusService } from './core-status.service.js';

const logger = createModuleLogger('WebSocketService');

/**
 * WebSocket 事件名称常量
 */
export const WS_EVENTS = {
  CORE_STATUS_CHANGED: 'core:status_changed',
} as const;

/**
 * WebSocket 服务类
 * 管理 Socket.IO 服务器，提供实时状态推送功能
 */
class WebSocketServiceClass {
  private io: SocketServer | null = null;
  private connectedClients: number = 0;
  /** 绑定的状态变更处理器，用于正确移除监听器 */
  private boundBroadcastStatusChange: (payload: CoreStatusResponse) => void;

  constructor() {
    // 绑定方法并保存引用，确保 addEventListener 和 removeEventListener 使用同一函数引用
    this.boundBroadcastStatusChange = this.broadcastStatusChange.bind(this);
  }

  /**
   * 初始化 WebSocket 服务器
   * @param httpServer HTTP 服务器实例
   */
  initialize(httpServer: HttpServer): void {
    if (this.io) {
      logger.warn('WebSocket 服务器已初始化，跳过重复初始化');
      return;
    }

    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : false,
        methods: ['GET', 'POST'],
      },
    });

    // 设置认证中间件
    this.io.use(this.authMiddleware.bind(this));

    // 设置连接处理
    this.io.on('connection', this.handleConnection.bind(this));

    // 订阅 CoreStatusService 状态变更事件
    CoreStatusService.on('statusChange', this.boundBroadcastStatusChange);

    logger.info('WebSocket 服务器已初始化');
  }

  /**
   * 认证中间件 - 验证 JWT Token
   */
  private authMiddleware(socket: Socket, next: (err?: Error) => void): void {
    // 如果认证未启用，直接通过
    if (!authConfig.enabled) {
      return next();
    }

    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('WebSocket 连接拒绝: 缺少认证 Token');
      return next(new Error('认证失败: 缺少 Token'));
    }

    try {
      jwt.verify(token, authConfig.jwtSecret);
      next();
    } catch (error) {
      logger.warn('WebSocket 连接拒绝: 无效的 Token');
      return next(new Error('认证失败: 无效的 Token'));
    }
  }

  /**
   * 处理新连接
   */
  private handleConnection(socket: Socket): void {
    this.connectedClients++;
    logger.info(`WebSocket 客户端连接: ${socket.id} (当前连接数: ${this.connectedClients})`);

    // 连接时发送当前状态
    socket.emit(WS_EVENTS.CORE_STATUS_CHANGED, CoreStatusService.getStatusResponse());

    // 处理断开连接
    socket.on('disconnect', (reason) => {
      this.connectedClients--;
      logger.info(`WebSocket 客户端断开: ${socket.id} (原因: ${reason}, 剩余连接数: ${this.connectedClients})`);
    });

    // 处理错误
    socket.on('error', (error) => {
      logger.error('WebSocket 错误', { socketId: socket.id, error: String(error) });
    });
  }

  /**
   * 广播状态变更到所有连接的客户端
   * @param payload Core 状态响应数据
   */
  broadcastStatusChange(payload: CoreStatusResponse): void {
    if (!this.io) {
      logger.warn('WebSocket 服务器未初始化，无法广播状态变更');
      return;
    }

    this.io.emit(WS_EVENTS.CORE_STATUS_CHANGED, payload);
    logger.debug('已广播 Core 状态变更', { status: payload.status, clientCount: this.connectedClients });
  }

  /**
   * 获取当前连接的客户端数量
   */
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }

  /**
   * 获取 Socket.IO 服务器实例
   */
  getIO(): SocketServer | null {
    return this.io;
  }

  /**
   * 关闭 WebSocket 服务器
   */
  async close(): Promise<void> {
    if (this.io) {
      // 移除 CoreStatusService 的监听器
      CoreStatusService.removeListener('statusChange', this.boundBroadcastStatusChange);

      await new Promise<void>((resolve) => {
        this.io?.close(() => {
          logger.info('WebSocket 服务器已关闭');
          resolve();
        });
      });
      this.io = null;
      this.connectedClients = 0;
    }
  }
}

// 单例导出
export const WebSocketService = new WebSocketServiceClass();
