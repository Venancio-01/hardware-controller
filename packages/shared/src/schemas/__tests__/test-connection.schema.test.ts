import { describe, expect, it } from 'vitest';
import { testConnectionRequestSchema, testConnectionResultSchema } from '../test-connection.schema.js';

describe('testConnectionSchema 验证测试', () => {
  describe('请求 Schema 验证', () => {
    const validRequest = {
      ipAddress: '192.168.1.100',
      port: 8080,
    };

    it('应该接受有效的最小请求（仅必填项）', () => {
      const result = testConnectionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.protocol).toBe('tcp'); // 默认值
        expect(result.data.timeout).toBe(5000); // 默认值
      }
    });

    it('应该接受包含所有字段的有效请求', () => {
      const fullRequest = {
        ipAddress: '10.0.0.1',
        port: 3000,
        protocol: 'udp',
        timeout: 2000,
      };
      const result = testConnectionRequestSchema.safeParse(fullRequest);
      expect(result.success).toBe(true);
    });

    it('应该拒绝无效的 IP 地址', () => {
      // 格式错误的 IP
      const badFormat = { ...validRequest, ipAddress: 'invalid-ip' };
      expect(testConnectionRequestSchema.safeParse(badFormat).success).toBe(false);

      // 超出范围的 IP (每段必须 0-255)
      const outOfRange1 = { ...validRequest, ipAddress: '999.999.999.999' };
      expect(testConnectionRequestSchema.safeParse(outOfRange1).success).toBe(false);

      const outOfRange2 = { ...validRequest, ipAddress: '192.168.1.256' };
      expect(testConnectionRequestSchema.safeParse(outOfRange2).success).toBe(false);

      const outOfRange3 = { ...validRequest, ipAddress: '192.168.-1.1' };
      expect(testConnectionRequestSchema.safeParse(outOfRange3).success).toBe(false);

      // 边界值测试 - 应该接受
      const validEdge1 = { ...validRequest, ipAddress: '0.0.0.0' };
      expect(testConnectionRequestSchema.safeParse(validEdge1).success).toBe(true);

      const validEdge2 = { ...validRequest, ipAddress: '255.255.255.255' };
      expect(testConnectionRequestSchema.safeParse(validEdge2).success).toBe(true);
    });

    it('应该拒绝无效的端口号', () => {
      const lowPort = { ...validRequest, port: 0 };
      expect(testConnectionRequestSchema.safeParse(lowPort).success).toBe(false);

      const highPort = { ...validRequest, port: 65536 };
      expect(testConnectionRequestSchema.safeParse(highPort).success).toBe(false);

      const floatPort = { ...validRequest, port: 80.5 };
      expect(testConnectionRequestSchema.safeParse(floatPort).success).toBe(false);
    });

    it('应该拒绝无效的协议', () => {
      const invalidProtocol = { ...validRequest, protocol: 'http' };
      expect(testConnectionRequestSchema.safeParse(invalidProtocol).success).toBe(false);
    });

    it('应该拒绝无效的超时时间', () => {
      const tooLow = { ...validRequest, timeout: 50 };
      expect(testConnectionRequestSchema.safeParse(tooLow).success).toBe(false);

      const tooHigh = { ...validRequest, timeout: 30001 };
      expect(testConnectionRequestSchema.safeParse(tooHigh).success).toBe(false);
    });
  });

  describe('结果 Schema 验证', () => {
    const validResult = {
      success: true,
      target: '192.168.1.100:8080',
    };

    it('应该接受成功的测试结果', () => {
      const result = {
        ...validResult,
        latency: 15,
      };
      expect(testConnectionResultSchema.safeParse(result).success).toBe(true);
    });

    it('应该接受失败的测试结果', () => {
      const result = {
        success: false,
        target: '192.168.1.100:8080',
        error: 'Connection timed out',
      };
      expect(testConnectionResultSchema.safeParse(result).success).toBe(true);
    });

    it('应该拒绝缺少必填字段的结果', () => {
      const invalid = { success: true }; // 缺少 target
      expect(testConnectionResultSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
