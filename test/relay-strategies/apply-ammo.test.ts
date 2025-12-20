import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { ApplyAmmoStrategy } from '../../src/relay-strategies/apply-ammo.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { StructuredLogger } from '../../src/logger/index.js';

// Mock VoiceBroadcastController
// Bun test mocking works differently. We can mock the module.
// However, since we are in Red phase, we just want to run the test and see it fail (or fail to compile).
// For simplicity in Bun, we'll spy on the methods if possible or use mock module if we can.
// But first, let's write the test assuming standard behavior.

// Note: We need to mock the singleton.
const broadcastMock = vi.fn();
vi.mock('../../src/voice-broadcast/index.js', () => {
  return {
    VoiceBroadcastController: {
      getInstance: () => ({
        broadcast: broadcastMock
      }),
      isInitialized: () => true
    }
  };
});

describe('ApplyAmmoStrategy', () => {
  let strategy: ApplyAmmoStrategy;
  let loggerMock: StructuredLogger;

  beforeEach(() => {
    // @ts-ignore
    strategy = new ApplyAmmoStrategy();
    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
    } as unknown as StructuredLogger;
    
    broadcastMock.mockClear();
  });

  // Helper to create state
  const createState = (cab1: boolean, con4: boolean): boolean[] => {
    const state = new Array(16).fill(false);
    state[0] = cab1; // Cabinet 1
    state[11] = con4; // Control 4 (8+3)
    return state;
  };

  it('should match when Cabinet 1 is closed', () => {
    const state = createState(true, false);
    expect(strategy.match(state)).toBe(true);
  });

  it('should NOT match when Cabinet 1 is open', () => {
    const state = createState(false, true);
    expect(strategy.match(state)).toBe(false);
  });

  it('should broadcast "Apply" on rising edge of Cabinet 1', async () => {
    const currentState = createState(true, false);
    // previous state: Cabinet 1 was Open
    const previousState = createState(false, false);

    await strategy.execute(currentState, loggerMock, previousState);

    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
  });

  it('should NOT broadcast "Apply" if Cabinet 1 was already closed', async () => {
    const currentState = createState(true, false);
    // previous state: Cabinet 1 was already Closed
    const previousState = createState(true, false);

    await strategy.execute(currentState, loggerMock, previousState);

    expect(broadcastMock).not.toHaveBeenCalled();
  });

  it('should broadcast "Authorized" when Cabinet 1 is closed AND Control 4 changes', async () => {
    const currentState = createState(true, true); // Control 4: Closed
    // Previous: Control 4 was Open
    const previousState = createState(true, false); 

    await strategy.execute(currentState, loggerMock, previousState);

    expect(broadcastMock).toHaveBeenCalledWith('授权通过，已开锁请打开柜门');
  });

   it('should broadcast "Authorized" when Cabinet 1 is closed AND Control 4 changes (Close -> Open)', async () => {
    const currentState = createState(true, false); // Control 4: Open
    // Previous: Control 4 was Closed
    const previousState = createState(true, true); 

    await strategy.execute(currentState, loggerMock, previousState);

    expect(broadcastMock).toHaveBeenCalledWith('授权通过，已开锁请打开柜门');
  });

  it('should handle undefined previousState gracefully (treat as all false/init)', async () => {
    const currentState = createState(true, false);
    await strategy.execute(currentState, loggerMock, undefined);
    
    // Treating undefined previous state as "all false" means Cabinet 1 rose from 0 to 1
    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
  });
});
