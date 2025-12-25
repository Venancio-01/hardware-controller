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
    });

    it('应该验证超时时间范围', () => {
      const config = { ...validAppConfig, ...validNetworkConfig, timeout: 500 }; // 太小
      expect(configSchema.safeParse(config).success).toBe(false);

      const configBig = { ...validAppConfig, ...validNetworkConfig, timeout: 30001 }; // 太大
      expect(configSchema.safeParse(configBig).success).toBe(false);
    });
  });
});