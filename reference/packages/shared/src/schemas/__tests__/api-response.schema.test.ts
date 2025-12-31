/**
 * API 响应 Schema 单元测试
 *
 * 测试 api-response.schema.ts 中定义的 API 响应包装验证规则
 */

import { describe, expect, it } from 'vitest';
import { apiSuccessResponseSchema, apiErrorResponseSchema } from '../api-response.schema.js';

describe('API 响应 Schema 验证测试', () => {
  describe('成功响应验证', () => {
    it('应该接受标准成功响应', () => {
      const response = {
        success: true,
        data: { id: 1, name: 'Test' },
      };

      const result = apiSuccessResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该接受包含 message 的成功响应', () => {
      const response = {
        success: true,
        data: { count: 10 },
        message: '操作成功',
      };

      const result = apiSuccessResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该接受 data 为 null 的成功响应', () => {
      const response = {
        success: true,
        data: null,
      };

      const result = apiSuccessResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该拒绝 success = false 的成功响应', () => {
      const response = {
        success: false,
        data: { id: 1 },
      };

      const result = apiSuccessResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('应该接受不包含 data 字段的成功响应(由于使用了z.any())', () => {
      const response = {
        success: true,
        message: '成功',
      };

      // z.any() 不强制要求字段存在,所以这会通过验证
      // 如果需要data是必填的,应该显式定义,不使用any
      const result = apiSuccessResponseSchema.safeParse(response);
      expect(result.success).toBe(true);  // z.any() 的行为是接受缺失字段
    });
  });

  describe('错误响应验证', () => {
    it('应该接受标准错误响应', () => {
      const response = {
        success: false,
        error: '操作失败',
      };

      const result = apiErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该接受包含 errorCode 的错误响应', () => {
      const response = {
        success: false,
        error: '验证失败',
        errorCode: 'VALIDATION_ERROR',
      };

      const result = apiErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该接受包含 validationErrors 的错误响应', () => {
      const response = {
        success: false,
        error: '表单验证失败',
        errorCode: 'VALIDATION_ERROR',
        validationErrors: {
          email: '邮箱格式错误',
          password: '密码长度不足',
        },
      };

      const result = apiErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('应该拒绝 success = true 的错误响应', () => {
      const response = {
        success: true,
        error: '不应该成功',
      };

      const result = apiErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('应该拒绝缺少 error 字段的响应', () => {
      const response = {
        success: false,
        errorCode: 'UNKNOWN',
      };

      const result = apiErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});
