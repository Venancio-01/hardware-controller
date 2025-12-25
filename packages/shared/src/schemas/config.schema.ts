/**
 * 配置验证 Schema
 *
 * 定义应用程序配置的 Zod 验证模式
 */

import { z } from 'zod';
import { networkConfigSchema } from './network.schema.js';

/**
 * 应用程序配置 Schema
 *
 * 包含设备 ID、超时、重试次数和轮询间隔等配置
 */
export const appConfigSchema = z.object({
  /**
   * 设备唯一标识符
   */
  deviceId: z.string()
    .min(1, { message: '设备 ID 不能为空' })
    .max(50, { message: '设备ID长度不能超过50字符' }),

  /**
   * 操作超时时间(毫秒),必须为正整数
   */
  timeout: z.number()
    .int({ message: '超时时间必须是整数' })
    .min(1000, { message: '超时时间不能少于1000毫秒' })
    .max(30000, { message: '超时时间不能超过30000毫秒' }),

  /**
   * 重试次数,必须为非负整数
   */
  retryCount: z.number()
    .int({ message: '重试次数必须是整数' })
    .min(0, { message: '重试次数不能为负数' })
    .max(10, { message: '重试次数不能超过10次' }),

  /**
   * 轮询间隔(毫秒),默认值为 5000ms
   */
  pollingInterval: z.number()
    .int({ message: '轮询间隔必须是整数' })
    .min(1000, { message: '轮询间隔不能少于1000毫秒' })
    .max(60000, { message: '轮询间隔不能超过60000毫秒' })
    .default(5000),
});

/**
 * 完整配置 Schema
 *
 * 包含应用程序配置和网络配置
 */
export const configSchema = appConfigSchema.merge(networkConfigSchema);
