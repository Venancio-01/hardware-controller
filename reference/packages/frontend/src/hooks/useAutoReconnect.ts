import { useEffect, useRef } from 'react';

interface UseAutoReconnectOptions {
  onReconnectAttempt?: (attempt: number) => void;
  onReconnectSuccess?: () => void;
  onReconnectFailure?: (error: Error) => void;
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

/**
 * 自动重连 Hook
 * 用于在系统重启后自动重连服务
 */
export function useAutoReconnect(
  reconnectFunction: () => Promise<any>,
  options?: UseAutoReconnectOptions
) {
  const {
    onReconnectAttempt,
    onReconnectSuccess,
    onReconnectFailure,
    maxRetries = 10,
    initialDelay = 1000,
    maxDelay = 30000,
  } = options || {};

  const retryCount = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // 指数退避算法
  const getDelay = (attempt: number): number => {
    const exponentialDelay = initialDelay * Math.pow(2, attempt);
    return Math.min(exponentialDelay, maxDelay);
  };

  const attemptReconnect = async () => {
    if (retryCount.current >= maxRetries) {
      const error = new Error(`Maximum retry attempts (${maxRetries}) reached`);
      if (onReconnectFailure) {
        onReconnectFailure(error);
      }
      return;
    }

    if (onReconnectAttempt) {
      onReconnectAttempt(retryCount.current + 1);
    }

    try {
      await reconnectFunction();
      retryCount.current = 0; // 重置重试计数
      if (onReconnectSuccess) {
        onReconnectSuccess();
      }
    } catch (error) {
      retryCount.current += 1;
      const delay = getDelay(retryCount.current);

      console.log(`Reconnect attempt ${retryCount.current} failed, retrying in ${delay}ms`);

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(attemptReconnect, delay);
    }
  };

  const startReconnect = () => {
    retryCount.current = 0;
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    attemptReconnect();
  };

  const stopReconnect = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    retryCount.current = 0;
  };

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return {
    startReconnect,
    stopReconnect,
    retryCount: retryCount.current,
    isReconnecting: retryCount.current > 0,
  };
}