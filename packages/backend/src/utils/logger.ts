/**
 * Pino 日志配置
 *
 * 提供结构化日志记录，开发环境使用 pino-pretty 格式化输出
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * 应用程序日志记录器实例
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
