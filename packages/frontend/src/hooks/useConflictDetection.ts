import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ConflictDetectionRequest, ConflictDetectionResult } from 'shared';

/**
 * 冲突检测 Hook
 *
 * 负责在保存配置前检测潜在的网络配置冲突
 * 这是 Story 3-3 (conflict-safe-save) 的核心功能
 */
export function useConflictDetection() {
  const mutation = useMutation({
    mutationFn: async (config: ConflictDetectionRequest) => {
      return apiFetch<ConflictDetectionResult>('/api/config/check-conflict', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
  });

  return mutation;
}
