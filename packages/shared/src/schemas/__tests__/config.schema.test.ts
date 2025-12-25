/**
 * 配置 Schema 单元测试
 *
 * 测试 config.schema.ts 中定义的验证规则
 */

import { describe, expect, it } from 'vitest';
import { configSchema } from '../config.schema.js';

describe('configSchema 验证测试', () => {
  describe('有效配置数据验证', () => {
    it('应该接受完整有效的配置数据', () => {
      const validConfig = {
        deviceId: 'device-001',
        timeout: 5000,
        retryCount: 3,
        pollingInterval: 5000,
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('应该使用默认值 pollingInterval = 5000', () => {
      const config = {
        deviceId: 'device-002',
        timeout: 3000,
        retryCount: 2,
      };

      const result = configSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pollingInterval).toBe(5000);
      }
    });
  });

  describe('无效配置数据验证', () => {
    it('应该拒绝缺少必填字段 device的配置', () => {
      const invalidConfig = {
        timeout: 5000,
        retryCount: 3,
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('应该拒绝负数的 timeout', () => {
      const invalidConfig = {
        deviceId: 'device-003',
        timeout: -1000,
        retryCount: 0,
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('应该拒绝负数的 retryCount', () => {
      const invalidConfig = {
        deviceId: 'device-004',
        timeout: 5000,
        retryCount: -1,
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('边界情况测试', () => {
    it('应该接受 retryCount = 0', () => {
      const config = {
        deviceId: 'device-005',
        timeout: 5000,
        retryCount: 0,
      };

      const result = configSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('应该接受最小 timeout = 1', () => {
      const config = {
        deviceId: 'device-006',
        timeout: 1,
        retryCount: 1,
      };

      const result = configSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});
