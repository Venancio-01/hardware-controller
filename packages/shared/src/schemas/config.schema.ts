/**
 * 配置验证 Schema
 *
 * 定义应用程序配置的 Zod 验证模式
 */

import { z } from 'zod';
import { networkConfigSchema } from './network.schema.js';

/**
 * IP 或 localhost Schema
 * 用于服务器与硬件目标地址配置
 */
const ipOrLocalhostSchema = z.string().regex(
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/,
  { message: 'IP 地址格式无效' }
);

/**
 * 与 .env.example 对齐的配置 Schema
 */
export const envConfigSchema = z.object({
  // 应用基础配置
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  // 服务器配置
  PORT: z.number().int().positive().min(1000).max(65535).optional().default(3000),
  HOST: ipOrLocalhostSchema.optional().default('127.0.0.1'),

  // 日志配置
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional().default('info'),
  LOG_PRETTY: z.boolean().optional().default(true),

  // 硬件通信配置 - 柜体端 (TCP)
  CABINET_HOST: ipOrLocalhostSchema.optional().default('192.168.1.101'),
  CABINET_PORT: z.number().int().positive().min(1).max(65535).optional().default(50000),

  // 硬件通信配置 - 控制端 (Serial)
  CONTROL_SERIAL_PATH: z.string().min(1).optional().default('/dev/ttyUSB0'),
  CONTROL_SERIAL_BAUDRATE: z.number().int().positive().optional().default(9600),
  CONTROL_SERIAL_DATABITS: z.number().int().min(5).max(8).optional().default(8),
  CONTROL_SERIAL_STOPBITS: z.number().int().min(1).max(2).optional().default(1),
  CONTROL_SERIAL_PARITY: z.enum(['none', 'even', 'mark', 'odd', 'space']).optional().default('none'),

  // 语音播报配置
  VOICE_CABINET_VOLUME: z.number().int().min(0).max(10).optional().default(10),
  VOICE_CABINET_SPEED: z.number().int().min(0).max(10).optional().default(5),
  VOICE_CONTROL_VOLUME: z.number().int().min(0).max(10).optional().default(10),
  VOICE_CONTROL_SPEED: z.number().int().min(0).max(10).optional().default(5),

  // 全局硬件配置
  HARDWARE_TIMEOUT: z.number().int().positive().min(1000).max(60000).optional().default(5000),
  HARDWARE_RETRY_ATTEMPTS: z.number().int().min(0).max(10).optional().default(3),

  // 功能开关
  ENABLE_HARDWARE_SIMULATOR: z.boolean().optional().default(false),
  ENABLE_METRICS: z.boolean().optional().default(true),

  // 新增配置
  UDP_LOCAL_PORT: z.number().int().min(1000).max(65535).optional().default(8000),
  QUERY_INTERVAL: z.number().int().min(100).max(60000).optional().default(1000),
  DOOR_OPEN_TIMEOUT_S: z.number().int().positive().min(1).optional().default(30),

  // 硬件输入索引配置 (0-15)
  // 存放柜输入 (0-7)
  APPLY_INDEX: z.number().int().min(0).max(15).optional().default(0),
  CABINET_DOOR_INDEX: z.number().int().min(0).max(15).optional().default(1),
  DOOR_JUMP_SWITCH_INDEX: z.number().int().min(0).max(15).optional().default(2),
  KEY_SWITCH_INDEX: z.number().int().min(0).max(15).optional().default(3),
  VIBRATION_SWITCH_INDEX: z.number().int().min(0).max(15).optional().default(4),
  CABINET_INPUT_06_INDEX: z.number().int().min(0).max(15).optional().default(5),
  CABINET_INPUT_07_INDEX: z.number().int().min(0).max(15).optional().default(6),
  CABINET_INPUT_08_INDEX: z.number().int().min(0).max(15).optional().default(7),
  // 控制柜输入 (8-15)
  STORE_RETURN_INDEX: z.number().int().min(0).max(15).optional().default(8),
  CONTROL_INPUT_INDEX: z.number().int().min(0).max(15).optional().default(9),
  ALARM_CANCEL_INDEX: z.number().int().min(0).max(15).optional().default(10),
  AUTH_CANCEL_INDEX: z.number().int().min(0).max(15).optional().default(11),
  AUTH_PASS_INDEX: z.number().int().min(0).max(15).optional().default(12),

  // 硬件继电器索引配置 (1-32)
  RELAY_LOCK_INDEX: z.number().int().min(1).max(32).optional().default(2),
  RELAY_CABINET_ALARM_INDEX: z.number().int().min(1).max(32).optional().default(8),
  RELAY_CONTROL_ALARM_INDEX: z.number().int().min(1).max(32).optional().default(1),
});

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
export const configSchema = appConfigSchema
  .merge(networkConfigSchema)
  .merge(envConfigSchema);
