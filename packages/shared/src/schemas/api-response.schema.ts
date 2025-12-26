/**
 * API 响应包装验证 Schema
 *
 * 定义统一的 API 响应格式,包括成功响应和错误响应
 */

import { z } from 'zod';

/**
 * API 成功响应 Schema
 *
 * 用于包装成功的 API 响应数据
 * 注意: data 字段必须存在,可以是 unknown 类型或 null
 */
export const apiSuccessResponseSchema = z.object({
  /**
   * 成功标识,固定为 true
   */
  success: z.literal(true),

  /**
   * 响应数据,类型由具体使用场景确定
   */
  data: z.unknown(),

  /**
   * 可选的成功消息
   */
  message: z.string().optional(),
}).strict();

/**
 * API 错误响应 Schema
 *
 * 用于包装失败的 API 响应信息
 */
export const apiErrorResponseSchema = z.object({
  /**
   * 失败标识,固定为 false
   */
  success: z.literal(false),

  /**
   * 错误信息描述
   */
  error: z.string(),

  /**
   * 可选的错误代码
   */
  errorCode: z.string().optional(),

  /**
   * 可选的字段级验证错误
   *
   * 键为字段名,值为错误信息
   */
  validationErrors: z.record(z.string(), z.string()).optional(),
});

/**
 * API 响应联合类型 Schema
 *
 * 可用于同时验证成功和错误响应
 */
export const apiResponseSchema = z.union([apiSuccessResponseSchema, apiErrorResponseSchema]);
