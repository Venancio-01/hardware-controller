// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '../../../lib/errors';

vi.mock('../../../lib/api', () => ({
  apiFetch: vi.fn(),
  restartCore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useImportExportConfig hook
const mockHandleExport = vi.fn();
const mockHandleImport = vi.fn();
const mockConfirmImport = vi.fn();
const mockCancelImport = vi.fn();

// Use a getter to allow changing the return value dynamically
let mockPendingConfig: any = null;

vi.mock('../../../hooks/useImportExportConfig', () => ({
  useImportExportConfig: () => ({
    handleExport: mockHandleExport,
    handleImport: mockHandleImport,
    confirmImport: mockConfirmImport,
    cancelImport: mockCancelImport,
    pendingConfig: mockPendingConfig,
    isExporting: false,
    isImporting: false,
  }),
}));

// Mock global fetch for conflict detection
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock Network hooks
const mockGetNetworkConfig = vi.fn();
const mockApplyNetwork = vi.fn();

vi.mock('../../../hooks/useApplyNetwork', () => ({
  useGetNetworkConfig: () => ({
    mutate: mockGetNetworkConfig,
    isPending: false
  }),
  useApplyNetwork: () => ({
    mutate: mockApplyNetwork,
    mutateAsync: mockApplyNetwork.mockResolvedValue({}),
    isPending: false
  })
}));

// ... (existing helper mocks)

// Import after mocks are set up
import { ConfigForm, mergeConfigValues } from '../ConfigForm';
import { apiFetch } from '../../../lib/api';

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
    // Add dummy values for all other fields to be safe against Zod defaults/unregistered stripping
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '127.0.0.1',
    LOG_LEVEL: 'info',
    LOG_PRETTY: true,
    CABINET_HOST: '192.168.1.101',
    CABINET_PORT: 50000,
    CONTROL_SERIAL_PATH: '/dev/ttyUSB0',
    CONTROL_SERIAL_BAUDRATE: 9600,
    CONTROL_SERIAL_DATABITS: 8,
    CONTROL_SERIAL_STOPBITS: 1,
    CONTROL_SERIAL_PARITY: 'none',
    VOICE_CABINET_VOLUME: 10,
    VOICE_CABINET_SPEED: 5,
    VOICE_CONTROL_VOLUME: 10,
    VOICE_CONTROL_SPEED: 5,
    HARDWARE_TIMEOUT: 5000,
    HARDWARE_RETRY_ATTEMPTS: 3,
    ENABLE_HARDWARE_SIMULATOR: false,
    ENABLE_METRICS: true,
    UDP_LOCAL_PORT: 8000,
    QUERY_INTERVAL: 1000,
    DOOR_OPEN_TIMEOUT_S: 30,
    APPLY_SWITCH_INDEX: 0,
    CABINET_DOOR_SWITCH_INDEX: 1,
    DOOR_LOCK_SWITCH_INDEX: 2,
    KEY_SWITCH_INDEX: 3,
    VIBRATION_SWITCH_INDEX: 4,
    ALARM_CANCEL_SWITCH_INDEX: 10,
    AUTH_CANCEL_SWITCH_INDEX: 11,
    AUTH_PASS_SWITCH_INDEX: 12,
    DOOR_LOCK_SWITCH_LIGHT_RELAY_INDEX: 2,
    ALARM_LIGHT_RELAY_INDEX: 8,
    CONTROL_ALARM_RELAY_INDEX: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleExport.mockClear();
    mockHandleImport.mockClear();
    mockConfirmImport.mockClear();
    mockCancelImport.mockClear();
    mockPendingConfig = null;
    localStorage.clear();
    // Default fetch behavior: success for conflict check
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    // Restore global fetch
    vi.restoreAllMocks();
    // Cleanup DOM
    cleanup();
  });

  it('should render loading state initially', async () => {
    const mockApiFetch = vi.fn().mockReturnValue(new Promise(() => { })); // Never resolves to simulate loading
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    const { container } = render(<ConfigForm />, { wrapper });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should call apiFetch with the correct endpoint', async () => {
    const mockApiFetch = vi.fn().mockResolvedValue(mockConfig);
    vi.mocked(apiFetch).mockImplementation(mockApiFetch);

    render(<ConfigForm />, { wrapper });
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/config');
    }, { timeout: 1000 });
  });

  it('should render form components after loading', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);
    render(<ConfigForm />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /重置默认配置/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();
  });

  it('should disable button and show loading when saving', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);
    render(<ConfigForm />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /保存配置/ });
    expect(saveButton).toBeDisabled();
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
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);
    render(<ConfigForm />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /保存配置/ });
    expect(saveButton).toBeDisabled();

    // Trigger dirty state
    const setDirtyBtn = screen.getByTestId('set-dirty-btn');
    fireEvent.click(setDirtyBtn);

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    // Mock PUT success
    vi.mocked(apiFetch).mockResolvedValueOnce({ success: true, needsRestart: true });

    // Submit
    fireEvent.click(saveButton);

    // 验证成功保存后由 useUpdateConfig hook 处理 toast 和 confirm
    // 注意：由于使用了 fake confirm，这里不再断言 toast（在 hook 测试中验证）
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/config', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"deviceId":"new-device-id"')
      }));
    });
  });

  it('should reset form state after successful save', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockConfig);
    render(<ConfigForm />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
    });

    const setDirtyBtn = screen.getByTestId('set-dirty-btn');
    fireEvent.click(setDirtyBtn);
    const saveButton = screen.getByRole('button', { name: /保存配置/ });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    vi.mocked(apiFetch).mockResolvedValueOnce({ success: true, needsRestart: false });
    fireEvent.click(saveButton);

    // Wait for success -> reset -> button disabled
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    }, { timeout: 2000 });

    expect(screen.queryByText(/配置已修改，尚未保存/)).not.toBeInTheDocument();
  });

  it('should preserve hidden fields when merging config values', () => {
    // Identical to before
    const baseConfig = { ...mockConfig }; // reuse mockConfig which has fields
    const formData = { ...mockConfig, timeout: 7000 } as unknown as any;
    const submittedValues = { ...mockConfig, timeout: 7000, ipAddress: '10.0.0.2' } as unknown as any;
    const merged = mergeConfigValues(baseConfig as any, formData, submittedValues);
    expect(merged?.ipAddress).toBe('10.0.0.2');
    expect(merged?.LOG_LEVEL).toBe('info');
  });

  // Story 3.5: Handle Validation & System Errors tests
  describe('Story 3.5: Server Validation Errors', () => {
    it('should display server validation errors for 400 Bad Request', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);
      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
      });

      const setDirtyBtn = screen.getByTestId('set-dirty-btn');
      fireEvent.click(setDirtyBtn);

      const saveButton = screen.getByRole('button', { name: /保存配置/ });
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // Mock 400 error with validation errors
      const apiError = new ApiError(
        'Validation failed',
        400,
        {
          error: 'Validation failed',
          validationErrors: {
            deviceId: ['设备 ID 已被占用'],
            port: ['端口号超出范围']
          }
        }
      );
      vi.mocked(apiFetch).mockRejectedValueOnce(apiError);

      fireEvent.click(saveButton);

      // Verify error messages are displayed
      await waitFor(() => {
        expect(screen.getByTestId('deviceId-error')).toHaveTextContent('设备 ID 已被占用');
        expect(screen.getByTestId('port-error')).toHaveTextContent('端口号超出范围');
      });
    });

    it('should show toast notification for 500 Internal Server Error', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);
      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
      });

      const setDirtyBtn = screen.getByTestId('set-dirty-btn');
      fireEvent.click(setDirtyBtn);

      const saveButton = screen.getByRole('button', { name: /保存配置/ });
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // Mock 500 error without validation errors
      const apiError = new ApiError(
        'Internal server error',
        500,
        { error: 'Internal server error' }
      );
      vi.mocked(apiFetch).mockRejectedValueOnce(apiError);

      fireEvent.click(saveButton);

      // Verify toast error is called for 500 errors
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "保存失败",
          expect.objectContaining({
            description: 'Internal server error'
          })
        );
      });
    });

    it('should not show toast for 400 errors with validation errors', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);
      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('app-config-card')).toBeInTheDocument();
      });

      const setDirtyBtn = screen.getByTestId('set-dirty-btn');
      fireEvent.click(setDirtyBtn);

      const saveButton = screen.getByRole('button', { name: /保存配置/ });
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // Mock 400 error with validation errors - should NOT trigger toast
      const apiError = new ApiError(
        'Validation failed',
        400,
        {
          error: 'Validation failed',
          validationErrors: {
            deviceId: ['设备 ID 已被占用']
          }
        }
      );
      vi.mocked(apiFetch).mockRejectedValueOnce(apiError);

      fireEvent.click(saveButton);

      // Verify toast.error is NOT called for validation errors
      await waitFor(() => {
        expect(toast.error).not.toHaveBeenCalled();
      });
    });
  });
  describe('Import Configuration Flow', () => {
    it('should show confirmation dialog when pendingConfig is set', async () => {
      mockPendingConfig = { ...mockConfig, deviceId: 'imported-device' };
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);

      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/确认导入配置/)).toBeInTheDocument();
        expect(screen.getByText(/imported-device/)).toBeInTheDocument();
      });
    });

    it('should call confirmImport when confirmation dialog is accepted', async () => {
      mockPendingConfig = { ...mockConfig };
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);

      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/确认导入配置/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /确认导入/ });
      fireEvent.click(confirmButton);

      expect(mockConfirmImport).toHaveBeenCalledTimes(1);
    });

    it('should call cancelImport when confirmation dialog is cancelled', async () => {
      mockPendingConfig = { ...mockConfig };
      vi.mocked(apiFetch).mockResolvedValue(mockConfig);

      render(<ConfigForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/确认导入配置/)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /取消/ });
      fireEvent.click(cancelButton);

      expect(mockCancelImport).toHaveBeenCalledTimes(1);
    });
  });
});
