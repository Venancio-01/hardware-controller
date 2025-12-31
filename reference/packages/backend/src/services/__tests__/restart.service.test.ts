import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RestartService } from '../restart.service';
import { spawn } from 'child_process';

// Create stable mock logger instance
const mockLoggerInstance = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock dependencies
vi.mock('shared', () => ({
  createModuleLogger: vi.fn(() => mockLoggerInstance)
}));

vi.mock('../../utils/shutdown-manager.js', () => ({
  shutdownManager: {
    registerHandler: vi.fn(),
    executeShutdown: vi.fn().mockResolvedValue(true),
    clearHandlers: vi.fn(),
    reset: vi.fn()
  }
}));

vi.mock('child_process');

describe('RestartService', () => {
  let restartService: RestartService;
  let mockShutdownManager: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Use the stable mock logger instance
    mockLogger = mockLoggerInstance;

    // Get mock shutdown manager
    const { shutdownManager } = await import('../../utils/shutdown-manager.js');
    mockShutdownManager = shutdownManager as any;

    // Get singleton instance
    restartService = RestartService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('restartSystem', () => {
    it('should prevent duplicate restart requests', async () => {
      // Mock first call succeeds
      mockShutdownManager.executeShutdown.mockResolvedValue(true);
      vi.mocked(spawn).mockReturnValue({
        on: vi.fn()
      } as any);

      // Call restart twice
      const firstCall = restartService.restartSystem();
      const secondCall = restartService.restartSystem();

      await firstCall;
      await secondCall;

      // Verify first call succeeded, second was rejected
      expect(mockShutdownManager.executeShutdown).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Restart already in progress, skipping duplicate request'
      );
    });

    it('should execute graceful shutdown sequence in correct order', async () => {
      // Mock successful shutdown
      mockShutdownManager.executeShutdown.mockResolvedValue(true);
      const mockChild = {
        on: vi.fn()
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const result = await restartService.restartSystem();

      expect(result).toBe(true);
      expect(mockShutdownManager.executeShutdown).toHaveBeenCalled();

      // Verify logging sequence
      expect(mockLogger.info).toHaveBeenCalledWith('Initiating system restart sequence');
      expect(mockLogger.info).toHaveBeenCalledWith('Notifying state machines of impending shutdown');
      expect(mockLogger.info).toHaveBeenCalledWith('Executing graceful shutdown sequence');
      expect(mockLogger.info).toHaveBeenCalledWith('Executing process restart');
    });

    it('should spawn new process with correct arguments', async () => {
      // Mock shutdown success
      mockShutdownManager.executeShutdown.mockResolvedValue(true);

      const mockChild = {
        on: vi.fn()
      };
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(mockChild as any);

      await restartService.restartSystem();

      // Wait for spawn call
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify spawn was called with correct arguments
      expect(mockSpawn).toHaveBeenCalledWith(
        process.argv[0],
        process.argv.slice(1),
        expect.objectContaining({
          detached: true,
          stdio: 'inherit',
          env: expect.objectContaining({
            NODE_SWITCH_RESTARTING: 'true'
          })
        })
      );
    });

    it('should handle shutdown manager failures gracefully', async () => {
      // Mock shutdown failure
      mockShutdownManager.executeShutdown.mockResolvedValue(false);

      const mockChild = {
        on: vi.fn()
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const result = await restartService.restartSystem();

      // Should still proceed with restart
      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Some shutdown handlers failed, proceeding with restart anyway'
      );
    });

    it('should handle process spawn errors', async () => {
      // Mock shutdown success
      mockShutdownManager.executeShutdown.mockResolvedValue(true);

      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            // Simulate spawn error immediately
            setTimeout(() => callback(new Error('Spawn failed')), 0);
          }
        })
      };
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      // Wait for async operations
      await restartService.restartSystem();
      await new Promise(resolve => setTimeout(resolve, 600));

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error)
        }),
        'Failed to spawn child process'
      );
    });

    it('should handle unexpected errors during restart', async () => {
      // Mock shutdown throwing error
      mockShutdownManager.executeShutdown.mockRejectedValue(
        new Error('Unexpected shutdown error')
      );

      await expect(restartService.restartSystem()).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        }),
        'Failed to initiate restart sequence'
      );

      // Verify isRestarting flag was reset
      const secondCall = restartService.restartSystem();
      await expect(secondCall).resolves.toBeDefined();
    });
  });

  describe('registerHandler on construction', () => {
    it('should register XState actors shutdown handler on construction', () => {
      expect(mockShutdownManager.registerHandler).toHaveBeenCalledWith(
        'xstate-actors',
        expect.any(Function)
      );
    });

    it('should register hardware connections shutdown handler on construction', () => {
      expect(mockShutdownManager.registerHandler).toHaveBeenCalledWith(
        'hardware-connections',
        expect.any(Function)
      );
    });

    it('should execute registered handlers on shutdown', async () => {
      // Capture the registered handler functions
      const handlers: Map<string, Function> = new Map();
      mockShutdownManager.registerHandler.mockImplementation((name: string, handler: Function) => {
        handlers.set(name, handler);
      });

      // Create new instance to trigger registration
      const service = new (RestartService as any)();

      // Execute the XState handler
      const xstateHandler = handlers.get('xstate-actors');
      if (xstateHandler) {
        await xstateHandler();
        expect(mockLogger.info).toHaveBeenCalledWith('Notifying state machines of impending shutdown');
      }

      // Execute the hardware handler
      const hardwareHandler = handlers.get('hardware-connections');
      if (hardwareHandler) {
        await hardwareHandler();
        expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up hardware connections');
      }
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = RestartService.getInstance();
      const instance2 = RestartService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
