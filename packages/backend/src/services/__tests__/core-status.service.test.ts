import { describe, it, expect, beforeEach } from 'vitest';
import { CoreStatusService, type CoreStatusState } from '../core-status.service.js';

describe('CoreStatusService', () => {
  beforeEach(() => {
    // Reset the service state before each test
    CoreStatusService.reset();
  });

  describe('initial state', () => {
    it('should have Starting status after reset', () => {
      expect(CoreStatusService.getStatus()).toBe('Starting');
    });

    it('should have null startTime after reset', () => {
      const state = CoreStatusService.getState();
      expect(state.startTime).toBeNull();
    });

    it('should have null lastError after reset', () => {
      expect(CoreStatusService.getLastError()).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('should update status correctly', () => {
      CoreStatusService.setStatus('Running');
      expect(CoreStatusService.getStatus()).toBe('Running');
    });

    it('should store error message when provided', () => {
      CoreStatusService.setStatus('Error', 'Test error');
      expect(CoreStatusService.getLastError()).toBe('Test error');
    });

    it('should clear error when status becomes Running', () => {
      CoreStatusService.setStatus('Error', 'Some error');
      CoreStatusService.setStatus('Running');
      expect(CoreStatusService.getLastError()).toBeNull();
    });

    it('should set startTime when status becomes Running', () => {
      CoreStatusService.setStatus('Running');
      const state = CoreStatusService.getState();
      expect(state.startTime).not.toBeNull();
      expect(state.startTime).toBeGreaterThan(0);
    });
  });

  describe('markReady', () => {
    it('should set status to Running', () => {
      CoreStatusService.markReady();
      expect(CoreStatusService.getStatus()).toBe('Running');
    });

    it('should set startTime', () => {
      CoreStatusService.markReady();
      const state = CoreStatusService.getState();
      expect(state.startTime).not.toBeNull();
    });
  });

  describe('markStopped', () => {
    it('should set status to Stopped for normal exit (code 0)', () => {
      CoreStatusService.markStopped(0, null);
      expect(CoreStatusService.getStatus()).toBe('Stopped');
    });

    it('should set status to Error for non-zero exit code', () => {
      CoreStatusService.markStopped(1, null);
      expect(CoreStatusService.getStatus()).toBe('Error');
    });

    it('should set status to Stopped when terminated by signal', () => {
      CoreStatusService.markStopped(null, 'SIGTERM');
      expect(CoreStatusService.getStatus()).toBe('Stopped');
    });

    it('should include signal in error message', () => {
      CoreStatusService.markStopped(null, 'SIGKILL');
      expect(CoreStatusService.getLastError()).toContain('SIGKILL');
    });
  });

  describe('markTimeout', () => {
    it('should set status to Error', () => {
      CoreStatusService.markTimeout();
      expect(CoreStatusService.getStatus()).toBe('Error');
    });

    it('should set timeout error message', () => {
      CoreStatusService.markTimeout();
      expect(CoreStatusService.getLastError()).toContain('超时');
    });
  });

  describe('getUptime', () => {
    it('should return null when not running', () => {
      expect(CoreStatusService.getUptime()).toBeNull();
    });

    it('should return uptime when running', async () => {
      CoreStatusService.markReady();
      // Wait a bit to have some uptime
      await new Promise(resolve => setTimeout(resolve, 10));
      const uptime = CoreStatusService.getUptime();
      expect(uptime).not.toBeNull();
      expect(uptime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const state1 = CoreStatusService.getState();
      const state2 = CoreStatusService.getState();
      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2);  // Same values
    });
  });
});
