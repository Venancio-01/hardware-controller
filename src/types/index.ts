/**
 * 网络通信通用类型定义
 */

export interface NetworkConfig {
  host: string;
  port: number;
  timeout?: number;
  retries?: number;
}

export interface MessagePayload {
  data: Uint8Array | string;
  timestamp: number;
  id?: string;
}

export interface HardwareCommand {
  command: string;
  parameters?: Record<string, unknown>;
  expectResponse?: boolean;
  timeout?: number;
}

export interface HardwareResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type Protocol = 'udp' | 'tcp';

export interface CommunicationStats {
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastActivity?: number;
  [key: string]: number | undefined;
}