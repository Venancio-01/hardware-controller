import { useQuery } from '@tanstack/react-query';
import { systemApi, type SerialPortInfo } from '@/services/system-api';

export function useSerialPorts() {
  return useQuery({
    queryKey: ['serial-ports'],
    queryFn: async () => {
      const ports = await systemApi.getSerialPorts();
      console.log('🚀 - useSerialPorts - ports:', ports)
      return ports;
    },
    // Refresh every 10 seconds or window focus
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}
