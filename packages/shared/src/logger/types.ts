/**
 * 日志级别枚举
 * 从低到高：debug < info < warn < error
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志级别名称映射
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * 日志级别颜色映射（用于控制台输出）
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // 青色
  [LogLevel.INFO]: '\x1b[32m',  // 绿色
  [LogLevel.WARN]: '\x1b[33m',  // 黄色
  [LogLevel.ERROR]: '\x1b[31m', // 红色
};

/**
 * 重置颜色代码
 */
export const RESET_COLOR = '\x1b[0m';

/**
 * 日志条目接口
 */
export interface LogEntry {
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 时间戳 */
  timestamp: Date;
  /** 可选的标签 */
  tag?: string;
  /** 额外的元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  /** 格式化日志条目 */
  format(entry: LogEntry): string;
}

/**
 * 日志输出器接口
 */
export interface LogWriter {
  /** 写入日志条目 */
  write(entry: LogEntry, formatted: string): Promise<void> | void;
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 最小日志级别 */
  level?: LogLevel;
  /** 是否启用颜色输出 */
  enableColors?: boolean;
  /** 时间戳格式 */
  timestampFormat?: 'iso' | 'unix' | 'custom';
  /** 自定义时间戳格式化函数 */
  customTimestampFormatter?: (date: Date) => string;
  /** 默认标签 */
  defaultTag?: string;
  /** 日志输出器列表 */
  writers?: LogWriter[];
  /** 日志格式化器 */
  formatter?: LogFormatter;
  /** 是否包含调用栈信息 */
  includeStackTrace?: boolean;
  /** 调用栈深度 */
  stackTraceDepth?: number;
}

/**
 * 文件日志写入器配置
 */
export interface FileWriterConfig {
  /** 文件路径 */
  filePath: string;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 是否启用日志轮转 */
  enableRotation?: boolean;
  /** 日志轮转时间模式：'daily' | 'hourly' | 'size' */
  rotationMode?: 'daily' | 'hourly' | 'size';
}

/**
 * 日志统计信息
 */
export interface LogStats {
  /** 各级别日志数量 */
  counts: Record<LogLevel, number>;
  /** 总日志数量 */
  total: number;
  /** 开始时间 */
  startTime: Date;
  /** 最后一次日志时间 */
  lastLogTime?: Date;
}
