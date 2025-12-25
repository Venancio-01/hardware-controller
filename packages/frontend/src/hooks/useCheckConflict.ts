import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ConflictDetectionRequest, ConflictDetectionResult } from 'shared';

export function useCheckConflict() {
  return useMutation({
    mutationFn: (request: ConflictDetectionRequest) =>
      apiFetch<ConflictDetectionResult>('/api/config/check-conflict', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onError: (error: Error) => {
      console.error('Conflict detection failed:', error);
    }
  });
}