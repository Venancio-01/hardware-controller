/**
 * 验证模式测试
 *
 * 该测试文件验证共享的 Zod 验证模式是否按预期工作。
 */

import { describe, it, expect } from 'vitest';
import {
  appConfigSchema,
  networkConfigSchema,
  systemConfigSchema,
  configUpdateRequestSchema,
  configResponseSchema
} from '../validation';

describe('Validation Schemas', () => {
  describe('appConfigSchema', () => {
    it('should validate valid app config', () => {
      const validAppConfig = {
        appName: 'Test App',
        version: '1.0.0',
        isProduction: false,
        logLevel: 'info',
        port: 3000,
        host: 'localhost'
      };

      const result = appConfigSchema.safeParse(validAppConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid app config', () => {
      const invalidAppConfig = {
        appName: '', // invalid - empty string
        version: 'invalid-version',
        isProduction: false,
        logLevel: 'invalid-level', // invalid enum
        port: 70000, // invalid - port out of range
        host: ''
      };

      const result = appConfigSchema.safeParse(invalidAppConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('networkConfigSchema', () => {
    it('should validate valid network config', () => {
      const validNetworkConfig = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        dns: '8.8.8.8',
        port: 8080
      };

      const result = networkConfigSchema.safeParse(validNetworkConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid network config', () => {
      const invalidNetworkConfig = {
        ipAddress: '999.999.999.999', // invalid IP
        subnetMask: 'invalid', // invalid IP
        gateway: 'also-invalid', // invalid IP
        dns: '8.8.8.8',
        port: 70000 // invalid - port out of range
      };

      const result = networkConfigSchema.safeParse(invalidNetworkConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('systemConfigSchema', () => {
    it('should validate valid system config', () => {
      const validSystemConfig = {
        app: {
          appName: 'Test App',
          version: '1.0.0',
          isProduction: false,
          logLevel: 'info',
          port: 3000,
          host: 'localhost'
        },
        network: {
          ipAddress: '192.168.1.100',
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1',
          dns: '8.8.8.8',
          port: 8080
        }
      };

      const result = systemConfigSchema.safeParse(validSystemConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('configUpdateRequestSchema', () => {
    it('should validate valid config update request', () => {
      const validRequest = {
        config: {
          app: {
            logLevel: 'debug'
          }
        },
        applyImmediately: true
      };

      const result = configUpdateRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('configResponseSchema', () => {
    it('should validate valid config response', () => {
      const validResponse = {
        valid: true,
        config: {
          app: {
            appName: 'Test App',
            version: '1.0.0',
            isProduction: false,
            logLevel: 'info',
            port: 3000,
            host: 'localhost'
          },
          network: {
            ipAddress: '192.168.1.100',
            subnetMask: '255.255.255.0',
            gateway: '192.168.1.1',
            dns: '8.8.8.8',
            port: 8080
          }
        }
      };

      const result = configResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });
});