/**
 * 环境变量类型声明
 * 扩展 NodeJS.ProcessEnv 接口以获得更好的类型提示
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // 应用基础配置
      NODE_ENV: 'development' | 'production' | 'test'

      // 服务器配置
      PORT: string
      HOST: string

      // 日志配置
      LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
      LOG_PRETTY: string

      // 硬件通信配置
      HARDWARE_UDP_PORT: string
      HARDWARE_TCP_PORT: string
      HARDWARE_TIMEOUT: string
      HARDWARE_RETRY_ATTEMPTS: string

    }
  }
}

export { }
