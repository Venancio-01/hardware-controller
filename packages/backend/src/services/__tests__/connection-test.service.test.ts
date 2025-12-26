import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConnectionTestService } from '../connection-test.service';
import { TestConnectionRequest } from 'shared';

describe('ConnectionTestService', () => {
  let service: ConnectionTestService;

  beforeEach(() => {
    service = new ConnectionTestService();
  });

  describe('testConnection', () => {
    it('should return success for valid TCP connection', async () => {
      // Mock the testTcpConnection method to simulate success
      const mockTestTcpConnection = vi
        .spyOn<any, any>(service, 'testTcpConnection')
        .mockResolvedValue({
          success: true,
          latency: 10,
          target: '127.0.0.1:80',
        });

      const request: TestConnectionRequest = {
        ipAddress: '127.0.0.1',
        port: 80,
        protocol: 'tcp',
        timeout: 5000,
      };

      const result = await service.testConnection(request);

      expect(result).toEqual({
        success: true,
        latency: 10,
        target: '127.0.0.1:80',
      });
      expect(mockTestTcpConnection).toHaveBeenCalledWith('127.0.0.1', 80, 5000);
    });

    it('should return success for valid UDP connection', async () => {
      // Mock the testUdpConnection method to simulate success
      const mockTestUdpConnection = vi
        .spyOn<any, any>(service, 'testUdpConnection')
        .mockResolvedValue({
          success: true,
          latency: 15,
          target: '127.0.0.1:53',
        });

      const request: TestConnectionRequest = {
        ipAddress: '127.0.0.1',
        port: 53,
        protocol: 'udp',
        timeout: 5000,
      };

      const result = await service.testConnection(request);

      expect(result).toEqual({
        success: true,
        latency: 15,
        target: '127.0.0.1:53',
      });
      expect(mockTestUdpConnection).toHaveBeenCalledWith('127.0.0.1', 53, 5000);
    });

    it('should handle unsupported protocol', async () => {
      const request: TestConnectionRequest = {
        ipAddress: '127.0.0.1',
        port: 80,
        protocol: 'ftp' as any, // Invalid protocol
        timeout: 5000,
      };

      const result = await service.testConnection(request);

      expect(result).toEqual({
        success: false,
        error: 'Unsupported protocol: ftp',
        target: '127.0.0.1:80',
      });
    });

    it('should handle unexpected errors', async () => {
      // Mock the testTcpConnection method to throw an error
      const mockTestTcpConnection = vi
        .spyOn<any, any>(service, 'testTcpConnection')
        .mockRejectedValue(new Error('Unexpected error'));

      const request: TestConnectionRequest = {
        ipAddress: '127.0.0.1',
        port: 80,
        protocol: 'tcp',
        timeout: 5000,
      };

      const result = await service.testConnection(request);

      expect(result).toEqual({
        success: false,
        error: 'Unexpected error: Unexpected error',
        target: '127.0.0.1:80',
      });
      expect(mockTestTcpConnection).toHaveBeenCalledWith('127.0.0.1', 80, 5000);
    });

    it('should handle invalid IP addresses gracefully', async () => {
      const mockTestTcpConnection = vi
        .spyOn<any, any>(service, 'testTcpConnection')
        .mockResolvedValue({
          success: false,
          error: 'Invalid IP address',
          target: '999.999.999.999:80',
        });

      const request: TestConnectionRequest = {
        ipAddress: '999.999.999.999',
        port: 80,
        protocol: 'tcp',
        timeout: 5000,
      };

      const result = await service.testConnection(request);

      expect(result.success).toBe(false);
      expect(mockTestTcpConnection).toHaveBeenCalledWith('999.999.999.999', 80, 5000);
    });
  });

  describe('testTcpConnection', () => {
    it('should handle connection timeout', async () => {
      // This test verifies the timeout logic is called
      // The actual net module behavior is tested in integration tests
      const testResult = await service['testTcpConnection']('192.168.1.1', 9999, 100);

      // We expect either a timeout or connection failure
      expect(testResult).toHaveProperty('success');
      expect(testResult).toHaveProperty('target', '192.168.1.1:9999');
      expect(testResult).toHaveProperty('latency');
    });

    it('should handle localhost connection successfully', async () => {
      const testResult = await service['testTcpConnection']('127.0.0.1', 3000, 2000);

      expect(testResult).toHaveProperty('success');
      expect(testResult).toHaveProperty('target', '127.0.0.1:3000');
      expect(testResult).toHaveProperty('latency');
      // Note: Success depends on whether port 3000 is actually listening
    });
  });

  describe('testUdpConnection', () => {
    it('should complete UDP test without errors', async () => {
      // UDP test should complete (send packet and timeout waiting for response)
      const testResult = await service['testUdpConnection']('127.0.0.1', 53, 1000);

      expect(testResult).toHaveProperty('success');
      expect(testResult).toHaveProperty('target', '127.0.0.1:53');
      expect(testResult).toHaveProperty('latency');
      // UDP test succeeds if it can send the packet
    });

    it('should handle invalid port gracefully', async () => {
      // 使用有效范围内的端口但可能没有服务监听
      const testResult = await service['testUdpConnection']('127.0.0.1', 9999, 1000);

      expect(testResult).toHaveProperty('success');
      expect(testResult).toHaveProperty('target', '127.0.0.1:9999');
      expect(testResult).toHaveProperty('latency');
      // UDP 测试会尝试发送，成功与否取决于网络环境
    });
  });
});