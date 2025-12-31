import pino, { type Logger, type Level } from 'pino';
import { type LoggerConfig, LogLevel, LOG_LEVEL_NAMES } from './types.js';

/**
 * Pino 日志级别映射
 */
const PINO_LEVEL_MAPPING: Record<LogLevel, Level> = {
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
};


/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: Required<Omit<LoggerConfig, 'writers' | 'formatter' | 'defaultTag'>> = {
  level: LogLevel.INFO,
  enableColors: true,
  timestampFormat: 'iso',
  includeStackTrace: false,
  stackTraceDepth: 3,
  customTimestampFormatter: (date: Date) => date.toISOString(),
};

/**
 * 基于 Pino 的结构化日志实现
 */
export class StructuredLogger {
  private pinoLogger: Logger;
  private config: LoggerConfig & typeof DEFAULT_CONFIG;
  private defaultTag?: string;
  private stats = {
    counts: {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
    },
    total: 0,
    startTime: new Date(),
    lastLogTime: undefined as Date | undefined,
  };

  constructor(config: LoggerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.defaultTag = config.defaultTag;

    // 创建 Pino 配置
    const pinoConfig: pino.LoggerOptions = {
      level: PINO_LEVEL_MAPPING[this.config.level],
      timestamp: false, // 禁用 pino 默认时间戳，完全由 logData 控制
      formatters: {
        level: (label) => ({
          level: label.toUpperCase(),
        }),
      },
      base: undefined,    // 移除 pid, hostname, name 等默认字段
      // 在开发环境使用 pretty transport
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: this.config.enableColors,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{tag} {msg}',
        },
      } : undefined,
    };

    // 添加自定义序列化器
    if (config.includeStackTrace) {
      pinoConfig.serializers = {
        error: pino.stdSerializers.err,
      };
    }

    this.pinoLogger = pino(pinoConfig);
  }

  /**
   * 记录 DEBUG 级别日志
   */
  debug(message: string, metadata?: Record<string, unknown>, tag?: string): void {
    this.log(LogLevel.DEBUG, message, metadata, tag);
  }

  /**
   * 记录 INFO 级别日志
   */
  info(message: string, metadata?: Record<string, unknown>, tag?: string): void {
    this.log(LogLevel.INFO, message, metadata, tag);
  }

  /**
   * 记录 WARN 级别日志
   */
  warn(message: string, metadata?: Record<string, unknown>, tag?: string): void {
    this.log(LogLevel.WARN, message, metadata, tag);
  }

  /**
   * 记录 ERROR 级别日志
   */
  error(message: string, error?: Error | Record<string, unknown>, tag?: string): void {
    let metadata: Record<string, unknown> = {};

    if (error instanceof Error) {
      metadata = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      };
    } else if (typeof error === 'object' && error !== null) {
      metadata = { error };
    }

    this.log(LogLevel.ERROR, message, metadata, tag);
  }

  /**
   * 记录日志的通用方法
   */
  private log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}, tag?: string): void {
    if (level < this.config.level) {
      return;
    }

    // 更新统计信息
    this.stats.counts[level]++;
    this.stats.total++;
    this.stats.lastLogTime = new Date();

    // 准备日志数据
    const now = new Date();
    // 简单的本地时间格式化 YYYY-MM-DD HH:mm:ss
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const logData: Record<string, unknown> = {
      ...metadata,
      timestamp: timeStr,
    };

    // 添加调用栈信息（如果启用）
    if (this.config.includeStackTrace && level >= LogLevel.ERROR) {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const relevantLines = lines.slice(3, 3 + this.config.stackTraceDepth);
        logData.stackTrace = relevantLines;
      }
    }

    // 使用 Pino 记录日志
    const pinoLevel = PINO_LEVEL_MAPPING[level];
    this.pinoLogger[pinoLevel](logData, message);
  }

  /**
   * 创建带有默认上下文的子 logger
   */
  child(context: Record<string, unknown>, tag?: string): StructuredLogger {
    const childConfig: LoggerConfig = {
      ...this.config,
      defaultTag: tag || this.defaultTag,
    };

    const childLogger = new StructuredLogger(childConfig);
    childLogger.pinoLogger = this.pinoLogger.child(context);

    return childLogger;
  }

  /**
   * 获取日志统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats.counts = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
    };
    this.stats.total = 0;
    this.stats.startTime = new Date();
    this.stats.lastLogTime = undefined;
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.pinoLogger.level = PINO_LEVEL_MAPPING[level];
  }


  /**
   * 获取原始 Pino Logger 实例（用于高级配置）
   */
  getRawLogger(): Logger {
    return this.pinoLogger;
  }
}

/**
 * 创建默认的日志实例
 */
export const logger = new StructuredLogger({
  level: LogLevel.INFO,
  enableColors: process.env.NODE_ENV !== 'production',
  timestampFormat: 'iso',
  defaultTag: 'App',
});

/**
 * 创建带有模块上下文的日志实例
 */
export function createModuleLogger(moduleName: string): StructuredLogger {
  return logger.child({ module: moduleName }, moduleName);
}

/**
 * 导出日志级别枚举（方便外部使用）
 */
export { LogLevel, LOG_LEVEL_NAMES };

/**
 * 导出类型定义
 */
export type { LoggerConfig, LogEntry, LogFormatter, LogWriter, LogStats, FileWriterConfig } from './types.js';
