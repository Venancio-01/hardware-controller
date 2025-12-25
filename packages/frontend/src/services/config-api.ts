/**
 * 配置导入/导出 API 服务
 *
 * 提供与后端配置导入/导出 API 端点交互的功能
 */

import { apiFetch } from '@/lib/api';
import { Config } from 'shared';

/**
 * 导出配置
 *
 * 该函数会触发浏览器下载配置文件
 */
export async function exportConfig(): Promise<void> {
  try {
    // 直接使用 fetch，因为需要处理文件下载
    const response = await fetch('/api/config/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '导出配置失败');
    }

    // 处理文件下载
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('导出配置失败:', error);
    throw error;
  }
}

/**
 * 导入配置
 *
 * @param config 配置对象
 * @returns 导入成功的配置对象
 */
export async function importConfig(config: Config): Promise<Config> {
  try {
    const response = await apiFetch('/api/config/import', {
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