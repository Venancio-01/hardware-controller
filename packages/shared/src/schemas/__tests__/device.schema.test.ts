/**
 * 设备状态 Schema 单元测试
 *
 * 测试 device.schema.ts 中定义的设备状态验证规则
 */

import { describe, expect, it } from 'vitest';
import { deviceStatusSchema } from '../device.schema.js';

describe('deviceStatusSchema 验证测试', () => {
  describe('有效设备状态验证', () => {
    it('应该接受完整有效的 UDP 设备状态', () => {
      const validDevice = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 8080,
        protocol: 'UDP' as const,
        uptime: 3600,
      };

      const result = deviceStatusSchema.safeParse(validDevice);
      expect(result.success).toBe(true);
    });

    it('应该接受离线的 TCP 设备状态', () => {
      const device = {
        online: false,
        ipAddress: '10.0.0.1',
        port: 3000,
        protocol: 'TCP' as const,
        uptime: 1800,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(true);
    });
  });

  describe('端口号范围验证', () => {
    it('应该接受端口号 = 1 (最小值)', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 1,
        protocol: 'UDP' as const,
        uptime: 0,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(true);
    });

    it('应该接受端口号 = 65535 (最大值)', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 65535,
        protocol: 'TCP' as const,
        uptime: 7200,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(true);
    });

    it('应该拒绝端口号 = 0', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 0,
        protocol: 'UDP' as const,
        uptime: 0,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });

    it('应该拒绝端口号 = 65536 (超出范围)', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 65536,
        protocol: 'UDP' as const,
        uptime: 3600,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });

    it('应该拒绝负数端口号', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: -1,
        protocol: 'TCP' as const,
        uptime: 300,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });
  });

  describe('协议类型验证', () => {
    it('应该只接受 UDP 或 TCP 协议', () => {
      const validProtocols = ['UDP', 'TCP'];

      validProtocols.forEach(protocol => {
        const device = {
          online: true,
          ipAddress: '192.168.1.50',
          port: 8080,
          protocol,
          uptime: 1200,
        };

        const result = deviceStatusSchema.safeParse(device);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝无效的协议类型', () => {
      const device = {
        online: true,
        ipAddress: '192.168.1.50',
        port: 8080,
        protocol: 'HTTP', // 无效协议
        uptime: 900,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });
  });

  describe('必填字段验证', () => {
    it('应该拒绝缺少 online 字段', () => {
      const device = {
        ipAddress: '192.168.1.50',
        port: 8080,
        protocol: 'UDP',
        uptime: 600,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });

    it('应该拒绝缺少 ipAddress 字段', () => {
      const device = {
        online: true,
        port: 8080,
        protocol: 'UDP',
        uptime: 1500,
      };

      const result = deviceStatusSchema.safeParse(device);
      expect(result.success).toBe(false);
    });
  });
});
