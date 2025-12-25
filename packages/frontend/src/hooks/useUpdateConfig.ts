import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { type Config, type ConflictDetectionRequest } from 'shared';

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  const [needsRestart, setNeedsRestart] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: Config) => {
      // 首先执行冲突检测
      try {
        const conflictRequest: ConflictDetectionRequest = {
          config: values,
          checkTypes: ['all'], // 执行所有类型的冲突检测
          timeout: 5000
        };

        const conflictResult = await apiFetch('/api/config/check-conflict', {
          method: 'POST',
          body: JSON.stringify(conflictRequest),
        });

        // 检查冲突检测结果
        if (!conflictResult.success) {
          // 如果检测到冲突，收集错误信息并抛出错误
          const errorMessages = conflictResult.failedChecks?.map(check => check.error).join('; ') || '配置冲突检测失败';
          throw new Error(`配置冲突检测失败: ${errorMessages}`);
        }
      } catch (error: any) {
        // 如果是冲突检测错误，直接抛出
        if (error.message.includes('配置冲突检测失败')) {
          throw error;
        }
        // 如果是其他错误（如网络错误），也抛出
        throw new Error(`冲突检测服务不可用: ${error.message || '未知错误'}`);
      }

      // 如果冲突检测通过，执行配置保存
      return apiFetch<{ success: boolean; needsRestart: boolean }>('/api/config', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['config'] });

      toast.success("配置已保存", {
        description: "需要重启系统才能生效",
      });

      if (data.needsRestart) {
        setNeedsRestart(true);
      }
    },
    onError: (error: Error) => {
      // 根据错误类型提供不同的提示
      if (error.message.includes('配置冲突检测失败')) {
        toast.error("配置冲突检测失败", {
          description: error.message.replace('配置冲突检测失败: ', ''),
        });
      } else if (error.message.includes('冲突检测服务不可用')) {
        toast.error("冲突检测服务不可用", {
          description: error.message.replace('冲突检测服务不可用: ', ''),
        });
      } else {
        toast.error("保存失败", {
          description: error.message || "请检查网络连接后重试",
        });
      }
    }
  });

  return {
    ...mutation,
    needsRestart
  };
}
