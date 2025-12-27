/**
 * WebSocket Service 测试
 *
 * 测试 WebSocket 服务的初始化、认证和状态广播功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketService, WS_EVENTS } from '../websocket.service.js';
import { CoreStatusService } from '../core-status.service.js';
import { authConfig } from '../../config/auth.config.js';
import jwt from 'jsonwebtoken';

// Mock authConfig
vi.mock('../../config/auth.config.js', () => ({
  authConfig: {
    enabled: true,
    jwtSecret: 'test-secret',
    username: 'admin',
    password: 'admin123',
  },
}));

describe('WebSocket Service', () => {
  let httpServer: HttpServer;
  let clientSocket: ClientSocket | null = null;
  const PORT = 3099;

  // 创建有效 Token
  const createValidToken = () =>
    jwt.sign({ username: 'admin' }, 'test-secret', { expiresIn: '1h' });

  beforeEach(async () => {
    // 创建测试 HTTP 服务器
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, resolve);
    });
    // 初始化 WebSocket 服务
    WebSocketService.initialize(httpServer);
  });

  afterEach(async () => {
    // 关闭客户端连接
    if (clientSocket) {
      clientSocket.disconnect();
      clientSocket = null;
    }
    // 关闭服务
    await WebSocketService.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('认证', () => {
    it('应接受带有有效 Token 的连接', async () => {
      const token = createValidToken();

      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket!.on('connect', resolve);
        clientSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });

      expect(clientSocket.connected).toBe(true);
    });

    it('应拒绝无 Token 的连接', async () => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket!.on('connect_error', (error) => {
          expect(error.message).toContain('认证失败');
          resolve();
        });
        clientSocket!.on('connect', () => {
          throw new Error('Should not connect without token');
        });
      });
    });

    it('应拒绝无效 Token 的连接', async () => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket!.on('connect_error', (error) => {
          expect(error.message).toContain('认证失败');
          resolve();
        });
        clientSocket!.on('connect', () => {
          throw new Error('Should not connect with invalid token');
        });
      });
    });
  });

  describe('状态广播', () => {
    it('应在连接时接收当前状态', async () => {
      const token = createValidToken();

      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token },
        transports: ['websocket'],
      });

      const receivedStatus = await new Promise<any>((resolve, reject) => {
        clientSocket!.on(WS_EVENTS.CORE_STATUS_CHANGED, (data) => {
          resolve(data);
        });
        clientSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Timeout waiting for status')), 2000);
      });

      expect(receivedStatus).toHaveProperty('status');
      expect(receivedStatus).toHaveProperty('uptime');
      expect(receivedStatus).toHaveProperty('lastError');
    });

    it('应在状态变更时接收广播', async () => {
      const token = createValidToken();

      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token },
        transports: ['websocket'],
      });

      // 等待连接并接收初始状态
      await new Promise<void>((resolve, reject) => {
        clientSocket!.on('connect', resolve);
        clientSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });

      // 监听下一次状态变更
      const statusPromise = new Promise<any>((resolve, reject) => {
        clientSocket!.on(WS_EVENTS.CORE_STATUS_CHANGED, (data) => {
          resolve(data);
        });
        setTimeout(() => reject(new Error('Status change timeout')), 2000);
      });

      // 触发状态变更
      CoreStatusService.reset();

      const receivedStatus = await statusPromise;
      expect(receivedStatus.status).toBe('Starting');
    });
  });

  describe('连接管理', () => {
    it('应正确追踪连接数', async () => {
      const token = createValidToken();

      expect(WebSocketService.getConnectedClientsCount()).toBe(0);

      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket!.on('connect', resolve);
        clientSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });

      // 等待服务器更新连接计数
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(WebSocketService.getConnectedClientsCount()).toBe(1);
    });
  });
});
