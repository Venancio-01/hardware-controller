import pino, { type Logger, type Level } from 'pino';
import { LogLevel } from './types.js';

/**
 * 简化的 Pino 日志配置
 */
export interface SimpleLoggerConfig {
  /** 日志级别 */
  level?: LogLevel;
  /** 是否启用彩色输出 */
  pretty?: boolean;
  /** 输出目标文件 */
  file?: string;
  /** 服务名称 */
  service?: string;
  /** 环境名称 */
  environment?: string;
}

/**
 * 创建简化的 Pino Logger
 */
export function createPinoLogger(config: SimpleLoggerConfig = {}): Logger {
  const {
    level = LogLevel.INFO,
    pretty = process.env.NODE_ENV === 'development',
    file,
    service = 'node-switch',
    environment = process.env.NODE_ENV || 'development',
  } = config;

  // Pino 级别映射
  const levelMap: Record<LogLevel, Level> = {
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
  };

  const loggerConfig: pino.LoggerOptions = {
    level: levelMap[level],
    base: {
      pid: process.pid,
      hostname: require('os').hostname(),
      service,
      environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
  };

  // 配置输出
  if (pretty && !file) {
    // 开发环境使用 pretty 输出到控制台
    loggerConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss Z',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
      },
    };
  } else if (file) {
    // 输出到文件
    const destination = pino.destination({
      dest: file,
      sync: true,
    });
    return pino(loggerConfig, destination);
  }

  return pino(loggerConfig);
}

/**
 * 默认的 Pino Logger 实例
 */
export const pinoLogger = createPinoLogger({
  level: LogLevel.INFO,
  pretty: process.env.NODE_ENV === 'development',
  service: 'node-switch',
});

/**
 * 创建带有模块上下文的子 Logger
 */
export function createModulePinoLogger(moduleName: string): Logger {
  return pinoLogger.child({ module: moduleName });
}
