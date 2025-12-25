import { describe, it, expect } from 'vitest';
import { isIpInSubnet } from '../../src/utils/ip-utils.js';

describe('isIpInSubnet', () => {
  it('should return true when gateway is in the same subnet', () => {
    // 192.168.1.1 and 192.168.1.10 in /24
    expect(isIpInSubnet('192.168.1.1', '192.168.1.10', '255.255.255.0')).toBe(true);
  });

  it('should return false when gateway is NOT in the same subnet', () => {
    // 192.168.1.1 and 192.168.2.1 in /24
    expect(isIpInSubnet('192.168.1.1', '192.168.2.1', '255.255.255.0')).toBe(false);
  });

  it('should handle different subnet masks correctly', () => {
    // 10.0.0.1 and 10.0.1.1 in /16 (255.255.0.0) -> Same subnet
    expect(isIpInSubnet('10.0.0.1', '10.0.1.1', '255.255.0.0')).toBe(true);
    
    // 10.0.0.1 and 10.1.0.1 in /16 -> Different subnet
    expect(isIpInSubnet('10.0.0.1', '10.1.0.1', '255.255.0.0')).toBe(false);
  });

  it('should return false for invalid IP formats (robustness)', () => {
    expect(isIpInSubnet('invalid', '192.168.1.1', '255.255.255.0')).toBe(false);
    expect(isIpInSubnet('192.168.1.1', 'invalid', '255.255.255.0')).toBe(false);
    expect(isIpInSubnet('192.168.1.1', '192.168.1.1', 'invalid')).toBe(false);
  });
});
