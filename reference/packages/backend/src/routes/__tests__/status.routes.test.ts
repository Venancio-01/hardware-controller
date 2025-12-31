/**
 * Status 路由集成测试
 *
 * 测试 GET /api/status 端点
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import statusRoutes from '../status.routes.js';
import { StatusService } from '../../services/status.service.js';

describe('GET /api/status', () => {
  let app: express.Application;
  let getStatusSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/status', statusRoutes);

    // Mock StatusService.prototype.getStatus
    getStatusSpy = vi.spyOn(StatusService.prototype, 'getStatus');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该返回 200 和正确的状态数据', async () => {
    // Arrange: Mock status data
    const mockStatus = {
      online: true,
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'TCP',
      uptime: 12345
    };
    getStatusSpy.mockResolvedValue(mockStatus);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/status');

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: mockStatus,
    });
  });
});
