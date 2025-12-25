import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the apiFetch function BEFORE importing the component
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

// Import after mocks are set up
import { Sidebar } from '../Sidebar';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const mockApiFetch = vi.fn().mockReturnValue(new Promise(() => {})); // Never resolves to simulate loading
    vi.mocked(require('@/lib/api').apiFetch).mockImplementation(mockApiFetch);

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

    const mockApiFetch = vi.fn().mockResolvedValue(mockStatus);
    vi.mocked(require('@/lib/api').apiFetch).mockImplementation(mockApiFetch);

    render(<Sidebar />, { wrapper });

    // Wait for the API call
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/status');
    }, { timeout: 1000 });
  });

  it('should display status based on API response', async () => {
    const mockStatus = {
      online: false, // Test with offline status
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'TCP',
      uptime: 0,
    };

    const mockApiFetch = vi.fn().mockResolvedValue(mockStatus);
    vi.mocked(require('@/lib/api').apiFetch).mockImplementation(mockApiFetch);

    render(<Sidebar />, { wrapper });

    // Wait for data to be loaded and check if offline status is displayed
    await waitFor(() => {
      expect(screen.getByText(/离线/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});