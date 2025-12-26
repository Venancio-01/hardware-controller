import { ChildProcess, fork } from 'child_process';
import * as path from 'path';
import { logger } from 'shared';
import { IpcMessages } from 'shared';

export class CoreProcessManager {
  private child: ChildProcess | null = null;
  private readonly RESTART_DELAY_MS = 3000;
  private isShuttingDown = false;
  private currentScriptPath: string | null = null;
  private currentOptions: { execArgv?: string[] } = {};

  constructor() {}

  /**
   * Start the Core process
   */
  start(scriptPath: string, options: { execArgv?: string[] } = {}): void {
    this.currentScriptPath = scriptPath;
    this.currentOptions = options;
    if (this.child) {
      logger.warn('Core process already running. Skipping start.');
      return;
    }

    this.isShuttingDown = false;

    logger.info(`Starting Core process from: ${scriptPath}`);

    try {
       // Using fork to spawn a node process
      this.child = fork(scriptPath, [], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        execArgv: options.execArgv,
        env: {
          ...process.env,
          // Ensure child knows it's a child
          IS_CORE_CHILD: 'true'
        }
      });

      if (!this.child.pid) {
          logger.error('Failed to spawn Core process (no PID)');
          this.child = null;
          return;
      }

      logger.info(`Core process spawned with PID: ${this.child.pid}`);

      this.setupListeners();

    } catch (error) {
      logger.error(`Error starting Core process: ${error}`);
      this.child = null;
    }
  }

  /**
   * Stop the Core process gracefully
   */
  async stop(timeoutMs = 5000): Promise<void> {
    if (!this.child) {
      logger.info('Core process not running.');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Stopping Core process (PID: ${this.child.pid})...`);

    return new Promise<void>((resolve) => {
      if (!this.child) {
        resolve();
        return;
      }

      const killTimer = setTimeout(() => {
        if (this.child) {
          logger.warn(`Core process did not exit within ${timeoutMs}ms. Sending SIGKILL...`);
          this.child.kill('SIGKILL');
          this.child = null; // Assume gone
          resolve();
        }
      }, timeoutMs);

      // Listener for exit is already there, but we need to resolve this promise
      this.child.once('exit', (code, signal) => {
        clearTimeout(killTimer);
        logger.info(`Core process exited with code ${code} and signal ${signal}`);
        this.child = null;
        resolve();
      });

      // Send SIGTERM
      this.child.kill('SIGTERM');
    });
  }

  private setupListeners(): void {
    if (!this.child) return;

    this.child.on('message', (message: any) => {
      // Handle IPC messages from Core
      // Casting to any to avoid logger type issues for now or matching string-first signature
      logger.debug(`Received IPC message from Core: ${JSON.stringify(message)}`);

      // Here we would handle specific messages like CORE:READY
      // For now, just logging is enough as per requirement validation
    });

    this.child.on('error', (err) => {
      logger.error(`Core process error: ${err.message || err}`);
    });

    this.child.on('exit', (code, signal) => {
      logger.info(`Core process exited (code=${code}, signal=${signal})`);
      this.child = null;

        if (!this.isShuttingDown) {
          logger.warn(`Core process exited unexpectedly. Restarting in ${this.RESTART_DELAY_MS}ms...`);
          setTimeout(() => {
             // Re-start using the same parameters.
             // We need to capture the scriptPath and options from start() or store them.
             // Since we don't have them stored, we should store them in start().
             if (!this.isShuttingDown) {
                 this.start(this.currentScriptPath!, this.currentOptions);
             }
          }, this.RESTART_DELAY_MS);
        }
    });
  }
}
