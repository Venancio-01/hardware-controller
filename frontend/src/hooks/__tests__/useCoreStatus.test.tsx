import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  io: {
    on: vi.fn(),
    off: vi.fn(),
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// 需要在 mock 之后导入
import { useCoreStatus } from '../useCoreStatus';
import { io } from 'socket.io-client';

describe('useCoreStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 模拟 localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-jwt-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with connecting status', () => {
    const { result } = renderHook(() => useCoreStatus());

    expect(result.current.connectionStatus).toBe('connecting');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBeNull();
    expect(result.current.uptime).toBeNull();
    expect(result.current.lastError).toBeNull();
    expect(result.current.connectionError).toBeNull();
  });

  it('should create socket connection with JWT token', () => {
    renderHook(() => useCoreStatus());

    expect(io).toHaveBeenCalledWith('/', {
      auth: { token: 'mock-jwt-token' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: false,
    });
  });

  it('should set connected status on connect event', async () => {
    const { result } = renderHook(() => useCoreStatus());

    // 获取 'connect' 事件的处理函数
    const connectCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connect'
    );
    expect(connectCall).toBeDefined();

    // 触发 connect 事件
    act(() => {
      connectCall![1]();
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should update status on core:status_changed event', async () => {
    const { result } = renderHook(() => useCoreStatus());

    // 获取 'core:status_changed' 事件的处理函数
    const statusChangeCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'core:status_changed'
    );
    expect(statusChangeCall).toBeDefined();

    // 触发状态变更事件
    act(() => {
      statusChangeCall![1]({
        status: 'Running',
        uptime: 60000,
        lastError: null,
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('Running');
      expect(result.current.uptime).toBe(60000);
      expect(result.current.lastError).toBeNull();
    });
  });

  it('should handle error status', async () => {
    const { result } = renderHook(() => useCoreStatus());

    const statusChangeCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'core:status_changed'
    );

    act(() => {
      statusChangeCall![1]({
        status: 'Error',
        uptime: null,
        lastError: '进程崩溃',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('Error');
      expect(result.current.uptime).toBeNull();
      expect(result.current.lastError).toBe('进程崩溃');
    });
  });

  it('should set disconnected status on disconnect event', async () => {
    const { result } = renderHook(() => useCoreStatus());

    // 先连接
    const connectCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connect'
    );
    act(() => {
      connectCall![1]();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // 然后断开
    const disconnectCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'disconnect'
    );
    act(() => {
      disconnectCall![1]('io client disconnect');
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should set error status on connect_error event', async () => {
    const { result } = renderHook(() => useCoreStatus());

    const connectErrorCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connect_error'
    );

    act(() => {
      connectErrorCall![1](new Error('Connection refused'));
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('error');
      expect(result.current.connectionError).toBe('Connection refused');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useCoreStatus());

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('core:status_changed', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error');
    expect(mockSocket.io.off).toHaveBeenCalledWith('reconnect_attempt');
    expect(mockSocket.io.off).toHaveBeenCalledWith('reconnect');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should set connecting status on reconnect attempt', async () => {
    const { result } = renderHook(() => useCoreStatus());

    // 先断开
    const disconnectCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'disconnect'
    );
    act(() => {
      disconnectCall![1]('transport close');
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    // 触发重连尝试
    const reconnectAttemptCall = mockSocket.io.on.mock.calls.find(
      (call) => call[0] === 'reconnect_attempt'
    );
    act(() => {
      reconnectAttemptCall![1]();
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connecting');
    });
  });
});
