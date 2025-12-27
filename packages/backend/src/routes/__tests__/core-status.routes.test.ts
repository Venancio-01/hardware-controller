/**
 * Core Status Routes 测试
 *
 * 测试 GET /api/system/core/status 端点
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import coreStatusRoutes from '../core-status.routes.js';
import { CoreStatusService } from '../../services/core-status.service.js';

// Mock CoreStatusService
vi.mock('../../services/core-status.service.js', () => ({
  CoreStatusService: {
    getState: vi.fn(),
    getUptime: vi.fn(),
  },
}));

describe('Core Status Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/system/core', coreStatusRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/system/core/status', () => {
    it('应返回 Running 状态和正确的格式', async () => {
      // Arrange
      const mockState = {
        status: 'Running',
        startTime: Date.now() - 60000,
        lastError: null,
        lastUpdated: Date.now(),
      };
      vi.mocked(CoreStatusService.getState).mockReturnValue(mockState);
      vi.mocked(CoreStatusService.getUptime).mockReturnValue(60000);

      // Act
      const response = await request(app).get('/api/system/core/status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'Running',
          uptime: 60000,
          lastError: null,
        },
      });
    });

    it('应返回 Starting 状态（无 uptime）', async () => {
      // Arrange
      const mockState = {
        status: 'Starting',
        startTime: null,
        lastError: null,
        lastUpdated: Date.now(),
      };
      vi.mocked(CoreStatusService.getState).mockReturnValue(mockState);
      vi.mocked(CoreStatusService.getUptime).mockReturnValue(null);

      // Act
      const response = await request(app).get('/api/system/core/status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'Starting',
          uptime: null,
          lastError: null,
        },
      });
    });

    it('应返回 Error 状态和错误信息', async () => {
      // Arrange
      const mockState = {
        status: 'Error',
        startTime: null,
        lastError: '启动超时：未在指定时间内接收到 CORE:READY',
        lastUpdated: Date.now(),
      };
      vi.mocked(CoreStatusService.getState).mockReturnValue(mockState);
      vi.mocked(CoreStatusService.getUptime).mockReturnValue(null);

      // Act
      const response = await request(app).get('/api/system/core/status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'Error',
          uptime: null,
          lastError: '启动超时：未在指定时间内接收到 CORE:READY',
        },
      });
    });

    it('应返回 Stopped 状态', async () => {
      // Arrange
      const mockState = {
        status: 'Stopped',
        startTime: null,
        lastError: null,
        lastUpdated: Date.now(),
      };
      vi.mocked(CoreStatusService.getState).mockReturnValue(mockState);
      vi.mocked(CoreStatusService.getUptime).mockReturnValue(null);

      // Act
      const response = await request(app).get('/api/system/core/status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('Stopped');
    });
  });
});
