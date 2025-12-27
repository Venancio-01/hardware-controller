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
import type { CoreStatus } from './ipc.js';

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

/**
 * Core 进程状态响应
 * 用于 GET /api/system/core/status 接口响应
 */
export interface CoreStatusResponse {
  /** Core 进程当前状态 */
  status: CoreStatus;
  /** 运行时间（毫秒），仅在 Running 状态时有值 */
  uptime: number | null;
  /** 最后一个错误信息 */
  lastError: string | null;
}
