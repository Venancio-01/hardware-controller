export interface IpcPacket<T = unknown> {
  type: string;
  payload?: T;
  error?: string;
  correlationId?: string;
}

export const IpcMessages = {
  CORE: {
    READY: 'CORE:READY',
    ERROR: 'CORE:ERROR',
    STOPPED: 'CORE:STOPPED',
  },
  CMD: {
    UPDATE_CONFIG: 'CMD:UPDATE_CONFIG',
  },
} as const;

export type IpcMessageType = typeof IpcMessages;
