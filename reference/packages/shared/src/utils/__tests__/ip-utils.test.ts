import { describe, expect, it } from 'vitest';
import { isIpInSubnet } from '../ip-utils.js';

describe('ip-utils 测试', () => {
  describe('isIpInSubnet', () => {
    it('应该正确识别同一子网的 IP 地址', () => {
      const gateway = '192.168.1.1';
      const ipAddress = '192.168.1.100';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该正确识别不同子网的 IP 地址', () => {
      const gateway = '192.168.1.1';
      const ipAddress = '192.168.2.100';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(false);
    });

    it('应该处理 Class C 子网掩码', () => {
      const gateway = '10.0.0.1';
      const ipAddress = '10.0.0.254';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该处理 Class B 子网掩码', () => {
      const gateway = '172.16.0.1';
      const ipAddress = '172.16.255.254';
      const subnetMask = '255.255.0.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该处理 Class A 子网掩码', () => {
      const gateway = '10.0.0.1';
      const ipAddress = '10.255.255.254';
      const subnetMask = '255.0.0.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该拒绝无效的 IP 地址格式', () => {
      const gateway = '256.168.1.1';
      const ipAddress = '192.168.1.100';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(false);
    });

    it('应该拒绝空字符串 IP', () => {
      expect(isIpInSubnet('', '192.168.1.100', '255.255.255.0')).toBe(false);
      expect(isIpInSubnet('192.168.1.1', '', '255.255.255.0')).toBe(false);
      expect(isIpInSubnet('192.168.1.1', '192.168.1.100', '')).toBe(false);
    });

    it('应该拒绝不完整的 IP 地址', () => {
      expect(isIpInSubnet('192.168.1', '192.168.1.100', '255.255.255.0')).toBe(false);
      expect(isIpInSubnet('192.168.1.1', '192.168.1', '255.255.255.0')).toBe(false);
    });

    it('应该拒绝前导零的 IP 地址（如 192.168.01.1）', () => {
      const gateway = '192.168.01.1';
      const ipAddress = '192.168.1.100';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(false);
    });

    it('应该拒绝包含非数字字符的 IP', () => {
      expect(isIpInSubnet('192.168.1.1', '192.168.abc.1', '255.255.255.0')).toBe(false);
      expect(isIpInSubnet('192.168.def.1', '192.168.1.1', '255.255.255.0')).toBe(false);
    });

    it('应该正确处理 CIDR /24 子网', () => {
      const gateway = '192.168.1.1';
      const ipAddress = '192.168.1.255';
      const subnetMask = '255.255.255.0';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该正确处理 CIDR /25 子网', () => {
      const gateway = '192.168.1.1';
      const ipAddress = '192.168.1.126';
      const subnetMask = '255.255.255.128';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(true);
    });

    it('应该拒绝跨子网边界的 IP（CIDR /25）', () => {
      const gateway = '192.168.1.1';
      const ipAddress = '192.168.1.129';
      const subnetMask = '255.255.255.128';

      expect(isIpInSubnet(gateway, ipAddress, subnetMask)).toBe(false);
    });
  });
});
