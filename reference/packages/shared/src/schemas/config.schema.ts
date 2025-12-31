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
  { message: 'IP 地址格式无效，请输入有效的 IP 地址或 localhost' }
);

/**
 * 与 .env.example 对齐的配置 Schema
 */
export const envConfigSchema = z.object({
  // 应用基础配置
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  // 服务器配置
  PORT: z.number().int({ message: '端口必须是整数' }).positive({ message: '端口必须大于 0' }).min(1000, { message: '端口不能小于 1000' }).max(65535, { message: '端口不能大于 65535' }).optional().default(3000),
  HOST: ipOrLocalhostSchema.optional().default('127.0.0.1'),

  // 日志配置
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional().default('info'),
  LOG_PRETTY: z.boolean().optional().default(true),

  // 硬件通信配置 - 柜体端 (TCP)
  CABINET_HOST: ipOrLocalhostSchema.optional().default('192.168.1.101'),
  CABINET_PORT: z.number().int({ message: '端口必须是整数' }).positive({ message: '端口必须大于 0' }).min(1, { message: '端口不能小于 1' }).max(65535, { message: '端口不能大于 65535' }).optional().default(50000),

  // 硬件通信配置 - 控制端 (Serial)
  CONTROL_SERIAL_PATH: z.string().min(1, { message: '串口路径不能为空' }).optional().default('/dev/ttyUSB0'),
  CONTROL_SERIAL_BAUDRATE: z.number().int({ message: '波特率必须是整数' }).positive({ message: '波特率必须大于 0' }).optional().default(9600),
  CONTROL_SERIAL_DATABITS: z.number().int({ message: '数据位必须是整数' }).min(5, { message: '数据位不能小于 5' }).max(8, { message: '数据位不能大于 8' }).optional().default(8),
  CONTROL_SERIAL_STOPBITS: z.number().int({ message: '停止位必须是整数' }).min(1, { message: '停止位不能小于 1' }).max(2, { message: '停止位不能大于 2' }).optional().default(1),
  CONTROL_SERIAL_PARITY: z.enum(['none', 'even', 'mark', 'odd', 'space']).optional().default('none'),

  // 语音播报配置
  VOICE_CABINET_VOLUME: z.number().int({ message: '音量必须是整数' }).min(0, { message: '音量不能小于 0' }).max(10, { message: '音量不能大于 10' }).optional().default(10),
  VOICE_CABINET_SPEED: z.number().int({ message: '语速必须是整数' }).min(0, { message: '语速不能小于 0' }).max(10, { message: '语速不能大于 10' }).optional().default(5),
  VOICE_CONTROL_VOLUME: z.number().int({ message: '音量必须是整数' }).min(0, { message: '音量不能小于 0' }).max(10, { message: '音量不能大于 10' }).optional().default(10),
  VOICE_CONTROL_SPEED: z.number().int({ message: '语速必须是整数' }).min(0, { message: '语速不能小于 0' }).max(10, { message: '语速不能大于 10' }).optional().default(5),

  // 全局硬件配置
  HARDWARE_TIMEOUT: z.number().int({ message: '超时时间必须是整数' }).positive({ message: '超时时间必须为正整数' }).min(1000, { message: '超时时间不能少于 1000 毫秒' }).max(60000, { message: '超时时间不能超过 60000 毫秒' }).optional().default(5000),
  HARDWARE_RETRY_ATTEMPTS: z.number().int({ message: '重试次数必须是整数' }).min(0, { message: '重试次数不能小于 0' }).max(10, { message: '重试次数不能大于 10' }).optional().default(3),

  // 功能开关
  ENABLE_HARDWARE_SIMULATOR: z.boolean().optional().default(false),
  ENABLE_METRICS: z.boolean().optional().default(true),

  // 新增配置
  UDP_LOCAL_PORT: z.number().int({ message: 'UDP 端口必须是整数' }).min(1000, { message: 'UDP 端口不能小于 1000' }).max(65535, { message: 'UDP 端口不能大于 65535' }).optional().default(8000),
  QUERY_INTERVAL: z.number().int({ message: '查询间隔必须是整数' }).min(100, { message: '查询间隔不能少于 100 毫秒' }).max(60000, { message: '查询间隔不能超过 60000 毫秒' }).optional().default(1000),
  DOOR_OPEN_TIMEOUT_S: z.number().int({ message: '开门超时时间必须是整数' }).positive({ message: '开门超时时间必须为正整数' }).min(1, { message: '开门超时时间不能少于 1 秒' }).optional().default(30),
  VIBRATION_THROTTLE_INTERVAL_MS: z.number().int({ message: '振动节流间隔必须是整数' }).positive({ message: '振动节流间隔必须为正整数' }).min(100, { message: '振动节流间隔不能少于 100 毫秒' }).max(60000, { message: '振动节流间隔不能超过 60000 毫秒' }).optional().default(5000),
  AUTH_RETRY_INTERVAL_S: z.number().int({ message: '授权重试间隔必须是整数' }).positive({ message: '授权重试间隔必须为正整数' }).min(5, { message: '授权重试间隔不能少于 5 秒' }).max(300, { message: '授权重试间隔不能超过 300 秒（5 分钟）' }).optional().default(30),

  // 硬件输入索引配置 (0-15)
  // 存放柜输入 (0-7)
  APPLY_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(0),
  CABINET_DOOR_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(1),
  DOOR_LOCK_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(2),
  KEY_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(3),
  VIBRATION_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(4),
  // 控制柜输入 (8-15)
  ALARM_CANCEL_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(10),
  AUTH_CANCEL_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(11),
  AUTH_PASS_SWITCH_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(15, { message: '索引不能大于 15' }).optional().default(12),

  // 传感器状态反转配置
  // true: 闭合状态为报警状态，断开状态为正常状态
  // false: 断开状态为报警状态，闭合状态为正常状态
  INVERT_SENSOR_STATE: z.boolean().optional().default(false),

  // 硬件继电器索引配置 (0-31 for relay channel)
  APPLY_LIGHT_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(0),
  DOOR_LOCK_SWITCH_LIGHT_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(2),
  ALARM_LIGHT_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(8),
  CONTROL_ALARM_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(1),
  DOOR_LOCK_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(1),
  CABINET_DOOR_RELAY_INDEX: z.number().int({ message: '索引必须是整数' }).min(0, { message: '索引不能小于 0' }).max(31, { message: '索引不能大于 31' }).optional().default(2),
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
 * 包含应用程序配置和环境配置
 * 注意：网络配置（ipAddress、subnetMask、gateway）已移除，
 *       现在通过 nmcli 直接修改系统网络配置，不再保存到 config.json
 */
export const configSchema = appConfigSchema
  .merge(envConfigSchema);
