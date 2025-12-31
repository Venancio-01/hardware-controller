/**
 * Core Log Forwarder - 通过 IPC 转发日志到 Backend
 * @module ipc/log-forwarder
 */
import type { IpcLogLevel, LogPayload } from 'shared';
import { IpcMessages, createModuleLogger } from 'shared';

const localLogger = createModuleLogger('LogForwarder');

/**
 * 检查 IPC 通道是否可用
 */
function isIpcConnected(): boolean {
  return typeof process.send === 'function';
}

/**
 * 转发日志消息到 Backend
 * @param level 日志级别
 * @param message 日志消息
 * @param context 额外上下文数据（可选）
 */
export function forwardLog(
  level: IpcLogLevel,
  message: string,
  context?: Record<string, unknown>
): boolean {
  if (!isIpcConnected()) {
    // 如果 IPC 不可用，只使用本地日志
    return false;
  }

  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  try {
    process.send!({ type: IpcMessages.CORE.LOG, payload });
    return true;
  } catch (error) {
    // 避免递归日志转发
    localLogger.error(`转发日志失败: ${error}`);
    return false;
  }
}

/**
 * 创建一个包装的日志器，自动转发日志到 Backend
 * @param moduleName 模块名称
 */
export function createForwardingLogger(moduleName: string) {
  const baseLogger = createModuleLogger(moduleName);

  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      baseLogger.debug(message);
      forwardLog('debug', `[${moduleName}] ${message}`, context);
    },
    info: (message: string, context?: Record<string, unknown>) => {
      baseLogger.info(message);
      forwardLog('info', `[${moduleName}] ${message}`, context);
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      baseLogger.warn(message);
      forwardLog('warn', `[${moduleName}] ${message}`, context);
    },
    error: (message: string, error?: Error | Record<string, unknown>) => {
      if (error instanceof Error) {
        baseLogger.error(message, error);
        forwardLog('error', `[${moduleName}] ${message}: ${error.message}`, {
          stack: error.stack,
        });
      } else {
        baseLogger.error(message);
        forwardLog('error', `[${moduleName}] ${message}`, error);
      }
    },
  };
}
