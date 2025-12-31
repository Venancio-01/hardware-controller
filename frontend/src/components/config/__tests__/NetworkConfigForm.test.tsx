import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { NetworkConfigForm } from '../NetworkConfigForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema, networkConfigSchema } from 'shared';
import { Form } from '../../../components/ui/form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { z } from 'zod';

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

const unifiedSchema = configSchema.and(z.object({
  network: networkConfigSchema.omit({ port: true })
}));

// Mock component to wrap NetworkConfigForm with a form
const MockNetworkConfigForm = ({ defaultValues }: { defaultValues?: any }) => {
  const form = useForm({
    resolver: zodResolver(unifiedSchema),
    defaultValues: {
      deviceId: 'device-test-001',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      network: {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        ...defaultValues,
      }
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
const initialConfig = {
  ipAddress: '192.168.1.100',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1',
};

describe('NetworkConfigForm', () => {
  it('renders form fields with default values', () => {
    render(<MockNetworkConfigForm defaultValues={initialConfig} />);

    expect(screen.getByLabelText(/IP 地址/)).toHaveValue('192.168.1.100');
    expect(screen.getByLabelText(/子网掩码/)).toHaveValue('255.255.255.0');
    expect(screen.getByLabelText(/网关/)).toHaveValue('192.168.1.1');
    // Port field removed from UI
    expect(screen.queryByLabelText(/端口/)).not.toBeInTheDocument();
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
});
