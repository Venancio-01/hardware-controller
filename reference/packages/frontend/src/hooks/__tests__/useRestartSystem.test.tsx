import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRestartSystem } from '../useRestartSystem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the system API
vi.mock('@/services/system-api', () => ({
  systemApi: {
    restartSystem: vi.fn(() => Promise.resolve({ success: true, message: 'Restart initiated' }))
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useRestartSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call systemApi.restartSystem when mutate is called', async () => {
    const { result } = renderHook(() => useRestartSystem(), { wrapper });

    // Call mutate
    result.current.mutate();

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Verify that the systemApi.restartSystem was called
    const { systemApi } = await import('@/services/system-api');
    expect(systemApi.restartSystem).toHaveBeenCalled();
  });

  it('should handle success case and call onSuccess callback', async () => {
    const onSuccessSpy = vi.fn();
    const { result } = renderHook(() => useRestartSystem({ onSuccess: onSuccessSpy }), { wrapper });

    // Call mutate
    result.current.mutate();

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  it('should handle error case and call onError callback', async () => {
    const { systemApi } = await import('@/services/system-api');
    const mockError = new Error('Failed to restart');
    (systemApi.restartSystem as vi.Mock).mockRejectedValue(mockError);

    const onErrorSpy = vi.fn();
    const { result } = renderHook(() => useRestartSystem({ onError: onErrorSpy }), { wrapper });

    // Call mutate
    result.current.mutate();

    await waitFor(() => {
      expect(onErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  it('should reflect correct loading state during mutation', async () => {
    const { result } = renderHook(() => useRestartSystem(), { wrapper });

    // Initially, isPending should be false
    expect(result.current.isPending).toBe(false);

    // Call mutate
    result.current.mutate();

    // During mutation, isPending should be true
    expect(result.current.isPending).toBe(true);

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

