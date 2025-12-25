/**
 * 配置类型定义
 *
 * 从 Zod schema 推断的 TypeScript 类型
 */

import type { z } from 'zod';
import type { configSchema } from '../schemas/config.schema.js';

/**
 * 应用程序配置类型
 */
export type Config = z.infer<typeof configSchema>;
