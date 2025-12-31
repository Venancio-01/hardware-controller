/**
 * 网络配置 API 服务
 *
 * 提供与后端网络配置 API 交互的功能
 */

import { apiClient } from '@/api/client';
import { log } from '@/lib/logger';

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
}

/**
 * API 响应接口
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

/**
 * 网络配置 API 服务
 */
export const networkApi = {
  /**
   * 获取当前网络配置
   */
  async getNetworkConfig(): Promise<NetworkConfig> {
    try {
      const response = await apiClient.get<ApiResponse<NetworkConfig>>('/network/config');
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || '获取网络配置失败');
      }
      return response.data.data;
    } catch (error) {
      log.error('获取网络配置失败', error);
      throw error;
    }
  },

  /**
   * 应用网络配置
   * 通过后端调用 nmcli 命令修改系统网络配置
   *
   * @param config 新的网络配置
   */
  async applyNetworkConfig(config: NetworkConfig): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>('/network/apply', config);
      if (!response.data.success) {
        const errorMsg = response.data.errors?.join(', ') || response.data.error || '应用网络配置失败';
        throw new Error(errorMsg);
      }
    } catch (error) {
      log.error('应用网络配置失败', error);
      throw error;
    }
  },
};
