/**
 * 冲突检测相关验证模式
 *
 * 定义与网络配置冲突检测相关的 Zod 验证模式
 */

import { z } from 'zod';
import { configSchema } from './config.schema.js';
import { ConflictCheckType } from '../types/conflict-detection.types.js';

// 冲突检测类型枚举的 Zod 模式
const conflictCheckTypeSchema = z.enum(['ip', 'port', 'network', 'all']);

// 冲突检测请求参数模式
export const conflictDetectionRequestSchema = z.object({
  config: configSchema,
  checkTypes: z.array(conflictCheckTypeSchema).optional(),
  timeout: z.number().min(1).max(30000).optional().default(5000), // 1ms to 30s timeout
});

// 冲突检测结果模式
export const conflictDetectionResultSchema = z.object({
  success: z.boolean(),
  passedChecks: z.array(conflictCheckTypeSchema).optional(),
  failedChecks: z
    .array(
      z.object({
        type: conflictCheckTypeSchema,
        error: z.string(),
      })
    )
    .optional(),
  totalLatency: z.number().optional(),
  details: z
    .array(
      z.object({
        type: conflictCheckTypeSchema,
        success: z.boolean(),
        error: z.string().optional(),
        latency: z.number().optional(),
        info: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
});

// 类型推断
export type ConflictDetectionRequest = z.infer<typeof conflictDetectionRequestSchema>;
export type ConflictDetectionResult = z.infer<typeof conflictDetectionResultSchema>;