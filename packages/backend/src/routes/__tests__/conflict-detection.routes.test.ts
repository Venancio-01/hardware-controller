/**
 * 冲突检测路由集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { conflictDetectionService } from '../../services/conflict-detection.service';
import conflictDetectionRoutes from '../conflict-detection.routes';
import { conflictDetectionRequestSchema } from 'shared';

// Mock the conflict detection service
vi.mock('../../services/conflict-detection.service');

describe('Conflict Detection Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config/check-conflict', conflictDetectionRoutes);

    // Add a simple error handling middleware for testing
    app.use((err: any, req: Request, res: Response, next: any) => {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
      });
    });
  });

  describe('POST /api/config/check-conflict', () => {
    it('should return 200 and conflict detection result when valid request is provided', async () => {
      const mockRequest = {
        config: {
          network: {
            ipAddress: '192.168.1.100',
            subnetMask: '255.255.255.0',
            gateway: '192.168.1.1',
            port: 8080,
          },
        },
        checkTypes: ['all'] as const,
        timeout: 5000,
      };

      const mockResult = {
        success: true,
        passedChecks: ['ip', 'port', 'network'],
        totalLatency: 100,
        details: [],
      };

      // Mock the service method
      vi.spyOn(conflictDetectionService, 'checkConflict').mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/config/check-conflict')
        .send(mockRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(vi.mocked(conflictDetectionService.checkConflict)).toHaveBeenCalledWith(mockRequest);
    });

    it('should return 400 when request data is invalid', async () => {
      const invalidRequest = {
        config: 'invalid config', // Should be an object
        checkTypes: 'invalid check type', // Should be an array
      };

      const response = await request(app)
        .post('/api/config/check-conflict')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('请求数据验证失败');
      expect(response.body.validationErrors).toBeDefined();
    });

    it('should handle service errors and return 500', async () => {
      const mockRequest = {
        config: {
          network: {
            ipAddress: '192.168.1.100',
            subnetMask: '255.255.255.0',
            gateway: '192.168.1.1',
            port: 8080,
          },
        },
        checkTypes: ['all'] as const,
        timeout: 5000,
      };

      // Mock the service to throw an error
      vi.spyOn(conflictDetectionService, 'checkConflict').mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/config/check-conflict')
        .send(mockRequest)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service error');
    });

    it('should validate request against schema', async () => {
      const invalidRequest = {
        config: undefined, // Required field
        checkTypes: ['invalid-type'], // Invalid enum value
      };

      // Test the schema directly to verify it should fail
      const validationResult = conflictDetectionRequestSchema.safeParse(invalidRequest);
      expect(validationResult.success).toBe(false);

      const response = await request(app)
        .post('/api/config/check-conflict')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('请求数据验证失败');
      expect(response.body.validationErrors).toBeDefined();
    });
  });
});