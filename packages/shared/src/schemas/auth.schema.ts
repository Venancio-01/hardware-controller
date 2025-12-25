import { z } from 'zod';

/**
 * 登录请求验证 Schema
 */
export const loginRequestSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * 登录响应验证 Schema
 */
export const loginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  error: z.string().optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
