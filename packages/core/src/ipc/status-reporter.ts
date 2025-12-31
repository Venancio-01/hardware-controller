/**
 * Core Status Reporter - 向 Backend 发送状态消息
 * @module ipc/status-reporter
 */
import type { CoreStatus, StatusPayload } from 'shared';
import { IpcMessages, createModuleLogger } from 'shared';

const logger = createModuleLogger('StatusReporter');
let startTime: number | null = null;

/**
 * 检查 IPC 通道是否可用
 */
function isIpcConnected(): boolean {
  return typeof process.send === 'function';
}

/**
 * 发送 IPC 消息给父进程
 */
function sendIpcMessage(type: string, payload?: unknown): boolean {
  if (!isIpcConnected()) {
    logger.warn(`IPC 不可用，无法发送消息: ${type}`);
    return false;
  }

  try {
    process.send!({ type, payload });
    logger.debug(`IPC 消息已发送: ${type}`);
    return true;
  } catch (error) {
    logger.error(`发送 IPC 消息失败: ${type}`, error as Error);
    return false;
  }
}

/**
 * 发送 CORE:READY 消息，表示 Core 已成功启动
 */
export function sendReady(): boolean {
  startTime = Date.now();
  logger.info('Core 进程已就绪，发送 CORE:READY 消息');
  return sendIpcMessage(IpcMessages.CORE.READY);
}

/**
 * 发送状态变更消息
 * @param status 当前状态
 * @param connections 硬件连接状态（可选）
 */
export function sendStatus(status: CoreStatus, lastError?: string, connections?: { cabinet: boolean; control: boolean }): boolean {
  const payload: StatusPayload = {
    status,
    uptime: startTime ? Date.now() - startTime : undefined,
    lastError,
    connections,
  };

  logger.info(`发送状态变更: ${status}`);
  return sendIpcMessage(IpcMessages.CORE.STATUS_CHANGE, payload);
}

/**
 * 发送错误消息
 * @param error 错误信息
 */
export function sendError(error: string): boolean {
  logger.error(`Core 发生错误: ${error}`);
  return sendIpcMessage(IpcMessages.CORE.ERROR, { error });
}

/**
 * 获取 Core 运行时间（毫秒）
 */
export function getUptime(): number | null {
  return startTime ? Date.now() - startTime : null;
}
