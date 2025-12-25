/**
 * API 响应类型定义
 *
 * 从 Zod schema 推断的 TypeScript 类型
 */

import type { z } from 'zod';
import type {
  apiSuccessResponseSchema,
  apiErrorResponseSchema,
} from '../schemas/api-response.schema.js';

/**
 * API 成功响应类型
 */
export type ApiSuccessResponse<T = unknown> = Omit<z.infer<typeof apiSuccessResponseSchema>, 'data'> & {
  data: T;
};

/**
 * API 错误响应类型
 */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * API 响应联合类型
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
