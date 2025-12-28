import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { NetworkConfigForm } from '../NetworkConfigForm';
import { NetworkConfig, TestConnectionResult } from 'shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema } from 'shared';
import { Form } from '../../../components/ui/form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

// Mock component to wrap NetworkConfigForm with a form
const MockNetworkConfigForm = ({ defaultValues }: { defaultValues?: Partial<NetworkConfig> }) => {
  const form = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      deviceId: 'device-test-001',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080,

      ...defaultValues,
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Form {...form}>
        <form>
          <NetworkConfigForm form={form} />
        </form>
      </Form>
    </QueryClientProvider>
  );
};

afterEach(() => {
  cleanup();
});

// Mock initial data
const initialConfig: Partial<NetworkConfig> = {
  ipAddress: '192.168.1.100',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1',
  port: 8080,

};

describe('NetworkConfigForm', () => {
  it('renders form fields with default values', () => {
    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    expect(screen.getByLabelText(/IP 地址/)).toHaveValue('192.168.1.100');
    expect(screen.getByLabelText(/子网掩码/)).toHaveValue('255.255.255.0');
    expect(screen.getByLabelText(/网关/)).toHaveValue('192.168.1.1');
    expect(screen.getByLabelText(/端口/)).toHaveValue(8080);
  });

  it('allows user input in IP address field', async () => {
    const user = userEvent.setup();
    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    const ipInput = screen.getByLabelText(/IP 地址/);
    await user.clear(ipInput);
    await user.type(ipInput, '10.0.0.1');

    expect(ipInput).toHaveValue('10.0.0.1');
  });

  it('allows user input in gateway field', async () => {
    const user = userEvent.setup();
    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    const gatewayInput = screen.getByLabelText(/网关/);
    await user.clear(gatewayInput);
    await user.type(gatewayInput, '10.0.0.1');

    expect(gatewayInput).toHaveValue('10.0.0.1');
  });





  it('renders test connection button', () => {
    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    const testButton = screen.getByRole('button', { name: /测试连接/ });
    expect(testButton).toBeInTheDocument();
    expect(testButton).toHaveTextContent('测试连接');
  });

  it('disables test connection button when form is invalid', async () => {
    const user = userEvent.setup();
    render(<MockNetworkConfigForm defaultValues={{ ...initialConfig, ipAddress: 'invalid' }} />);

    const testButton = screen.getByRole('button', { name: /测试连接/ });
    expect(testButton).toBeDisabled();

    // Update the IP to a valid one to enable the button
    const ipInput = screen.getByLabelText(/IP 地址/);
    await user.clear(ipInput);
    await user.type(ipInput, '192.168.1.100');

    // The button should now be enabled
    await waitFor(() => {
      expect(testButton).not.toBeDisabled();
    });
  });

  it('should call useTestConnection hook with correct parameters when test connection is clicked', async () => {
    const user = userEvent.setup();

    // Mock the mutate function
    const mockMutate = vi.fn();
    vi.mock('@/hooks/useTestConnection', () => ({
      useTestConnection: () => ({
        mutate: mockMutate,
        isPending: false,
      }),
    }));

    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    const testButton = screen.getByRole('button', { name: /测试连接/ });
    await user.click(testButton);

    // Check that mutate was called with the correct parameters
    expect(mockMutate).toHaveBeenCalledWith({
      ipAddress: '192.168.1.100',
      port: 8080,
      protocol: 'tcp',
      timeout: 5000,
    }, expect.any(Object)); // The second argument is an object with callbacks
  });

  it('should show loading state when connection test is pending', async () => {
    const user = userEvent.setup();

    // Create a mock with isPending state
    vi.mock('@/hooks/useTestConnection', () => ({
      useTestConnection: () => ({
        mutate: vi.fn(),
        isPending: true, // Simulate pending state
      }),
    }));

    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    // Since the component is already rendered with the mock, we just need to check
    const testButton = screen.getByRole('button', { name: /测试连接/ });

    // The button should be disabled when pending
    expect(testButton).toBeDisabled();

    // Should show loading text
    expect(screen.getByText(/测试中\.\.\./)).toBeInTheDocument();
  });
});
