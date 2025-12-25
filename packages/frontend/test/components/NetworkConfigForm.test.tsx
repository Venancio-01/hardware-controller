import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { NetworkConfigForm } from '../../src/components/config/NetworkConfigForm';
import { NetworkConfig } from 'shared';

afterEach(() => {
  cleanup();
});

// Mock initial data
const initialConfig: NetworkConfig = {
  ipAddress: '192.168.1.100',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1',
  port: 8080,
  dns: ['8.8.8.8'],
};

describe('NetworkConfigForm', () => {
  it('renders form fields with default values', () => {
    render(<NetworkConfigForm defaultValues={initialConfig} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/IP 地址/)).toHaveValue('192.168.1.100');
    expect(screen.getByLabelText(/子网掩码/)).toHaveValue('255.255.255.0');
    expect(screen.getByLabelText(/网关/)).toHaveValue('192.168.1.1');
    expect(screen.getByLabelText(/端口/)).toHaveValue(8080);
  });

  it('shows validation error for invalid IP', async () => {
    const user = userEvent.setup();
    render(<NetworkConfigForm defaultValues={initialConfig} onSubmit={vi.fn()} />);

    const ipInput = screen.getByLabelText(/IP 地址/);
    await user.clear(ipInput);
    await user.type(ipInput, 'invalid-ip');
    await user.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText(/IP 地址格式无效/)).toBeInTheDocument();
    });
  });

  it('shows validation error when Gateway is not in Subnet', async () => {
    const user = userEvent.setup();
    render(<NetworkConfigForm defaultValues={initialConfig} onSubmit={vi.fn()} />);

    const gatewayInput = screen.getByLabelText(/网关/);
    await user.clear(gatewayInput);
    await user.type(gatewayInput, '192.168.2.1');
    await user.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText(/网关必须与 IP 地址在同一子网内/)).toBeInTheDocument();
    });
  });

  it('disables submit button when invalid', async () => {
    const user = userEvent.setup();
    render(<NetworkConfigForm defaultValues={initialConfig} onSubmit={vi.fn()} />);
    
    const ipInput = screen.getByLabelText(/IP 地址/);
    await user.clear(ipInput);
    await user.type(ipInput, 'invalid');
    await user.tab();

    await waitFor(() => {
         const submitBtn = screen.getByRole('button', { name: /保存/ });
         expect(submitBtn).toBeDisabled();
    });
  });
});
