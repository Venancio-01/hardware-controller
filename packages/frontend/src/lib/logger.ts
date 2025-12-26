import pino from 'pino';

/**
 * 前端日志配置
 * 使用 Pino 结构化日志
 */

// 浏览器日志级别配置
const isDevelopment = import.meta.env.DEV;
const logLevel = isDevelopment ? 'debug' : 'info';

/**
 * Pino 浏览器日志实例
 */
export const logger = pino({
  level: logLevel,
  browser: {
    // 在开发环境使用漂亮的格式化输出
    asObject: true,
    transmit: {
      // 生产环境可以发送到远程日志服务
      level: 'warn',
      send: (level, logEvent) => {
        // TODO: 实现远程日志发送
        if (isDevelopment) {
          console[level](logEvent);
        }
      }
    }
  },
  // 自定义时间格式
  timestamp: pino.stdTimeFunctions.isoTime,
  // 添加错误堆栈跟踪
  serializers: {
    error: pino.stdSerializers.err
  }
});

/**
 * 便捷的日志方法
 */
export const log = {
  debug: (msg: string, ...args: any[]) => logger.debug(args, msg),
  info: (msg: string, ...args: any[]) => logger.info(args, msg),
  warn: (msg: string, ...args: any[]) => logger.warn(args, msg),
  error: (msg: string, ...args: any[]) => logger.error(args, msg)
};
