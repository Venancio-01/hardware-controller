/**
 * 应用网络配置 Hook
 *
 * 封装网络配置 API 调用，通过后端 nmcli 命令修改系统网络配置
 */

import { useMutation } from '@tanstack/react-query';
import { networkApi, type NetworkConfig } from '@/services/network-api';

/**
 * 应用网络配置的 React Hook
 *
 * 使用示例:
 * ```tsx
 * const { mutate, isPending, isSuccess, error } = useApplyNetwork();
 *
 * const handleApply = () => {
 *   mutate({ ipAddress: '192.168.1.100', subnetMask: '255.255.255.0', gateway: '192.168.1.1' });
 * };
 * ```
 */
export function useApplyNetwork() {
  return useMutation({
    mutationFn: (config: NetworkConfig) => networkApi.applyNetworkConfig(config),
    onError: (error: Error) => {
      console.error('应用网络配置失败:', error);
    },
  });
}

/**
 * 获取当前网络配置的 React Hook
 */
export function useGetNetworkConfig() {
  return useMutation({
    mutationFn: () => networkApi.getNetworkConfig(),
    onError: (error: Error) => {
      console.error('获取网络配置失败:', error);
    },
  });
}
