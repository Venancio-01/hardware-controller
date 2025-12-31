/**
 * config-api 单元测试
 *
 * 测试配置导入/导出 API 服务
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportConfig, importConfig } from './config-api';
import { apiFetch } from '@/lib/api';

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

// Mock global fetch for export (blob download)
global.fetch = vi.fn() as any;

// Mock browser APIs for file download
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  writable: true,
});

describe('config-api', () => {
  const mockElement = {
    href: '',
    download: '',
    click: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock createElement for anchor tag
    global.document.createElement = vi.fn(() => mockElement) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('exportConfig', () => {
    it('should export config and trigger file download with timestamp', async () => {
      const mockConfigJson = JSON.stringify({
        deviceId: 'test-device',
        timeout: 3000,
        ipAddress: '192.168.1.100',
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob([mockConfigJson])),
      } as any);

      await exportConfig();

      // Verify fetch was called with correct endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/config/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify blob was created
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Verify anchor element was created
      expect(document.createElement).toHaveBeenCalledWith('a');

      // Verify timestamp in filename (format: config-YYYY-MM-DD.json)
      const timestampRegex = /^config-\d{4}-\d{2}-\d{2}\.json$/;
      expect(mockElement.download).toMatch(timestampRegex);

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();

      // Verify cleanup
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockElement);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should include authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token-123');

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob()),
      } as any);

      await exportConfig();

      expect(global.fetch).toHaveBeenCalledWith('/api/config/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123',
        },
      });
    });

    it('should handle 401 unauthorized error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: '认证已过期' }),
      } as any);

      await expect(exportConfig()).rejects.toThrow('认证已过期，请重新登录');

      // Verify token was removed from localStorage
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle 404 config not found error', async () => {
      const errorMsg = '配置文件不存在，无法导出';
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: errorMsg }),
      } as any);

      await expect(exportConfig()).rejects.toThrow(errorMsg);
    });

    it('should handle 400 validation error', async () => {
      const errorMsg = '配置文件格式无效';
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: errorMsg,
          validationErrors: { deviceId: ['不能为空'] },
        }),
      } as any);

      await expect(exportConfig()).rejects.toThrow(errorMsg);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(global.fetch).mockRejectedValue(networkError);

      await expect(exportConfig()).rejects.toThrow('Network error');
    });

    it('should redirect to login on 401 if not already on login page', async () => {
      // Mock current path as not login page
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/dashboard',
          href: 'http://localhost:3000/dashboard',
        },
        writable: true,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: '认证失败' }),
      } as any);

      await expect(exportConfig()).rejects.toThrow();

      // Verify redirect to login
      expect(window.location.href).toContain('/login');
    });

    it('should not redirect if already on login page', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/login',
          href: 'http://localhost:3000/login',
        },
        writable: true,
      });

      const originalHref = window.location.href;

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: '认证失败' }),
      } as any);

      await expect(exportConfig()).rejects.toThrow();

      // Should not redirect
      expect(window.location.href).toBe(originalHref);
    });
  });

  describe('importConfig', () => {
    const mockConfig = {
      deviceId: 'test-device',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080,
    };

    it('should import config successfully', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        data: mockConfig,
        message: '配置导入成功',
      });

      const result = await importConfig(mockConfig);

      expect(apiFetch).toHaveBeenCalledWith('/api/config/import', {
        method: 'POST',
        body: JSON.stringify({ config: mockConfig }),
      });

      expect(result).toEqual(mockConfig);
    });

    it('should handle import API error', async () => {
      const errorMsg = '配置验证失败';
      vi.mocked(apiFetch).mockResolvedValue({
        success: false,
        error: errorMsg,
      });

      await expect(importConfig(mockConfig)).rejects.toThrow(errorMsg);
    });

    it('should handle network errors during import', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiFetch).mockRejectedValue(networkError);

      await expect(importConfig(mockConfig)).rejects.toThrow('Network error');
    });

    it('should send config in correct format to API', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        data: mockConfig,
      });

      await importConfig(mockConfig);

      // Verify the config is wrapped correctly
      expect(apiFetch).toHaveBeenCalledWith('/api/config/import', {
        method: 'POST',
        body: JSON.stringify({ config: mockConfig }),
      });
    });
  });
});
