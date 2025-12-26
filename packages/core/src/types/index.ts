/**
 * 网络通信通用类型定义
 */

export interface NetworkConfig {
  host: string;
  port: number;
  timeout?: number;
  retries?: number;
  framing?: boolean; // Default true

  // 长连接配置
  heartbeatInterval?: number;  // 心跳间隔，默认30000ms
  heartbeatTimeout?: number;    // 心跳超时，默认5000ms
  reconnectDelay?: number;      // 重连延迟，默认5000ms
  heartbeatStrict?: boolean;    // 心跳超时是否断开连接，默认 true
}

export interface SerialConfig {
  path: string;
  baudRate: number;
  dataBits?: 8 | 7 | 6 | 5;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'mark' | 'odd' | 'space';
  autoOpen?: boolean;

  // 通用配置
  timeout?: number;
  retries?: number;
  reconnectDelay?: number;
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

export type Protocol = 'udp' | 'tcp' | 'serial';

/**
 * 命令编码类型
 * - 'hex': 十六进制字符串编码，适合硬件控制命令
 * - 'ascii': ASCII 编码，适合文本命令
 * - 'utf-8': UTF-8 编码，适合通用文本
 */
export type CommandEncoding = 'hex' | 'ascii' | 'utf-8';

export interface CommunicationStats {
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastActivity?: number;
  [key: string]: number | undefined;
}
