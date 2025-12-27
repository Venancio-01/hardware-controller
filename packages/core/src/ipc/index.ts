/**
 * Core IPC Module - 导出所有 IPC 相关功能
 * @module ipc
 */

export {
  sendReady,
  sendStatus,
  sendError,
  getUptime,
} from './status-reporter.js';

export {
  forwardLog,
  createForwardingLogger,
} from './log-forwarder.js';
