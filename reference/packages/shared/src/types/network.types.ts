/**
 * 网络配置类型定义
 *
 * 从 Zod schema 推断的 TypeScript 类型
 */

import type { z } from 'zod';
import type { networkConfigSchema, ipv4Schema } from '../schemas/network.schema.js';

/**
 * 网络配置类型
 */
export type NetworkConfig = z.infer<typeof networkConfigSchema>;

/**
 * IPv4 地址类型
 */
export type IPv4Address = z.infer<typeof ipv4Schema>;
