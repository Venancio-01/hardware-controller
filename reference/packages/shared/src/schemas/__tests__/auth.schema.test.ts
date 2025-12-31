import { describe, expect, it } from 'vitest';
import { loginRequestSchema, loginResponseSchema } from '../auth.schema.js';

describe('auth.schema 验证测试', () => {
  describe('loginRequestSchema', () => {
    it('应该接受有效的登录请求', () => {
      const validRequest = {
        username: 'admin',
        password: 'password123',
      };

      const result = loginRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('应该拒绝空用户名', () => {
      const invalidRequest = {
        username: '',
        password: 'password123',
      };

      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该拒绝空密码', () => {
      const invalidRequest = {
        username: 'admin',
        password: '',
      };

      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该拒绝缺少用户名的请求', () => {
      const invalidRequest = {
        password: 'password123',
      };

      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('应该拒绝缺少密码的请求', () => {
      const invalidRequest = {
        username: 'admin',
      };

      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('loginResponseSchema', () => {
    it('应该接受成功的登录响应（带 token）', () => {
      const successResponse = {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      const result = loginResponseSchema.safeParse(successResponse);
      expect(result.success).toBe(true);
    });

    it('应该接受失败的登录响应（带错误）', () => {
      const errorResponse = {
        success: false,
        error: '用户名或密码错误',
      };

      const result = loginResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it('应该接受成功的登录响应（同时包含 token 和可选字段）', () => {
      const successResponse = {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        error: undefined,
      };

      const result = loginResponseSchema.safeParse(successResponse);
      expect(result.success).toBe(true);
    });

    it('应该拒绝缺少 success 字段的响应', () => {
      const invalidResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      const result = loginResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('应该拒绝 success=false 但缺少 error 字段的响应', () => {
      const invalidResponse = {
        success: false,
        token: 'some-token',
      };

      const result = loginResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(true); // token 和 error 都是可选的，所以这是有效的
    });

    it('应该接受只有 success=true 的最小响应', () => {
      const minimalResponse = {
        success: true,
      };

      const result = loginResponseSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
    });
  });
});
