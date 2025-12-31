import { useMutation } from '@tanstack/react-query';
import { systemApi } from '@/services/system-api';
import { useAutoReconnect } from './useAutoReconnect';

interface UseRestartSystemOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * 自定义Hook：用于重启系统
 * 提供重启系统功能和相关状态管理
 */
export function useRestartSystem(options?: UseRestartSystemOptions) {
  const { startReconnect, stopReconnect } = useAutoReconnect(
    // 重连函数：尝试获取配置以检查系统是否已重启
    async () => {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('System not ready yet');
      }
      return response.json();
    },
    {
      onReconnectSuccess: () => {
        // 重连成功后可以执行一些操作，如刷新页面或更新状态
        console.log('System has restarted and is now available');
      },
      onReconnectFailure: (error) => {
        console.error('Failed to reconnect after restart:', error);
      }
    }
  );

  return useMutation({
    mutationFn: async () => {
      const response = await systemApi.restartSystem();
      return response;
    },
    onSuccess: (data) => {
      // 重启请求成功后，开始自动重连
      startReconnect();

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}