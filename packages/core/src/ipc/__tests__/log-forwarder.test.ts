import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { forwardLog, createForwardingLogger } from '../log-forwarder.js';
import { IpcMessages } from 'shared';

describe('log-forwarder', () => {
  let originalProcessSend: typeof process.send;

  beforeEach(() => {
    // Save original process.send
    originalProcessSend = process.send as typeof process.send;
    // Mock process.send
    (process as any).send = vi.fn();
  });

  afterEach(() => {
    // Restore original process.send
    if (originalProcessSend) {
      process.send = originalProcessSend;
    } else {
      delete (process as any).send;
    }
    vi.clearAllMocks();
  });

  describe('forwardLog', () => {
    it('should forward debug log via IPC', () => {
      const result = forwardLog('debug', 'Debug message');

      expect(result).toBe(true);
      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'debug',
          message: 'Debug message',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should forward info log via IPC', () => {
      const result = forwardLog('info', 'Info message');

      expect(result).toBe(true);
      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'info',
          message: 'Info message',
        }),
      });
    });

    it('should forward warn log via IPC', () => {
      const result = forwardLog('warn', 'Warning message');

      expect(result).toBe(true);
      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'warn',
          message: 'Warning message',
        }),
      });
    });

    it('should forward error log via IPC', () => {
      const result = forwardLog('error', 'Error message');

      expect(result).toBe(true);
      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'error',
          message: 'Error message',
        }),
      });
    });

    it('should include context when provided', () => {
      const context = { userId: 123, action: 'test' };
      forwardLog('info', 'With context', context);

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          context: { userId: 123, action: 'test' },
        }),
      });
    });

    it('should return false when IPC is not available', () => {
      delete (process as any).send;

      const result = forwardLog('info', 'Message');

      expect(result).toBe(false);
    });

    it('should include ISO timestamp in payload', () => {
      forwardLog('info', 'Test');

      const call = (process.send as any).mock.calls[0][0];
      expect(new Date(call.payload.timestamp).toISOString()).toBe(call.payload.timestamp);
    });
  });

  describe('createForwardingLogger', () => {
    it('should create a logger with all log methods', () => {
      const logger = createForwardingLogger('TestModule');

      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });

    it('should forward debug logs with module prefix', () => {
      const logger = createForwardingLogger('TestModule');

      logger.debug('Debug message');

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'debug',
          message: '[TestModule] Debug message',
        }),
      });
    });

    it('should forward info logs with module prefix', () => {
      const logger = createForwardingLogger('TestModule');

      logger.info('Info message');

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'info',
          message: '[TestModule] Info message',
        }),
      });
    });

    it('should forward warn logs with module prefix', () => {
      const logger = createForwardingLogger('TestModule');

      logger.warn('Warning message');

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'warn',
          message: '[TestModule] Warning message',
        }),
      });
    });

    it('should forward error logs with module prefix', () => {
      const logger = createForwardingLogger('TestModule');

      logger.error('Error message');

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'error',
          message: '[TestModule] Error message',
        }),
      });
    });

    it('should handle Error objects in error logs', () => {
      const logger = createForwardingLogger('TestModule');
      const error = new Error('Test error');

      logger.error('Something failed', error);

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          level: 'error',
          message: '[TestModule] Something failed: Test error',
          context: expect.objectContaining({
            stack: expect.any(String),
          }),
        }),
      });
    });

    it('should pass context to forwarded logs', () => {
      const logger = createForwardingLogger('TestModule');

      logger.info('With context', { key: 'value' });

      expect(process.send).toHaveBeenCalledWith({
        type: IpcMessages.CORE.LOG,
        payload: expect.objectContaining({
          context: { key: 'value' },
        }),
      });
    });
  });
});
