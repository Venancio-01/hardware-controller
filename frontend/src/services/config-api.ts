/**
 * 配置导入/导出 API 服务
 *
 * 提供与后端配置导入/导出 API 端点交互的功能
 */

import { apiFetch } from '@/lib/api';
import { Config } from 'shared';
import { ApiError } from '@/lib/errors';

/**
 * 导出配置
 *
 * 该函数会触发浏览器下载配置文件
 */
export async function exportConfig(): Promise<void> {
  try {
    // 获取本地存储的 Token 以支持认证
    const token = localStorage.getItem('token');

    // 使用 fetch 处理文件下载，但添加认证支持（与 apiFetch 保持一致）
    const response = await fetch('/api/config/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    // 处理认证失效 (401) - 与 apiFetch 逻辑一致
    if (response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('认证已过期，请重新登录');
    }

    // 处理非 OK 响应 (4xx, 5xx)
    if (!response.ok) {
      let errorMsg = `导出失败: ${response.status} ${response.statusText}`;
      let errorData: any = {};

      try {
        errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        // 无法解析 JSON 则保持默认错误消息
      }

      throw new ApiError(errorMsg, response.status, errorData);
    }

    // 处理文件下载
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 添加时间戳以便区分不同时间导出的配置文件
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `config-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('导出配置失败:', error);
    throw error;
  }
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * 导入配置
 *
 * @param config 配置对象
 * @returns 导入成功的配置对象
 */
export async function importConfig(config: Config): Promise<Config> {
  try {
    const response = await apiFetch<ApiResponse<Config>>('/api/config/import', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });

    if (!response.success) {
      throw new Error(response.error || '导入配置失败');
    }

    return response.data;
  } catch (error) {
    console.error('导入配置失败:', error);
    throw error;
  }
}
