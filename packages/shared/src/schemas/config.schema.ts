/**
 * 配置验证 Schema
 *
 * 定义应用程序配置的 Zod 验证模式
 */

import { z } from 'zod';

/**
 * 应用程序配置 Schema
 *
 * 包含设备 ID、超时、重试次数和轮询间隔等配置
 */
export const configSchema = z.object({
  /**
   * 设备唯一标识符
   */
  deviceId: z.string().min(1, { message: '设备 ID 不能为空' }),

  /**
   * 操作超时时间(毫秒),必须为正整数
   */
  timeout: z.number().int().positive({ message: '超时时间必须为正整数' }),

  /**
   * 重试次数,必须为非负整数
   */
  retryCount: z.number().int().nonnegative({ message: '重试次数必须为非负整数' }),

  /**
   * 轮询间隔(毫秒),默认值为 5000ms
   */
  pollingInterval: z.number().int().positive().default(5000),
});
