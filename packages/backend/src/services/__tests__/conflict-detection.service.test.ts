/**
 * 冲突检测服务单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConflictDetectionService } from '../conflict-detection.service';
import { ConfigService } from '../config.service';
import { connectionTestService } from '../connection-test.service';

// Mock 依赖服务
vi.mock('../config.service');
vi.mock('../connection-test.service');

describe('ConflictDetectionService', () => {
  let conflictDetectionService: ConflictDetectionService;
  let mockConfigService: ConfigService;
  let mockConnectionTestService: any;

  beforeEach(() => {
    mockConfigService = new ConfigService() as ConfigService;
    mockConnectionTestService = connectionTestService;
    conflictDetectionService = new ConflictDetectionService(mockConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkConflict', () => {
    it('should return successful result when no conflicts are detected', async () => {
      // Mock config data without conflicts
      const mockConfig = {
        network: {
          ipAddress: '192.168.1.100',
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1',
          port: 8080,
        },
      };

      // Mock unsuccessful ping (indicating IP is not in use)
      vi.spyOn(conflictDetectionService as any, 'pingIP').mockResolvedValue({ success: false });

      // Mock connection test to return failure (indicating port is not in use)
      vi.spyOn(mockConnectionTestService, 'testConnection').mockResolvedValue({
        success: false,  // Port not in use (should pass port check)
        latency: 10,
        target: 'localhost:8080',
      });

      const request = {
        config: mockConfig,
        checkTypes: ['ip', 'port', 'network'] as const,
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(true);
      expect(result.passedChecks).toEqual(['ip', 'port', 'network']);
      expect(result.failedChecks).toEqual([]);
    });

    it('should detect IP conflict when ping succeeds', async () => {
      // Mock config data
      const mockConfig = {
        network: {
          ipAddress: '192.168.1.100',
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1',
          port: 8080,
        },
      };

      // Mock successful ping (indicating IP is already in use)
      vi.spyOn(conflictDetectionService as any, 'pingIP').mockResolvedValue({ success: true });

      const request = {
        config: mockConfig,
        checkTypes: ['ip'],
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(false);
      expect(result.passedChecks).toEqual([]);
      expect(result.failedChecks).toEqual([
        { type: 'ip', error: 'IP 地址 192.168.1.100 已被占用，可能会导致冲突' }
      ]);
    });

    it('should detect port conflict when connection test passes', async () => {
      // Mock config data
      const mockConfig = {
        network: {
          ipAddress: '192.168.1.100',
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1',
          port: 8080,
        },
      };

      // Mock connection test service to return success (meaning port is in use)
      vi.spyOn(mockConnectionTestService, 'testConnection').mockResolvedValue({
        success: true,
        latency: 10,
        target: 'localhost:8080',
      });

      const request = {
        config: mockConfig,
        checkTypes: ['port'],
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(false);
      expect(result.passedChecks).toEqual([]);
      expect(result.failedChecks).toEqual([
        { type: 'port', error: '端口 8080 已被占用，无法使用' }
      ]);
    });

    it('should validate network config and detect invalid IP format', async () => {
      // Mock config data with invalid IP
      const mockConfig = {
        network: {
          ipAddress: '999.999.999.999', // Invalid IP
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1',
          port: 8080,
        },
      };

      const request = {
        config: mockConfig,
        checkTypes: ['network'],
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(false);
      expect(result.passedChecks).toEqual([]);
      expect(result.failedChecks![0].type).toBe('network');
      expect(result.failedChecks![0].error).toContain('IP 地址格式无效');
    });

    it('should detect when IP and gateway are not in the same network', async () => {
      // Mock config data where IP and gateway are not in the same subnet
      const mockConfig = {
        network: {
          ipAddress: '192.168.2.100', // Different subnet
          subnetMask: '255.255.255.0',
          gateway: '192.168.1.1', // Different subnet
          port: 8080,
        },
      };

      const request = {
        config: mockConfig,
        checkTypes: ['network'],
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(false);
      expect(result.passedChecks).toEqual([]);
      expect(result.failedChecks![0].type).toBe('network');
      expect(result.failedChecks![0].error).toContain('不在同一网段');
    });

    it('should skip checks for missing config parts', async () => {
      // Mock config data with missing network section
      const mockConfig = {
        network: {}, // Empty network config
      };

      const request = {
        config: mockConfig,
        checkTypes: ['ip', 'port'],
        timeout: 5000,
      };

      const result = await conflictDetectionService.checkConflict(request);

      expect(result.success).toBe(true);
      expect(result.passedChecks).toEqual(['ip', 'port']);
    });
  });

  describe('isValidIPv4', () => {
    it('should return true for valid IPv4 addresses', () => {
      const service = new ConflictDetectionService();
      expect(service['isValidIPv4']('192.168.1.1')).toBe(true);
      expect(service['isValidIPv4']('10.0.0.1')).toBe(true);
      expect(service['isValidIPv4']('255.255.255.255')).toBe(true);
      expect(service['isValidIPv4']('0.0.0.0')).toBe(true);
    });

    it('should return false for invalid IPv4 addresses', () => {
      const service = new ConflictDetectionService();
      expect(service['isValidIPv4']('999.168.1.1')).toBe(false);
      expect(service['isValidIPv4']('192.168.1')).toBe(false);
      expect(service['isValidIPv4']('192.168.1.')).toBe(false);
      expect(service['isValidIPv4']('')).toBe(false);
      expect(service['isValidIPv4']('not.an.ip')).toBe(false);
    });
  });

  describe('isInSameNetwork', () => {
    it('should return true for IPs in the same network', () => {
      const service = new ConflictDetectionService();
      expect(service['isInSameNetwork']('192.168.1.10', '192.168.1.1', '255.255.255.0')).toBe(true);
      expect(service['isInSameNetwork']('10.0.0.100', '10.0.0.1', '255.0.0.0')).toBe(true);
    });

    it('should return false for IPs in different networks', () => {
      const service = new ConflictDetectionService();
      expect(service['isInSameNetwork']('192.168.1.10', '192.168.2.1', '255.255.255.0')).toBe(false);
      expect(service['isInSameNetwork']('10.0.0.100', '11.0.0.1', '255.0.0.0')).toBe(false);
    });
  });
});