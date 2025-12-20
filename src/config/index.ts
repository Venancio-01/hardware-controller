import { z } from 'zod'

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
  VOICE_BROADCAST_HOST: z
    .string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^localhost$/, 'Invalid IP address format')
    .default('192.168.1.103'),

  VOICE_BROADCAST_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(65535))
    .default(50000),

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
        host: config.VOICE_BROADCAST_HOST,
        port: config.VOICE_BROADCAST_PORT,
      },
      timeout: config.HARDWARE_TIMEOUT,
      retryAttempts: config.HARDWARE_RETRY_ATTEMPTS,
      udpLocalPort: config.UDP_LOCAL_PORT,
      queryInterval: config.QUERY_INTERVAL,
    },
    logging: {
      level: config.LOG_LEVEL,
      pretty: config.LOG_PRETTY,
    },

  }
}

export { envSchema, clientConfigSchema }
