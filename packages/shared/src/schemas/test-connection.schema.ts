/**
 * 连接测试验证 Schema
 *
 * 定义连接测试请求和响应的 Zod 验证模式
 */

import { z } from 'zod';

/**
 * 连接测试请求 Schema
 *
 * 定义测试连接所需的参数
 */
export const testConnectionRequestSchema = z.object({
  /**
   * 目标 IP 地址
   * 必须是有效的 IPv4 地址 (每段 0-255)
   */
  ipAddress: z.string().refine((val) => {
    // 检查基本格式
    const regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!regex.test(val)) return false;

    // 检查每个八位组的范围 (0-255)
    const octets = val.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }, {
    message: 'IP 地址格式无效或超出范围 (每段必须为 0-255)',
  }),

  /**
   * 目标端口号
   */
  port: z.number()
    .int({ message: '端口号必须是整数' })
    .min(1, { message: '端口号必须大于 0' })
    .max(65535, { message: '端口号不能超过 65535' }),

  /**
   * 协议类型 (可选)
   * 默认为 tcp
   */
  protocol: z.enum(['tcp', 'udp']).optional().default('tcp'),

  /**
   * 超时时间 (可选)
   * 单位：毫秒，默认 5000ms
   */
  timeout: z.number()
    .int({ message: '超时时间必须是整数' })
    .min(100, { message: '超时时间不能少于 100 毫秒' })
    .max(30000, { message: '超时时间不能超过 30000 毫秒' })
    .optional()
    .default(5000),
});

/**
 * 连接测试结果 Schema
 *
 * 定义连接测试的响应格式
 */
export const testConnectionResultSchema = z.object({
  /**
   * 测试是否成功
   */
  success: z.boolean(),

  /**
   * 延迟时间 (可选)
   * 单位：毫秒
   */
  latency: z.number().optional(),

  /**
   * 错误信息 (可选)
   * 仅在测试失败时提供
   */
  error: z.string().optional(),

  /**
   * 测试目标
   * 格式：IP:PORT
   */
  target: z.string(),
});

/**
 * 连接测试类型定义
 */
export type TestConnectionRequest = z.infer<typeof testConnectionRequestSchema>;
export type TestConnectionResult = z.infer<typeof testConnectionResultSchema>;