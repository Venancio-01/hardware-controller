import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreProcessManager } from '../core-process-manager.js';
import { ChildProcess, fork } from 'child_process';
import { IpcMessages } from 'shared';
import path from 'path';

// Mock child_process
vi.mock('child_process', () => ({
  fork: vi.fn()
}));

describe('CoreProcessManager', () => {
    let processManager: CoreProcessManager;
    let mockChildProcess: any;

    beforeEach(() => {
        // Reset mocks
        vi.resetAllMocks();

        // Setup mock child process
        mockChildProcess = {
          pid: 12345,
          send: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
          kill: vi.fn(),
          exitCode: null
        };

        (fork as any).mockReturnValue(mockChildProcess);

        processManager = new CoreProcessManager();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('start', () => {
        it('should spawn a child process', () => {
            const scriptPath = '/path/to/core/index.js';
            processManager.start(scriptPath);

            expect(fork).toHaveBeenCalledWith(scriptPath, [], expect.any(Object));
        });

        it('should not spawn if already running', () => {
             const scriptPath = '/path/to/core/index.js';
             processManager.start(scriptPath);
             processManager.start(scriptPath);

             expect(fork).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop', () => {
        it('should stop the process if running', async () => {
             const scriptPath = '/path/to/core/index.js';
             processManager.start(scriptPath);

             // Capture the exit listener
             let exitCallback: any;
             mockChildProcess.once.mockImplementation((event: string, cb: any) => {
                 if (event === 'exit') {
                     exitCallback = cb;
                 }
             });

             const stopPromise = processManager.stop();

             // Verify SIGTERM sent immediately
             expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');

             // Manually trigger exit to resolve the promise
             if (exitCallback) {
                 exitCallback(0, null);
             }

             await stopPromise;
        });

        it('should force kill if timeout reached', async () => {
             const scriptPath = '/path/to/core/index.js';
             processManager.start(scriptPath);

             // Simulate NO exit (timeout)
             // We need to use fake timers for this test ideally, but for simplicity
             // we assume the implementation handles timeout.

             // Mock exit to never happen automatically

             // In a real unit test for timeout, we use vi.useFakeTimers()
             vi.useFakeTimers();

             const stopPromise = processManager.stop();

             // Fast-forward time
             vi.advanceTimersByTime(6000); // > 5000ms default

             // SIGTERM should be called immediately
             expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');

             // SIGKILL should be called after timeout
             expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGKILL');

             vi.useRealTimers();
        });
    });
});
