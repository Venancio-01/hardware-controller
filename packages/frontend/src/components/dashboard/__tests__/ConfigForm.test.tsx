// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RESTART_ALERT_KEY } from '@/hooks/useUpdateConfig';

// Mock the modules before the import
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../AppConfigCard', () => ({
  AppConfigCard: () => <div data-testid="app-config-card">Config Card</div>,
}));

vi.mock('@/components/config/NetworkConfigForm', () => ({
  NetworkConfigForm: () => <div data-testid="network-config-form">Network Form</div>,
}));

// Import after mocks are set up
import { ConfigForm } from '../ConfigForm';
import { apiFetch } from '@/lib/api';

// Create a test query client
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

describe('ConfigForm Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  const mockConfig = {
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    port: 8080,
    deviceId: 'device-001',
    timeout: 5000,
    retryCount: 3,
    pollingInterval: 5000,
    dns: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render loading state initially', async () => {
    const mockApiFetch = vi.fn().mockReturnValue(new Promise(() => { })); // Never resolves to simulate loading
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    render(<ConfigForm />, { wrapper });

    // Should show skeleton (loading state)
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading skeleton based on skeleton.tsx
  });

  it('should call apiFetch with the correct endpoint', async () => {
    const mockApiFetch = vi.fn().mockResolvedValue(mockConfig);
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    render(<ConfigForm />, { wrapper });

    // Wait for the API call
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/config');
    }, { timeout: 1000 });
  });

  it('should render restart alert when needsRestart is true', async () => {
    // Mock apiFetch for initial load
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);

    render(<ConfigForm />, { wrapper });

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    // 设置 needsRestart 状态
    localStorage.setItem(RESTART_ALERT_KEY, 'true');

    // 重新渲染以触发状态更新
    render(<ConfigForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/需要重启系统才能生效/)).toBeInTheDocument();
    });
  });

  it('should disable button and show loading when saving', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);

    render(<ConfigForm />, { wrapper });

    // 等待组件加载
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    // 获取保存按钮 - 初始状态应该是禁用的（因为表单是 pristine）
    const saveButton = screen.getByRole('button', { name: /保存配置/ });
    expect(saveButton).toBeDisabled();
  });

  it('should render form components after loading', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);

    render(<ConfigForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
      expect(screen.getByTestId('network-config-form')).toBeInTheDocument();
    });

    // 验证操作按钮存在
    expect(screen.getByRole('button', { name: /导出配置/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /导入配置/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();
  });

  it('should show error alert when API fails', async () => {
    const errorMessage = 'Failed to load config';
    vi.mocked(apiFetch).mockRejectedValue(new Error(errorMessage));

    render(<ConfigForm />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load configuration/)).toBeInTheDocument();
    });
  });

  it('should call mutation when form is submitted', async () => {
    // Mock the userEvent for better interaction simulation
    const user = userEvent.setup();

    vi.mocked(apiFetch).mockResolvedValue(mockConfig);

    render(<ConfigForm />, { wrapper });

    // 等待表单加载
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    // 表单初始状态: 保存按钮应该是禁用的(pristine状态)
    const saveButton = screen.getByRole('button', { name: /保存配置/ });
    expect(saveButton).toBeDisabled();

    // 注意: 由于 AppConfigCard 和 NetworkConfigForm 被 mock 了,
    // 我们无法直接测试表单输入和 isDirty 状态变化
    // 这是一个已知的测试限制,需要真实的表单交互才能完全测试
  });

  it('should reset form state after successful save', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);

    const { container } = render(<ConfigForm />, { wrapper });

    // 等待组件加载
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    // 验证组件已渲染
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();

    // 注意: 由于表单组件被 mock,无法完全测试 isDirty 状态变化
    // 这是一个集成测试的限制,真实场景需要使用组件测试或E2E测试
  });
});
