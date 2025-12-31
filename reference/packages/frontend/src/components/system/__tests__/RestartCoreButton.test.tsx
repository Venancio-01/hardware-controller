import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestartCoreButton } from '../RestartCoreButton';
import * as api from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Mock API
vi.mock('@/lib/api', () => ({
  restartCore: vi.fn(),
}));

// Mock useCoreStatus if needed (not strictly needed for button unless we disable it based on status)
// For now, let's assume button is always enabled or we mock the hook if we use it.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <Toaster />
  </QueryClientProvider>
);

describe('RestartCoreButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the restart button', () => {
    render(<RestartCoreButton />, { wrapper });
    expect(screen.getByText('重启程序')).toBeInTheDocument();
  });

  it('should open alert dialog when clicked', async () => {
    render(<RestartCoreButton />, { wrapper });

    fireEvent.click(screen.getByText('重启程序'));

    expect(screen.getByText('确定要重启程序吗？')).toBeInTheDocument();
    expect(screen.getByText('正在执行的任务可能会中断，重启过程需要几秒钟。')).toBeInTheDocument();
  });

  it('should call restartCore API when confirmed', async () => {
    const restartSpy = vi.mocked(api.restartCore).mockResolvedValue({ success: true, message: 'Restart initiated' });

    render(<RestartCoreButton />, { wrapper });

    // Open dialog
    fireEvent.click(screen.getByText('重启程序'));

    // Click confirm
    const confirmBtn = screen.getByRole('button', { name: '确认重启' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(restartSpy).toHaveBeenCalled();
    });
  });

  it('should show error toast if restart fails', async () => {
    vi.mocked(api.restartCore).mockRejectedValue(new Error('API Error'));

    render(<RestartCoreButton />, { wrapper });

    fireEvent.click(screen.getByText('重启程序'));
    fireEvent.click(screen.getByRole('button', { name: '确认重启' }));

    await waitFor(() => {
        // Assert on Toaster? sonner might be hard to test directly without checking DOM.
        // Usually we check if text appears in the document.
        expect(screen.getByText('重启失败: API Error')).toBeInTheDocument();
    });
  });
});
