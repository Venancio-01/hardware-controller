import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestartButton } from '../RestartButton';

// Mock the useRestartSystem hook
vi.mock('@/hooks/useRestartSystem', () => ({
  useRestartSystem: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false
  }))
}));

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('RestartButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the restart button with correct text and icon', () => {
    render(
      <Wrapper>
        <RestartButton />
      </Wrapper>
    );

    const button = screen.getByRole('button', { name: /立即重启/i });
    expect(button).toBeInTheDocument();
    
    // Check that the restart icon is present
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('opens confirmation dialog when clicked', async () => {
    render(
      <Wrapper>
        <RestartButton />
      </Wrapper>
    );

    const button = screen.getByRole('button', { name: /立即重启/i });
    fireEvent.click(button);

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByText(/确认重启系统/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/您确定要重启系统吗/i)).toBeInTheDocument();
  });

  it('calls the restart mutation when confirmation is clicked', async () => {
    const { useRestartSystem } = await import('@/hooks/useRestartSystem');
    const mockMutate = vi.fn();
    (useRestartSystem as vi.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });

    render(
      <Wrapper>
        <RestartButton />
      </Wrapper>
    );

    // Click the restart button
    const restartButton = screen.getByRole('button', { name: /立即重启/i });
    fireEvent.click(restartButton);

    // Wait for the dialog to appear and click confirm
    await waitFor(() => {
      expect(screen.getByText(/确认重启系统/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /确认重启/i });
    fireEvent.click(confirmButton);

    // Verify that the restart mutation was called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('shows loading state when restart is in progress', async () => {
    const { useRestartSystem } = await import('@/hooks/useRestartSystem');
    (useRestartSystem as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: true
    });

    render(
      <Wrapper>
        <RestartButton />
      </Wrapper>
    );

    const button = screen.getByRole('button', { name: /重启中/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Wrapper>
        <RestartButton disabled={true} />
      </Wrapper>
    );

    const button = screen.getByRole('button', { name: /立即重启/i });
    expect(button).toBeDisabled();
  });
});

