/**
 * 网络配置 Schema 单元测试
 *
 * 测试 network.schema.ts 中定义的验证规则,包括 IP 格式、端口范围、网关子网一致性
 */

import { describe, expect, it } from 'vitest';
import { networkConfigSchema } from '../network.schema.js';

describe('networkConfigSchema 验证测试', () => {
  describe('有效网络配置数据验证', () => {
    it('应该接受完整有效的网络配置', () => {
      const validNetwork = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',

      };

      const result = networkConfigSchema.safeParse(validNetwork);
      expect(result.success).toBe(true);
    });


  });

  describe('无效 IP 地址格式验证', () => {
    it('应该拒绝格式错误的 IP 地址', () => {
      const invalidNetwork = {
        ipAddress: '256.168.1.100', // 超出范围
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(invalidNetwork);
      expect(result.success).toBe(false);
    });
  });

  describe('端口号验证', () => {
    const baseValidConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
    };

    it('应该拒绝端口号小于 1', () => {
      const network = { ...baseValidConfig, port: 0 };
      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
    });

    it('应该拒绝端口号大于 65535', () => {
      const network = { ...baseValidConfig, port: 65536 };
      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
    });

    it('应该拒绝非整数端口号', () => {
      const network = { ...baseValidConfig, port: 8080.5 };
      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
    });
  });

  describe('网关与子网一致性验证', () => {
      it('应该接受网关在同一子网内', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1', // 在同一 /24 子网
        port: 8080
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(true);
    });

    it('应该拒绝网关不在子网范围内', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.2.1', // 不在 192.168.1.0/24 子网
        port: 8080
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('gateway'))).toBe(true);
        expect(result.error.issues[0].message).toContain('网关 192.168.2.1 不在子网');
        expect(result.error.issues[0].message).toContain('192.168.1.0');
      }
    });

    it('应该拒绝网关与 IP 在不同的 /16 子网', () => {
      const network = {
        ipAddress: '172.16.1.10',
        subnetMask: '255.255.0.0',
        gateway: '172.17.0.1', // 不在 172.16.0.0/16 子网
        port: 8080
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
         expect(result.error.issues.some(issue => issue.path.includes('gateway'))).toBe(true);
         expect(result.error.issues[0].message).toContain('172.17.0.1');
         expect(result.error.issues[0].message).toContain('172.16.0.0');
      }
    });

    it('应该能够处理复杂的子网掩码 (如 /25)', () => {
        // 192.168.1.0/25 -> Range 192.168.1.0 - 192.168.1.127
        const network = {
            ipAddress: '192.168.1.10',
            subnetMask: '255.255.255.128',
            gateway: '192.168.1.1', // Valid
            port: 80
        };
        expect(networkConfigSchema.safeParse(network).success).toBe(true);

        const invalidNetwork = {
            ipAddress: '192.168.1.10',
            subnetMask: '255.255.255.128',
            gateway: '192.168.1.129', // Invalid (in upper half)
            port: 80
        };
        expect(networkConfigSchema.safeParse(invalidNetwork).success).toBe(false);
    });
  });

  describe('必填字段缺失错误处理', () => {
    it('应该拒绝缺少 IP 地址的配置', () => {
      const network = {
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
    });

    it('应该接受缺少端口的配置（使用默认值 80）', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.port).toBe(80); // 验证默认值
      }
    });
  });



  describe('边界情况验证', () => {
    it('应该拒绝 IP 地址为网络地址', () => {
      const network = {
        ipAddress: '192.168.1.0', // 网络地址
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('ipAddress'))).toBe(true);
        expect(result.error.issues.some(issue => issue.message.includes('不能是网络地址'))).toBe(true);
      }
    });

    it('应该拒绝 IP 地址为广播地址', () => {
      const network = {
        ipAddress: '192.168.1.255', // 广播地址
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('ipAddress'))).toBe(true);
        // 错误消息包含 "广播地址" 即可
        expect(result.error.issues.some(issue => issue.message.includes('广播地址'))).toBe(true);
      }
    });

    it('应该拒绝网关为网络地址', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.0', // 网络地址
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('gateway'))).toBe(true);
        // 网关是网络地址会在同一子网内，但会被主机地址验证捕获
        expect(result.error.issues.some(issue => issue.message.includes('网关不能是网络地址') || issue.message.includes('网络地址'))).toBe(true);
      }
    });

    it('应该拒绝网关为广播地址', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.255', // 广播地址
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('gateway'))).toBe(true);
        // 广播地址在同一子网内，但会被主机地址验证捕获
        expect(result.error.issues.some(issue => issue.message.includes('广播地址'))).toBe(true);
      }
    });

    it('应该接受网关与 IP 相同（技术上有效）', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.100', // 与 IP 相同
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(true);
    });
  });

  describe('子网掩码格式验证', () => {
    it('应该拒绝无效的子网掩码（不连续的1）', () => {
      const network = {
        ipAddress: '192.168.1.100',
        subnetMask: '255.0.255.0', // 无效的子网掩码
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('subnetMask'))).toBe(true);
        expect(result.error.issues[0].message).toContain('子网掩码格式无效');
      }
    });

    it('应该接受有效的标准子网掩码', () => {
      const validMasks = [
        { mask: '255.0.0.0', ip: '10.1.1.1', gateway: '10.0.0.1' },
        { mask: '255.255.0.0', ip: '172.16.1.1', gateway: '172.16.0.1' },
        { mask: '255.255.255.0', ip: '192.168.1.100', gateway: '192.168.1.1' },
        { mask: '255.255.255.128', ip: '192.168.1.10', gateway: '192.168.1.1' },
        { mask: '255.255.255.192', ip: '192.168.1.10', gateway: '192.168.1.1' },
        { mask: '255.255.255.224', ip: '192.168.1.10', gateway: '192.168.1.1' },
        { mask: '255.255.255.240', ip: '192.168.1.10', gateway: '192.168.1.1' },
        { mask: '255.255.255.248', ip: '192.168.1.10', gateway: '192.168.1.9' },
        { mask: '255.255.255.252', ip: '192.168.1.9', gateway: '192.168.1.10' },
      ];

      validMasks.forEach(({ mask, ip, gateway }) => {
        const network = {
          ipAddress: ip,
          subnetMask: mask,
          gateway: gateway,
          port: 8080,
        };

        const result = networkConfigSchema.safeParse(network);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝 /31 子网掩码（点对点，但没有有效主机地址）', () => {
      const network = {
        ipAddress: '192.168.1.0',
        subnetMask: '255.255.255.254',
        gateway: '192.168.1.1',
        port: 8080,
      };

      const result = networkConfigSchema.safeParse(network);
      expect(result.success).toBe(false);
      // IP 是网络地址，会被拒绝
    });
  });
});
