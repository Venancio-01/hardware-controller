/**
 * 设备状态类型定义
 *
 * 从 Zod schema 推断的 TypeScript 类型
 */

import type { z } from 'zod';
import type { deviceStatusSchema, portSchema, protocolSchema } from '../schemas/device.schema.js';

/**
 * 设备状态类型
 */
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

/**
 * 端口号类型
 */
export type Port = z.infer<typeof portSchema>;

/**
 * 协议类型
 */
export type Protocol = z.infer<typeof protocolSchema>;
