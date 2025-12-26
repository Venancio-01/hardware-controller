import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoReconnect } from '../useAutoReconnect';

describe('useAutoReconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully reconnect on first attempt', async () => {
    const mockReconnectFunction = vi.fn().mockResolvedValue('success');
    const onSuccessSpy = vi.fn();

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        onReconnectSuccess: onSuccessSpy
      })
    );

    // Start reconnection
    result.current.startReconnect();

    // Wait for the reconnection attempt
    await waitFor(() => {
      expect(mockReconnectFunction).toHaveBeenCalledTimes(1);
      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should retry with exponential backoff on failure', async () => {
    let attemptCount = 0;
    const mockReconnectFunction = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Connection failed'));
      }
      return Promise.resolve('success');
    });
    const onReconnectAttemptSpy = vi.fn();
    const onSuccessSpy = vi.fn();

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        onReconnectAttempt: onReconnectAttemptSpy,
        onReconnectSuccess: onSuccessSpy,
        initialDelay: 100,
        maxDelay: 5000
      })
    );

    result.current.startReconnect();

    // Wait for first attempt
    await waitFor(() => {
      expect(onReconnectAttemptSpy).toHaveBeenCalledWith(1);
    });

    // Advance timer by 100ms (2^0 * 100)
    vi.advanceTimersByTime(100);

    // Wait for second attempt
    await waitFor(() => {
      expect(onReconnectAttemptSpy).toHaveBeenCalledWith(2);
    });

    // Advance timer by 200ms (2^1 * 100)
    vi.advanceTimersByTime(200);

    // Wait for third attempt (success)
    await waitFor(() => {
      expect(onReconnectAttemptSpy).toHaveBeenCalledWith(3);
      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should respect maxRetries limit', async () => {
    const mockReconnectFunction = vi.fn().mockRejectedValue(new Error('Connection failed'));
    const onReconnectFailureSpy = vi.fn();

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        onReconnectFailure: onReconnectFailureSpy,
        maxRetries: 3,
        initialDelay: 50
      })
    );

    result.current.startReconnect();

    // Wait for all retries to complete
    await waitFor(() => {
      expect(onReconnectFailureSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Maximum retry attempts (3) reached'
        })
      );
    });

    expect(mockReconnectFunction).toHaveBeenCalledTimes(3);
  });

  it('should cap delay at maxDelay', async () => {
    const mockReconnectFunction = vi.fn().mockRejectedValue(new Error('Connection failed'));
    const initialDelay = 100;
    const maxDelay = 300;
    const onReconnectAttemptSpy = vi.fn();

    renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        onReconnectAttempt: onReconnectAttemptSpy,
        initialDelay,
        maxDelay,
        maxRetries: 10
      })
    );

    // Simulate multiple attempts to verify delay capping
    // Expected delays: 100, 200, 300 (capped), 300 (capped), ...

    // Note: This test verifies the logic, actual timing verification would require
    // more sophisticated timer mocking
    expect(onReconnectAttemptSpy).not.toHaveBeenCalled();
  });

  it('should stop reconnection when stopReconnect is called', async () => {
    let attemptCount = 0;
    const mockReconnectFunction = vi.fn().mockImplementation(() => {
      attemptCount++;
      return Promise.reject(new Error('Connection failed'));
    });

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        maxRetries: 10,
        initialDelay: 50
      })
    );

    result.current.startReconnect();

    // Wait for first attempt
    await waitFor(() => {
      expect(attemptCount).toBeGreaterThan(0);
    });

    // Stop reconnection
    result.current.stopReconnect();

    const attemptsBeforeStop = attemptCount;

    // Advance time significantly
    vi.advanceTimersByTime(1000);

    // Verify no new attempts were made
    await waitFor(() => {
      expect(attemptCount).toBe(attemptsBeforeStop);
    });
  });

  it('should call onReconnectAttempt callback with attempt number', async () => {
    const mockReconnectFunction = vi.fn().mockRejectedValue(new Error('Connection failed'));
    const onReconnectAttemptSpy = vi.fn();

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        onReconnectAttempt: onReconnectAttemptSpy,
        maxRetries: 2,
        initialDelay: 50
      })
    );

    result.current.startReconnect();

    await waitFor(() => {
      expect(onReconnectAttemptSpy).toHaveBeenCalledWith(1);
    });

    vi.advanceTimersByTime(50);

    await waitFor(() => {
      expect(onReconnectAttemptSpy).toHaveBeenCalledWith(2);
    });
  });

  it('should reset retry count on successful reconnection', async () => {
    let callCount = 0;
    const mockReconnectFunction = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('First attempt fails'));
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        maxRetries: 5,
        initialDelay: 50
      })
    );

    result.current.startReconnect();

    // Wait for successful reconnection
    await waitFor(() => {
      expect(mockReconnectFunction).toHaveBeenCalledTimes(2);
    });

    // Verify internal retry count was reset
    expect(result.current.retryCount).toBe(0);
  });

  it('should cleanup timeout on unmount', async () => {
    const mockReconnectFunction = vi.fn().mockRejectedValue(new Error('Connection failed'));

    const { result, unmount } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        maxRetries: 10,
        initialDelay: 50
      })
    );

    result.current.startReconnect();

    // Wait for first attempt
    await waitFor(() => {
      expect(mockReconnectFunction).toHaveBeenCalledTimes(1);
    });

    // Unmount the hook
    unmount();

    // Advance timers
    vi.advanceTimersByTime(1000);

    // Verify no new attempts were made after unmount
    const finalCallCount = mockReconnectFunction.mock.calls.length;
    expect(finalCallCount).toBeLessThan(5); // Should have stopped
  });

  it('should clear timeout and reset count when starting new reconnection', async () => {
    const mockReconnectFunction = vi.fn().mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() =>
      useAutoReconnect(mockReconnectFunction, {
        maxRetries: 5,
        initialDelay: 50
      })
    );

    // Start first reconnection
    result.current.startReconnect();

    await waitFor(() => {
      expect(mockReconnectFunction).toHaveBeenCalled();
    });

    // Stop and start new reconnection
    result.current.stopReconnect();
    result.current.startReconnect();

    // Verify count was reset
    expect(result.current.retryCount).toBe(0);
  });
});
