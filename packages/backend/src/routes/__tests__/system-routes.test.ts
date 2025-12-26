import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import systemRoutes from '../system.routes.js';
import { RestartService } from '../../services/restart.service.js';
import { connectionTestService } from '../../services/connection-test.service.js';

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
        message: 'Restart initiated successfully'
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
        message: 'Restart already in progress'
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
        message: 'Failed to initiate restart'
      });
      expect(restartSystemSpy).toHaveBeenCalled();
    });
  });

  describe('POST /api/system/test-connection', () => {
    let testConnectionSpy: any;

    beforeEach(() => {
      testConnectionSpy = vi.spyOn(connectionTestService, 'testConnection');
      vi.clearAllMocks();
    });

    it('should test connection with valid request', async () => {
      // Arrange: Mock successful connection test
      const mockTestResult = {
        success: true,
        latency: 10,
        target: '127.0.0.1:8080',
      };
      testConnectionSpy.mockResolvedValue(mockTestResult);

      const validRequest = {
        ipAddress: '127.0.0.1',
        port: 8080,
        protocol: 'tcp',
        timeout: 5000,
      };

      // Act: Send POST request to test connection endpoint
      const response = await request(app)
        .post('/api/system/test-connection')
        .send(validRequest);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockTestResult,
      });
      expect(testConnectionSpy).toHaveBeenCalledWith(validRequest);
    });

    it('should return validation error for invalid request', async () => {
      // Arrange: Invalid request (port out of range)
      const invalidRequest = {
        ipAddress: '127.0.0.1',
        port: 70000, // Invalid port > 65535
        protocol: 'tcp',
        timeout: 5000,
      };

      // Act: Send POST request to test connection endpoint
      const response = await request(app)
        .post('/api/system/test-connection')
        .send(invalidRequest);

      // Assert: Verify response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request body');
      expect(response.body.details).toBeDefined();
    });

    it('should handle connection test failure', async () => {
      // Arrange: Mock connection test failure
      const mockTestResult = {
        success: false,
        error: 'Connection failed',
        latency: 10,
        target: '127.0.0.1:8080',
      };
      testConnectionSpy.mockResolvedValue(mockTestResult);

      const validRequest = {
        ipAddress: '127.0.0.1',
        port: 8080,
        protocol: 'tcp',
        timeout: 5000,
      };

      // Act: Send POST request to test connection endpoint
      const response = await request(app)
        .post('/api/system/test-connection')
        .send(validRequest);

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockTestResult,
      });
      expect(testConnectionSpy).toHaveBeenCalledWith(validRequest);
    });

    it('should handle unexpected errors during connection test', async () => {
      // Arrange: Mock unexpected error in connection test
      testConnectionSpy.mockRejectedValue(new Error('Unexpected error'));

      const validRequest = {
        ipAddress: '127.0.0.1',
        port: 8080,
        protocol: 'tcp',
        timeout: 5000,
      };

      // Act: Send POST request to test connection endpoint
      const response = await request(app)
        .post('/api/system/test-connection')
        .send(validRequest);

      // Assert: Verify response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: '连接测试失败',
      });
      expect(testConnectionSpy).toHaveBeenCalledWith(validRequest);
    });

    it('should enforce rate limiting on connection test endpoint', async () => {
      // Arrange: Mock successful connection test
      const mockTestResult = {
        success: true,
        latency: 10,
        target: '127.0.0.1:8080',
      };
      testConnectionSpy.mockResolvedValue(mockTestResult);

      const validRequest = {
        ipAddress: '127.0.0.1',
        port: 8080,
        protocol: 'tcp',
        timeout: 5000,
      };

      // Act: Send 11 requests (exceeds limit of 10 per minute)
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const response = await request(app)
          .post('/api/system/test-connection')
          .send(validRequest);
        responses.push(response);
      }

      // Assert: First 10 should succeed, 11th should be rate limited
      expect(responses[0].status).toBe(200);
      expect(responses[10].status).toBe(429); // Too Many Requests
      expect(responses[10].body.success).toBe(false);
      expect(responses[10].body.error).toContain('过于频繁');
    });
  });
});

