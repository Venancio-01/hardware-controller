import { apiClient } from '@/api/client';
import { log } from '@/lib/logger';

export interface RestartResponse {
  success: boolean;
  message?: string;
}

/**
 * 系统API服务
 * 提供与系统操作相关的API调用
 */
export const systemApi = {
  /**
   * 重启系统
   * 向后端发送重启请求
   */
  async restartSystem(): Promise<RestartResponse> {
    try {
      const response = await apiClient.post('/api/system/restart');
      return response.data;
    } catch (error) {
      log.error('系统重启请求失败', error);
      throw error;
    }
  }
};