/**
 * 共享验证模式
 *
 * 该模块包含使用 Zod 定义的验证模式，用于前端表单和后端 API 的数据验证。
 */

import { z } from 'zod';

/**
 * IP地址验证模式
 */
const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
export const ipSchema = z.string().regex(ipRegex, 'Invalid IP address');

/**
 * 端口验证模式
 */
export const portSchema = z.number().int().min(1).max(65535);

/**
 * 应用配置验证模式
 */
export const appConfigSchema = z.object({
  appName: z.string().min(1, 'Application name is required').max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  isProduction: z.boolean(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  port: portSchema,
  host: z.string().min(1, 'Host is required')
});

/**
 * 网络配置验证模式
 */
export const networkConfigSchema = z.object({
  ipAddress: ipSchema,
  subnetMask: ipSchema,
  gateway: ipSchema,
  dns: ipSchema.optional().or(z.string().length(0)), // 允许空字符串表示未设置
  port: portSchema
});

/**
 * 系统配置验证模式
 */
export const systemConfigSchema = z.object({
  app: appConfigSchema,
  network: networkConfigSchema
});

/**
 * 配置更新请求验证模式
 */
export const configUpdateRequestSchema = z.object({
  config: z.object({
    app: appConfigSchema.partial().optional(),
    network: networkConfigSchema.partial().optional()
  }).partial(),
  applyImmediately: z.boolean().optional()
});

/**
 * 配置响应验证模式
 */
export const configResponseSchema = z.object({
  valid: z.boolean(),
  config: systemConfigSchema,
  errors: z.array(z.string()).optional()
});

// 导出通过 Zod 验证模式推断出的类型定义
// 为了与 types.ts 中的手动定义保持一致，这里提供 Zod 版本的类型
export type AppZodConfig = z.infer<typeof appConfigSchema>;
export type NetworkZodConfig = z.infer<typeof networkConfigSchema>;
export type SystemZodConfig = z.infer<typeof systemConfigSchema>;
export type ZodConfigUpdateRequest = z.infer<typeof configUpdateRequestSchema>;
export type ZodConfigResponse = z.infer<typeof configResponseSchema>;

// 导出 Zod 库本身
export { z };