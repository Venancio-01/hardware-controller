import { useMutation } from '@tanstack/react-query';
import { TestConnectionRequest, TestConnectionResult } from 'shared';
import { apiFetch } from '@/lib/api';

export function useTestConnection() {
  return useMutation({
    mutationFn: async (request: TestConnectionRequest) => {
      // apiFetch returns the data payload (T) directly if success is true
      const result = await apiFetch<TestConnectionResult>('/api/system/test-connection', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return result;
    },
  });
}