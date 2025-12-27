import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the apiFetch function BEFORE importing the component
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  restartCore: vi.fn(), // Required for RestartCoreButton component
}));

// Mock useCoreStatus hook
vi.mock('@/hooks/useCoreStatus', () => ({
  useCoreStatus: vi.fn(),
}));

// Import after mocks are set up
import { Sidebar } from '../Sidebar';
import { apiFetch } from '@/lib/api';
import { useCoreStatus, type UseCoreStatusResult } from '@/hooks/useCoreStatus';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchInterval: false, // Disable refetch interval for tests
    },
  },
});

describe('Sidebar Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  const mockCoreStatusDefault: UseCoreStatusResult = {
    status: 'Stopped',
    uptime: null,
    lastError: null,
    connectionStatus: 'connecting',
    connectionError: null,
    isConnected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    vi.mocked(useCoreStatus).mockReturnValue(mockCoreStatusDefault);
  });

  it('should render loading state initially', () => {
    vi.mocked(apiFetch).mockImplementation(() => new Promise(() => {})); // Never resolves to simulate loading

    render(<Sidebar />, { wrapper });

    // Should show loading spinner
    expect(screen.getByText(/Loading status.../i)).toBeInTheDocument();
  });

  it('should call apiFetch with the correct endpoint', async () => {
    const mockStatus = {
      online: true,
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'TCP',
      uptime: 3600,
    };

    vi.mocked(apiFetch).mockResolvedValue(mockStatus);

    render(<Sidebar />, { wrapper });

    // Wait for the API call
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/status');
    }, { timeout: 3000 });
  });

  it('should display status based on API response', async () => {
    const mockStatus = {
      online: false, // Test with offline status
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'TCP',
      uptime: 0,
    };

    vi.mocked(apiFetch).mockResolvedValue(mockStatus);

    render(<Sidebar />, { wrapper });

    // Wait for data to be loaded and check if offline status is displayed
    await waitFor(() => {
      expect(screen.getByText(/离线/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display Core Status card with correct data', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ online: true });
    vi.mocked(useCoreStatus).mockReturnValue({
      ...mockCoreStatusDefault,
      status: 'Running',
      uptime: 120000, // 2 minutes
      connectionStatus: 'connected',
      isConnected: true,
    });

    render(<Sidebar />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Core 状态')).toBeInTheDocument();
    });

    expect(screen.getByText('已连接')).toBeInTheDocument(); // WS badge
    expect(screen.getByText('运行中')).toBeInTheDocument(); // Core status
    expect(screen.getByText('2分钟')).toBeInTheDocument(); // Formatted uptime
  });

  it('should display connection error state', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ online: true });
    vi.mocked(useCoreStatus).mockReturnValue({
      ...mockCoreStatusDefault,
      connectionStatus: 'disconnected',
    });

    render(<Sidebar />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('已断开')).toBeInTheDocument();
    });
  });

  it('should display Core error message when faulty', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ online: true });
    vi.mocked(useCoreStatus).mockReturnValue({
      ...mockCoreStatusDefault,
      status: 'Error',
      lastError: 'Fatal System Error',
      connectionStatus: 'connected',
    });

    render(<Sidebar />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Fatal System Error')).toBeInTheDocument();
    });

    expect(screen.getByText('错误')).toBeInTheDocument(); // Error badge
  });
});
