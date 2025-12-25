// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the modules before the import
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/hooks/useUpdateConfig', () => ({
  useUpdateConfig: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    needsRestart: false,
  })),
}));

vi.mock('../AppConfigCard', () => ({
  AppConfigCard: () => <div data-testid="app-config-card">Config Card</div>,
}));

// Import after mocks are set up
import { ConfigForm } from '../ConfigForm';
import { useUpdateConfig } from '@/hooks/useUpdateConfig';
import { apiFetch } from '@/lib/api';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ConfigForm Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    const mockApiFetch = vi.fn().mockReturnValue(new Promise(() => { })); // Never resolves to simulate loading
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    render(<ConfigForm />, { wrapper });

    // Should show skeleton (loading state)
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading skeleton based on skeleton.tsx
  });

  it('should call apiFetch with the correct endpoint', async () => {
    const mockConfig = {
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080,
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
    };

    const mockApiFetch = vi.fn().mockResolvedValue(mockConfig);
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    render(<ConfigForm />, { wrapper });

    // Wait for the API call
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/config');
    }, { timeout: 1000 });
  });

  it('should render restart alert when needsRestart is true', () => {
    // Mock apiFetch for initial load
    vi.mocked(apiFetch).mockResolvedValue({});

    // Mock hook to return needsRestart: true
    vi.mocked(useUpdateConfig).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      needsRestart: true,
      data: undefined,
      variables: undefined,
      reset: vi.fn(),
      status: 'success',
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
      pause: vi.fn(), // Missing method required by MutationResult, partial mock is ok usually but explicit is safer
    } as any);

    render(<ConfigForm />, { wrapper });

    expect(screen.getByText(/需要重启系统才能生效/)).toBeInTheDocument();
  });

  it('should disable button and show loading when saving', () => {
    vi.mocked(apiFetch).mockResolvedValue({});

    vi.mocked(useUpdateConfig).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
      needsRestart: false,
    } as any);

    render(<ConfigForm />, { wrapper });

    const button = screen.getByRole('button', { name: /保存中/ });
    expect(button).toBeDisabled();
  });
});
