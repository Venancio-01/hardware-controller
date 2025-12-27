export interface IpcPacket<T = unknown> {
  type: string;
  payload?: T;
  error?: string;
  correlationId?: string;
}

/**
 * Core process status enum
 */
export type CoreStatus = 'Starting' | 'Running' | 'Stopped' | 'Error';

/**
 * Log levels for IPC log forwarding (string values for IPC serialization)
 */
export type IpcLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Payload for CORE:LOG IPC messages
 */
export interface LogPayload {
  level: IpcLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Payload for CORE:STATUS_CHANGE IPC messages
 */
export interface StatusPayload {
  status: CoreStatus;
  uptime?: number; // milliseconds since started
  lastError?: string;
}

export const IpcMessages = {
  CORE: {
    READY: 'CORE:READY',
    ERROR: 'CORE:ERROR',
    STOPPED: 'CORE:STOPPED',
    LOG: 'CORE:LOG',
    STATUS_CHANGE: 'CORE:STATUS_CHANGE',
  },
  CMD: {
    UPDATE_CONFIG: 'CMD:UPDATE_CONFIG',
  },
} as const;

export type IpcMessageType = typeof IpcMessages;
