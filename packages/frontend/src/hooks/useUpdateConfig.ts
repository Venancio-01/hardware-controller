import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { type Config } from 'shared';

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  const [needsRestart, setNeedsRestart] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: Config) => apiFetch<{ success: boolean; needsRestart: boolean }>('/api/config', {
      method: 'PUT',
      body: JSON.stringify(values),
    }),
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
      toast.error("保存失败", {
        description: error.message || "请检查网络连接后重试",
      });
    }
  });

  return {
    ...mutation,
    needsRestart
  };
}
