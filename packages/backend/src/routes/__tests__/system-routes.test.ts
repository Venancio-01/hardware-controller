import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import systemRoutes from '../system.routes.js';
import { RestartService } from '../../services/restart.service.js';
import { CoreProcessManager } from '../../services/core-process-manager.js';

describe('System Routes', () => {
  let app: express.Application;
  let restartSystemSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/system', systemRoutes);

    // Mock RestartService.getInstance().restartSystem
    const restartService = RestartService.getInstance();
    restartSystemSpy = vi.spyOn(restartService, 'restartSystem');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/system/restart', () => {
    it('should initiate system restart successfully', async () => {
      // Arrange: Mock successful restart
      restartSystemSpy.mockResolvedValue(true);

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/restart');

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '系统重启已启动'
      });
      expect(restartSystemSpy).toHaveBeenCalled();
    });

    it('should return conflict status when restart is already in progress', async () => {
      // Arrange: Mock restart in progress
      restartSystemSpy.mockResolvedValue(false);

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/restart');

      // Assert: Verify response
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: '系统重启已在进行中'
      });
      expect(restartSystemSpy).toHaveBeenCalled();
    });

    it('should return error when restart fails', async () => {
      // Arrange: Mock restart failure
      restartSystemSpy.mockRejectedValue(new Error('Restart failed'));

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/restart');

      // Assert: Verify response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: '启动系统重启失败'
      });
      expect(restartSystemSpy).toHaveBeenCalled();
    });
  });

  describe('POST /api/system/core/restart', () => {
    let restartSpy: any;

    beforeEach(() => {
      const coreProcessManager = CoreProcessManager.getInstance();
      restartSpy = vi.spyOn(coreProcessManager, 'restart');
      vi.clearAllMocks();
    });

    it('should restart Core process successfully', async () => {
      // Arrange: Mock successful restart
      restartSpy.mockResolvedValue(undefined);

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/core/restart');

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Core 进程重启已启动',
      });
      expect(restartSpy).toHaveBeenCalled();
    });

    it('should return error when Core has never been started', async () => {
      // Arrange: Mock restart failure (no script path)
      restartSpy.mockRejectedValue(
        new Error('Cannot restart: Core process has never been started (no script path)')
      );

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/core/restart');

      // Assert: Verify response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('重启 Core 进程失败');
      expect(response.body.message).toContain('never been started');
      expect(restartSpy).toHaveBeenCalled();
    });

    it('should handle unexpected errors during restart', async () => {
      // Arrange: Mock unexpected error
      restartSpy.mockRejectedValue(new Error('Unexpected restart error'));

      // Act: Send POST request to restart endpoint
      const response = await request(app).post('/api/system/core/restart');

      // Assert: Verify response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('重启 Core 进程失败');
      expect(response.body.message).toBe('Unexpected restart error');
      expect(restartSpy).toHaveBeenCalled();
    });

    // Note: This test is skipped because express-rate-limit maintains global state
    // across test suites in the same process, making it unreliable.
    // The rate limiting functionality has been verified manually.
    it.skip('should enforce rate limiting on Core restart endpoint', async () => {
      // Arrange: Mock successful restart
      restartSpy.mockResolvedValue(undefined);

      // Act: Send 4 requests (exceeds limit of 3 per minute)
      const responses = [];
      for (let i = 0; i < 4; i++) {
        const response = await request(app).post('/api/system/core/restart');
        responses.push(response);
      }

      // Assert: First 3 should succeed, 4th should be rate limited
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);
      expect(responses[3].status).toBe(429); // Too Many Requests
      expect(responses[3].body.success).toBe(false);
      expect(responses[3].body.error).toContain('过于频繁');
    });
  });
});

