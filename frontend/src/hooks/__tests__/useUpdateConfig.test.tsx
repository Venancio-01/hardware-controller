// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateConfig } from '../useUpdateConfig';
import { toast } from 'sonner';
import { apiFetch, restartCore } from '@/lib/api';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  restartCore: vi.fn(),
}));

// Mock global fetch for conflict detection
global.fetch = vi.fn() as any;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

describe('useUpdateConfig Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock fetch to return successful conflict detection result
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call conflict detection and save APIs on mutation', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    const mockConfig = {
      ipAddress: '127.0.0.1',
      subnetMask: '255.255.255.0',
      gateway: '127.0.0.1',
      port: 8080,
      deviceId: 'test',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
    };

    result.current.mutate(mockConfig as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证冲突检测 fetch 被调用
    expect(global.fetch).toHaveBeenCalledWith('/api/config/check-conflict', {
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        config: mockConfig,
        checkTypes: ['all'],
        timeout: 5000
      }),
    });

    // 验证配置保存 API 被调用
    expect(apiFetch).toHaveBeenCalledWith('/api/config', {
      method: 'PUT',
      body: JSON.stringify(mockConfig),
    });
  });

  it('should show restart confirm dialog when needsRestart is true', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    expect(result.current.showRestartConfirm).toBe(false);

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证重启确认对话框状态被设置为 true
    expect(result.current.showRestartConfirm).toBe(true);
  });

  it('should restart system when confirmRestart is called', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });
    vi.mocked(restartCore).mockResolvedValue({ success: true, message: '重启指令已发送' });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.showRestartConfirm).toBe(true));

    // 调用 confirmRestart
    await act(async () => {
      await result.current.confirmRestart();
    });

    // 验证 restartCore 被调用
    expect(restartCore).toHaveBeenCalled();

    // 验证成功 toast
    expect(toast.success).toHaveBeenCalledWith('重启指令已发送');

    // 验证对话框关闭
    expect(result.current.showRestartConfirm).toBe(false);
  });

  it('should close dialog when cancelRestart is called', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.showRestartConfirm).toBe(true));

    // 调用 cancelRestart
    act(() => {
      result.current.cancelRestart();
    });

    // 验证对话框关闭
    expect(result.current.showRestartConfirm).toBe(false);
    // 验证 restartCore 未被调用
    expect(restartCore).not.toHaveBeenCalled();
  });

  it('should show error toast when restart fails', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });
    vi.mocked(restartCore).mockRejectedValue(new Error('重启服务不可用'));

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.showRestartConfirm).toBe(true));

    // 调用 confirmRestart
    await act(async () => {
      await result.current.confirmRestart();
    });

    // 验证重启失败 toast
    expect(toast.error).toHaveBeenCalledWith('重启失败: 重启服务不可用');
  });

  it('should only show success toast when needsRestart is false', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: false });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.success).toHaveBeenCalledWith('配置已保存');
    expect(result.current.showRestartConfirm).toBe(false);
  });

  it('should show error toast on general failure', async () => {
    const errorMsg = "Validation failed";
    // 现在 defaultConflictDetection 使用 fetch,所以 mock fetch
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error(errorMsg));

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isError).toBe(true));

    // fetch 错误会被归类为"冲突检测服务不可用"
    expect(toast.error).toHaveBeenCalledWith(
      "冲突检测服务不可用",
      expect.objectContaining({
        description: errorMsg,
      })
    );
  });

  it('should handle conflict detection failure', async () => {
    // Mock fetch 返回冲突检测结果(success: false)
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        failedChecks: [
          { type: 'network', error: 'IP 地址冲突' }
        ]
      }),
    } as any);

    // apiFetch 不会被调用,因为冲突检测会失败
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: false });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith(
      "配置冲突检测失败",
      expect.objectContaining({
        description: 'IP 地址冲突'
      })
    );
  });

  it('should handle conflict detection service unavailable', async () => {
    // Mock fetch 抛出网络错误
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith(
      "冲突检测服务不可用",
      expect.objectContaining({
        description: 'Network error'
      })
    );
  });
});
