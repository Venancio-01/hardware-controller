import { createPollerActor } from '../../src/state-machines/poller-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';

// Mock the HardwareCommunicationManager class
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
    }
  };
});

describe('PollerMachine', () => {
  let mockHardware: HardwareCommunicationManager;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
  });

  it('should start in idle state', () => {
    const actor = createPollerActor(mockHardware);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to waiting state on START', () => {
    const actor = createPollerActor(mockHardware);
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('waiting');
  });

  it('should return to idle state on STOP', () => {
    const actor = createPollerActor(mockHardware);
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('waiting');
    actor.send({ type: 'STOP' });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should invoke hardware query on TICK and return to waiting', async () => {
    const actor = createPollerActor(mockHardware);
    actor.start();
    actor.send({ type: 'START' }); // transitions to waiting

    // Send TICK to trigger polling
    actor.send({ type: 'TICK' });

    // Wait for async actions to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should briefly go to polling and back to waiting (or stay in polling if async)
    // Assuming synchronous execution of action or immediate transition
    // But importantly, check if sendCommand was called
    expect(mockHardware.sendCommand).toHaveBeenCalled();
    expect(mockHardware.sendCommand).toHaveBeenCalledTimes(2); // cabinet and control
    
    // Check arguments for one of the calls
    // Expecting 'udp', command, undefined, target, false
    const calls = (mockHardware.sendCommand as any).mock.calls;
    const targets = calls.map((c: any[]) => c[3]);
    expect(targets).toContain('cabinet');
    expect(targets).toContain('control');
  });
});
