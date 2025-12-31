/**
 * 设备状态验证 Schema
 *
 * 定义设备在线状态、IP 地址、端口和协议的验证模式
 */

import { z } from 'zod';
import { ipv4Schema } from './network.schema.js';

/**
 * 端口号 Schema
 *
 * 端口号必须在 1-65535 范围内
 */
export const portSchema = z.number().int({ message: '端口必须是整数' }).min(1, { message: '端口必须大于 0' }).max(65535, {
  message: '端口号必须在 1-65535 范围内',
});

/**
 * 协议类型 Schema
 *
 * 支持 UDP 和 TCP 两种协议
 */
export const protocolSchema = z.enum(['UDP', 'TCP']);

/**
 * 设备状态 Schema
 *
 * 包含在线状态、IP 地址、端口和协议类型
 */
export const deviceStatusSchema = z.object({
  /**
   * 设备在线状态
   */
  online: z.boolean(),

  /**
   * 设备当前 IP 地址
   */
  ipAddress: ipv4Schema,

  /**
   * 子网掩码
   */
  subnetMask: ipv4Schema.optional(),

  /**
   * 网关地址
   */
  gateway: ipv4Schema.optional(),

  /**
   * 设备当前端口号
   */
  port: portSchema,

  /**
   * 通信协议类型
   */
  protocol: protocolSchema,

  /**
   * 系统运行时间（秒）
   */
  uptime: z.number().min(0, { message: '运行时间不能为负数' }),
});
