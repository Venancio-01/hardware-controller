/**
 * useCoreStatus Hook - 实时获取 Core 进程状态
 *
 * 通过 WebSocket 连接后端，订阅 Core 状态变更事件
 * 提供实时的 Core 进程运行状态、运行时间、错误信息等
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { CoreStatusResponse } from 'shared';

/**
 * 连接状态枚举
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * useCoreStatus Hook 返回值类型
 */
export interface UseCoreStatusResult {
  /** Core 进程状态 */
  status: CoreStatusResponse['status'] | null;
  /** 运行时间（毫秒） */
  uptime: number | null;
  /** 最后错误信息 */
  lastError: string | null;
  /** 连接错误信息 */
  connectionError: string | null;
  /** WebSocket 连接状态 */
  connectionStatus: ConnectionStatus;
  /** 是否已连接 */
  isConnected: boolean;
  /** 硬件连接状态 */
  connections?: {
    cabinet: boolean;
    control: boolean;
  };
}

/**
 * WebSocket 事件名称常量 (与 backend 保持一致)
 */
const WS_EVENTS = {
  CORE_STATUS_CHANGED: 'core:status_changed',
} as const;

/**
 * Core 状态 WebSocket Hook
 *
 * 建立 WebSocket 连接，订阅 Core 状态变更事件
 * 支持自动重连、JWT 认证、连接状态追踪
 *
 * @example
 * ```tsx
 * const { status, uptime, lastError, isConnected } = useCoreStatus();
 *
 * return (
 *   <div>
 *     <span>Core 状态: {status}</span>
 *     <span>连接: {isConnected ? '已连接' : '连接中...'}</span>
 *   </div>
 * );
 * ```
 */
export function useCoreStatus(): UseCoreStatusResult {
  const [status, setStatus] = useState<CoreStatusResponse['status'] | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const [connections, setConnections] = useState<{ cabinet: boolean; control: boolean } | undefined>(undefined);

  // 使用 ref 保存 socket 实例，避免重复创建
  const socketRef = useRef<Socket | null>(null);

  /**
   * 处理状态变更事件
   */
  const handleStatusChange = useCallback((payload: CoreStatusResponse) => {
    setStatus(payload.status);
    setUptime(payload.uptime);
    setLastError(payload.lastError);
    if (payload.connections) {
      setConnections(payload.connections);
    }
  }, []);

  useEffect(() => {
    // 获取 JWT Token
    const token = localStorage.getItem('token');

    // 创建 Socket.IO 连接
    const socket = io('/', {
      auth: {
        token: token || undefined,
      },
      // 自动重连配置 (Socket.IO 默认启用)
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // 允许无 token 时尝试连接 (后端可能禁用了认证)
      forceNew: false,
    });

    socketRef.current = socket;

    // 连接事件
    socket.on('connect', () => {
      setConnectionStatus('connected');
      setConnectionError(null);
    });

    // 断开连接事件
    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      // 如果是服务端主动断开，可能需要处理
      if (reason === 'io server disconnect') {
        // 服务端主动断开，可能需要重新认证
        console.warn('WebSocket 被服务端断开，可能需要重新登录');
      }
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);
      console.error('WebSocket 连接错误:', error.message);
    });

    // 重连中
    socket.io.on('reconnect_attempt', () => {
      setConnectionStatus('connecting');
    });

    // 重连成功
    socket.io.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    // 订阅 Core 状态变更事件
    socket.on(WS_EVENTS.CORE_STATUS_CHANGED, handleStatusChange);

    // 清理函数
    return () => {
      socket.off(WS_EVENTS.CORE_STATUS_CHANGED, handleStatusChange);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handleStatusChange]);

  return {
    status,
    uptime,
    lastError,
    connectionError,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    connections,
  };
}
