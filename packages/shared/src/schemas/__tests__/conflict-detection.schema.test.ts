import { describe, expect, it } from 'vitest';
import {
  conflictDetectionRequestSchema,
  conflictDetectionResultSchema,
} from '../conflict-detection.schema.js';
import type { ConflictCheckType } from '../../types/conflict-detection.types.js';

describe('conflict-detection.schema 验证测试', () => {
  const validConfig = {
    deviceId: 'test-device',
    timeout: 5000,
    retryCount: 3,
    pollingInterval: 5000,
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    port: 8080,
    dns: ['8.8.8.8'],
  };

  describe('conflictDetectionRequestSchema', () => {
    it('应该接受有效的冲突检测请求', () => {
      const validRequest = {
        config: validConfig,
        checkTypes: ['ip', 'port'] as ConflictCheckType[],
        timeout: 5000,
      };

      const result = conflictDetectionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('应该接受只有 config 的最小请求', () => {
      const minimalRequest = {
        config: validConfig,
      };

      const result = conflictDetectionRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
    });

    it('应该接受所有检测类型的请求', () => {
      const allTypesRequest = {
        config: validConfig,
        checkTypes: ['ip', 'port', 'network', 'all'] as ConflictCheckType[],
      };

      const result = conflictDetectionRequestSchema.safeParse(allTypesRequest);
      expect(result.success).toBe(true);
    });

    it('应该拒绝无效的检测类型', () => {
      const invalidRequest = {
        config: validConfig,
        checkTypes: ['invalid-type' as any],
      };

      const result = conflictDetectionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该拒绝超出范围的超时时间（太小）', () => {
      const invalidRequest = {
        config: validConfig,
        timeout: 0,
      };

      const result = conflictDetectionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该拒绝超出范围的超时时间（太大）', () => {
      const invalidRequest = {
        config: validConfig,
        timeout: 30001,
      };

      const result = conflictDetectionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该接受边界值的超时时间', () => {
      const boundaryRequest = {
        config: validConfig,
        timeout: 30000,
      };

      const result = conflictDetectionRequestSchema.safeParse(boundaryRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('conflictDetectionResultSchema', () => {
    it('应该接受成功的检测结果（无冲突）', () => {
      const successResult = {
        success: true,
        passedChecks: ['ip', 'port'] as ConflictCheckType[],
      };

      const result = conflictDetectionResultSchema.safeParse(successResult);
      expect(result.success).toBe(true);
    });

    it('应该接受失败的检测结果（有冲突）', () => {
      const failureResult = {
        success: false,
        failedChecks: [
          { type: 'ip' as ConflictCheckType, error: 'IP 地址已存在' },
          { type: 'port' as ConflictCheckType, error: '端口已被占用' },
        ],
      };

      const result = conflictDetectionResultSchema.safeParse(failureResult);
      expect(result.success).toBe(true);
    });

    it('应该接受包含详细信息的完整结果', () => {
      const detailedResult = {
        success: true,
        passedChecks: ['network'] as ConflictCheckType[],
        totalLatency: 1500,
        details: [
          {
            type: 'ip' as ConflictCheckType,
            success: true,
            latency: 500,
          },
          {
            type: 'port' as ConflictCheckType,
            success: true,
            latency: 300,
            info: { port: 8080, status: 'available' },
          },
          {
            type: 'network' as ConflictCheckType,
            success: true,
            latency: 700,
          },
        ],
      };

      const result = conflictDetectionResultSchema.safeParse(detailedResult);
      expect(result.success).toBe(true);
    });

    it('应该接受混合结果（部分通过，部分失败）', () => {
      const mixedResult = {
        success: false,
        passedChecks: ['network'] as ConflictCheckType[],
        failedChecks: [
          { type: 'ip' as ConflictCheckType, error: 'IP 冲突' },
        ],
        totalLatency: 1200,
        details: [
          {
            type: 'ip' as ConflictCheckType,
            success: false,
            error: 'IP 冲突',
            latency: 400,
          },
          {
            type: 'network' as ConflictCheckType,
            success: true,
            latency: 800,
          },
        ],
      };

      const result = conflictDetectionResultSchema.safeParse(mixedResult);
      expect(result.success).toBe(true);
    });

    it('应该接受只有 success 字段的最小结果', () => {
      const minimalResult = {
        success: true,
      };

      const result = conflictDetectionResultSchema.safeParse(minimalResult);
      expect(result.success).toBe(true);
    });

    it('应该拒绝缺少 success 字段的结果', () => {
      const invalidResult = {
        passedChecks: ['ip'] as ConflictCheckType[],
      };

      const result = conflictDetectionResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });
});
