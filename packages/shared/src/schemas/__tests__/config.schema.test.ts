import { describe, expect, it } from 'vitest';
import { appConfigSchema, configSchema } from '../config.schema.js';
import { networkConfigSchema } from '../network.schema.js';

describe('configSchema 验证测试', () => {
  const validNetworkConfig = {
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    port: 8080,
    dns: ['8.8.8.8'],
  };

  const validAppConfig = {
    deviceId: 'device-001',
    timeout: 5000,
    retryCount: 3,
    pollingInterval: 5000,
  };

  describe('完整配置验证', () => {
    it('应该接受包含应用和网络设置的完整配置', () => {
      const validConfig = {
        ...validAppConfig,
        ...validNetworkConfig,
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('应该拒绝缺少网络设置的配置', () => {
      const invalidConfig = {
        ...validAppConfig,
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('应该拒绝缺少应用设置的配置', () => {
      const invalidConfig = {
        ...validNetworkConfig,
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('应用配置字段验证', () => {
    it('应该验证 deviceId 长度', () => {
      const config = {
        ...validAppConfig,
        ...validNetworkConfig,
        deviceId: '', // 太短
      };
      expect(configSchema.safeParse(config).success).toBe(false);

      const configLong = {
        ...validAppConfig,
        ...validNetworkConfig,
        deviceId: 'a'.repeat(51), // 太长
      };
      expect(configSchema.safeParse(configLong).success).toBe(false);

      // 边界值测试
      const configValidLength = {
        ...validAppConfig,
        ...validNetworkConfig,
        deviceId: 'a', // 最小有效长度
      };
      expect(configSchema.safeParse(configValidLength).success).toBe(true);

      const configMaxLength = {
        ...validAppConfig,
        ...validNetworkConfig,
        deviceId: 'a'.repeat(50), // 最大有效长度
      };
      expect(configSchema.safeParse(configMaxLength).success).toBe(true);
    });

    it('应该验证超时时间范围', () => {
      const config = { ...validAppConfig, ...validNetworkConfig, timeout: 500 }; // 太小
      expect(configSchema.safeParse(config).success).toBe(false);

      const configBig = { ...validAppConfig, ...validNetworkConfig, timeout: 30001 }; // 太大
      expect(configSchema.safeParse(configBig).success).toBe(false);

      // 边界值测试
      const configMin = { ...validAppConfig, ...validNetworkConfig, timeout: 1000 };
      expect(configSchema.safeParse(configMin).success).toBe(true);

      const configMax = { ...validAppConfig, ...validNetworkConfig, timeout: 30000 };
      expect(configSchema.safeParse(configMax).success).toBe(true);
    });

    it('应该验证重试次数范围', () => {
      const configNegative = { ...validAppConfig, ...validNetworkConfig, retryCount: -1 };
      expect(configSchema.safeParse(configNegative).success).toBe(false);

      const configTooHigh = { ...validAppConfig, ...validNetworkConfig, retryCount: 11 };
      expect(configSchema.safeParse(configTooHigh).success).toBe(false);

      // 边界值测试
      const configMin = { ...validAppConfig, ...validNetworkConfig, retryCount: 0 };
      expect(configSchema.safeParse(configMin).success).toBe(true);

      const configMax = { ...validAppConfig, ...validNetworkConfig, retryCount: 10 };
      expect(configSchema.safeParse(configMax).success).toBe(true);
    });

    it('应该验证轮询间隔范围', () => {
      const configTooSmall = { ...validAppConfig, ...validNetworkConfig, pollingInterval: 999 };
      expect(configSchema.safeParse(configTooSmall).success).toBe(false);

      const configTooBig = { ...validAppConfig, ...validNetworkConfig, pollingInterval: 60001 };
      expect(configSchema.safeParse(configTooBig).success).toBe(false);

      // 边界值测试
      const configMin = { ...validAppConfig, ...validNetworkConfig, pollingInterval: 1000 };
      expect(configSchema.safeParse(configMin).success).toBe(true);

      const configMax = { ...validAppConfig, ...validNetworkConfig, pollingInterval: 60000 };
      expect(configSchema.safeParse(configMax).success).toBe(true);
    });

    it('应该验证数字字段必须是整数', () => {
      const configTimeoutFloat = { ...validAppConfig, ...validNetworkConfig, timeout: 1500.5 };
      expect(configSchema.safeParse(configTimeoutFloat).success).toBe(false);

      const configRetryFloat = { ...validAppConfig, ...validNetworkConfig, retryCount: 3.5 };
      expect(configSchema.safeParse(configRetryFloat).success).toBe(false);

      const configPollingFloat = { ...validAppConfig, ...validNetworkConfig, pollingInterval: 5000.1 };
      expect(configSchema.safeParse(configPollingFloat).success).toBe(false);
    });
  });
});