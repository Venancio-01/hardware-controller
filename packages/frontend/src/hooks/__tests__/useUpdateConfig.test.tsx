// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateConfig } from '../useUpdateConfig';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

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
  });

  it('should call apiFetch with correct arguments on mutation', async () => {
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

    result.current.mutate(mockConfig);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiFetch).toHaveBeenCalledWith('/api/config', {
      method: 'PUT',
      body: JSON.stringify(mockConfig),
    });
  });

  it('should show success toast and set needsRestart on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, needsRestart: true });

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    expect(result.current.needsRestart).toBe(false);

    result.current.mutate({ deviceId: 'test' } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.success).toHaveBeenCalledWith("配置已保存", expect.any(Object));
    expect(result.current.needsRestart).toBe(true);
  });

  it('should show error toast on failure', async () => {
    const errorMsg = "Validation failed";
    vi.mocked(apiFetch).mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useUpdateConfig(), { wrapper });

    result.current.mutate({ deviceId: 'test' } as any);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith("保存失败", expect.objectContaining({
      description: errorMsg,
    }));
    expect(result.current.needsRestart).toBe(false);
  });
});
