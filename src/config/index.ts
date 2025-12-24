import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
}

if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

/**
 * 客户端连接配置 Schema
 * 定义单个客户端的连接参数
 */
const clientConfigSchema = z.object({
  /** 客户端唯一标识符 */
  id: z.string().min(1, 'Client ID is required'),
  /** 客户端本地监听端口 */
  port: z.number().int().positive().min(1000).max(65535),
  /** 目标服务器IP地址 */
  targetHost: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format'),
  /** 目标服务器端口 */
  targetPort: z.number().int().positive().min(1).max(65535),
  /** 客户端描述（可选） */
  description: z.string().optional(),
})

/**
 * 环境变量 Schema 定义
 * 定义了所有需要的环境变量及其类型约束
 */
const envSchema = z.object({
  // 应用基础配置
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // 服务器配置
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1000).max(65535))
    .default(3000),

  HOST: z
    .string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
    .default('127.0.0.1'),

  // 日志配置
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  LOG_PRETTY: z
    .string()
    .transform((val) => ['true', 'yes', '1', 'on'].includes(val.toLowerCase()))
    .pipe(z.boolean())
    .default(true),

  // 硬件通信配置 - 柜体端与控制端
  CABINET_TARGET_HOST: z
    .string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
    .default('192.168.1.101'),

  CABINET_TARGET_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(65535))
    .default(8000),

  CONTROL_TARGET_HOST: z
    .string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
    .default('192.168.1.102'),

  CONTROL_TARGET_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(65535))
    .default(8000),

  // 语音播报模块配置
  VOICE_BROADCAST_CABINET_HOST: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
      .optional()
  ),

  VOICE_BROADCAST_CABINET_PORT: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive().min(1).max(65535))
      .optional()
  ),

  VOICE_BROADCAST_CABINET_VOLUME: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(10))
    .default(10),

  VOICE_BROADCAST_CABINET_SPEED: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(10))
    .default(5),

  VOICE_BROADCAST_CONTROL_HOST: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
      .optional()
  ),

  VOICE_BROADCAST_CONTROL_PORT: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive().min(1).max(65535))
      .optional()
  ),

  VOICE_BROADCAST_CONTROL_VOLUME: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(10))
    .default(10),

  VOICE_BROADCAST_CONTROL_SPEED: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(10))
    .default(5),

  // 全局硬件配置（保持向后兼容）
  HARDWARE_TIMEOUT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1000).max(60000))
    .default(5000),

  HARDWARE_RETRY_ATTEMPTS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(10))
    .default(3),

  UDP_LOCAL_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1000).max(65535))
    .default(8000),

  QUERY_INTERVAL: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(100).max(60000))
    .default(1000),

  // 柜门状态监控配置（秒为单位）
  DOOR_OPEN_TIMEOUT_S: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1))
    .default(30),

  // 硬件输入索引配置 (0-15)
  APPLY_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(0),

  CABINET_DOOR_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(1),

  ELECTRIC_LOCK_IN_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(2),

  MECHANICAL_LOCK_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(3),

  VIBRATION_ALARM_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(4),

  SWITCH_06_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(5),

  DEVICE_STATUS_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(6),

  CABINET_ALARM_LIGHT_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(7),

  CONTROL_ALARM_LIGHT_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(8),

  ELECTRIC_LOCK_OUT_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(9),

  ALARM_STATUS_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(10),

  AUTH_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(11),

  AUTH_CANCEL_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(12),

  SWITCH_26_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(13),

  SWITCH_27_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(14),

  SWITCH_28_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0).max(15))
    .default(15),

  // 硬件继电器索引配置 (1-32)
  RELAY_LOCK_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(32))
    .default(2),

  RELAY_CABINET_ALARM_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(32))
    .default(8),

  RELAY_CONTROL_ALARM_INDEX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(32))
    .default(1),
})

/**
 * 客户端配置类型推断
 */
export type ClientConfig = z.infer<typeof clientConfigSchema>

/**
 * 环境变量类型推断
 */
export type Env = z.infer<typeof envSchema>

/**
 * 验证并解析环境变量
 * 如果验证失败，程序会立即退出（Fail-fast 原则）
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        const message = issue.message || 'Validation failed'
        console.error(`  ${path}: ${message}`)
      })
      console.error('\nPlease check your .env file and fix the errors above.')
      process.exit(1)
    }
    console.error('❌ Configuration validation failed:', error)
    process.exit(1)
  }
}

/**
 * 导出验证后的配置对象
 * 这是应用中唯一的配置来源
 */
export const config = validateEnv()

/**
 * 配置对象类型守卫
 * 用于运行时检查配置是否正确加载
 */
export function isConfigLoaded(): boolean {
  return config !== null && typeof config === 'object'
}

/**
 * 获取配置摘要（用于日志输出）
 * 不包含敏感信息
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    environment: config.NODE_ENV,
    server: {
      host: config.HOST,
      port: config.PORT,
    },
    hardware: {
      cabinet: {
        host: config.CABINET_TARGET_HOST,
        port: config.CABINET_TARGET_PORT,
      },
      control: {
        host: config.CONTROL_TARGET_HOST,
        port: config.CONTROL_TARGET_PORT,
      },
      voiceBroadcast: {
        cabinet: {
          host: config.VOICE_BROADCAST_CABINET_HOST,
          port: config.VOICE_BROADCAST_CABINET_PORT,
          volume: config.VOICE_BROADCAST_CABINET_VOLUME,
          speed: config.VOICE_BROADCAST_CABINET_SPEED,
        },
        control: {
          host: config.VOICE_BROADCAST_CONTROL_HOST,
          port: config.VOICE_BROADCAST_CONTROL_PORT,
          volume: config.VOICE_BROADCAST_CONTROL_VOLUME,
          speed: config.VOICE_BROADCAST_CONTROL_SPEED,
        },
      },
      timeout: config.HARDWARE_TIMEOUT,
      retryAttempts: config.HARDWARE_RETRY_ATTEMPTS,
      udpLocalPort: config.UDP_LOCAL_PORT,
      queryInterval: config.QUERY_INTERVAL,
      doorOpenTimeout: config.DOOR_OPEN_TIMEOUT_S,
      inputs: {
        apply: config.APPLY_INDEX,
        cabinetDoor: config.CABINET_DOOR_INDEX,
        electricLockIn: config.ELECTRIC_LOCK_IN_INDEX,
        mechanicalLock: config.MECHANICAL_LOCK_INDEX,
        vibrationAlarm: config.VIBRATION_ALARM_INDEX,
        switch06: config.SWITCH_06_INDEX,
        deviceStatus: config.DEVICE_STATUS_INDEX,
        cabinetAlarmLight: config.CABINET_ALARM_LIGHT_INDEX,
        controlAlarmLight: config.CONTROL_ALARM_LIGHT_INDEX,
        electricLockOut: config.ELECTRIC_LOCK_OUT_INDEX,
        alarmStatus: config.ALARM_STATUS_INDEX,
        auth: config.AUTH_INDEX,
        authCancel: config.AUTH_CANCEL_INDEX,
        switch26: config.SWITCH_26_INDEX,
        switch27: config.SWITCH_27_INDEX,
        switch28: config.SWITCH_28_INDEX,
      },
      relays: {
        lock: config.RELAY_LOCK_INDEX,
        cabinetAlarm: config.RELAY_CABINET_ALARM_INDEX,
        controlAlarm: config.RELAY_CONTROL_ALARM_INDEX,
      },
    },
    logging: {
      level: config.LOG_LEVEL,
      pretty: config.LOG_PRETTY,
    },

  }
}

export { envSchema, clientConfigSchema }
