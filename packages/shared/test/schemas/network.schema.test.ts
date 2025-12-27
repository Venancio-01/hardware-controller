import { describe, it, expect } from 'vitest';
import { networkConfigSchema } from '../../src/schemas/network.schema.js';

describe('networkConfigSchema', () => {
  it('should validate a correct configuration', () => {
    const validConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080,
    };

    const result = networkConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should fail if IP address is invalid', () => {
    const invalidConfig = {
      ipAddress: '999.999.999.999',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080,
    };
    const result = networkConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
       expect(result.error.issues[0].path).toContain('ipAddress');
    }
  });

  it('should fail if Subnet Mask is invalid format', () => {
    const invalidConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.999',
      gateway: '192.168.1.1',
      port: 8080,
    };
    const result = networkConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should fail if Gateway is invalid IP', () => {
    const invalidConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: 'not-an-ip',
      port: 8080,
    };
    const result = networkConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should fail if Port is out of range', () => {
    const lowPort = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 0,
    };
    expect(networkConfigSchema.safeParse(lowPort).success).toBe(false);

    const highPort = {
      ...lowPort,
      port: 65536,
    };
    expect(networkConfigSchema.safeParse(highPort).success).toBe(false);
  });

  it('should fail if Gateway is NOT in the same subnet', () => {
    const mismatchConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.2.1', // Different subnet
      port: 8080,
    };
    const result = networkConfigSchema.safeParse(mismatchConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check if error is attached to gateway or refinement
      // The instruction suggested attaching to "gateway"
      expect(result.error.issues.some(issue => issue.path.includes('gateway'))).toBe(true);
    }
  });


});
