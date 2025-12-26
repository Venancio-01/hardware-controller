import { createActor } from 'xstate';
import { monitorMachine } from '../../src/state-machines/monitor-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';

// Mock the HardwareCommunicationManager class
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
    }
  };
});

describe('MonitorMachine', () => {
  let mockHardware: HardwareCommunicationManager;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
  });

  it('should start in idle state', () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to waiting state on START', () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('waiting');
  });

  it('should return to idle state on STOP', () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('waiting');
    actor.send({ type: 'STOP' });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should stay in waiting state on TICK', async () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    actor.send({ type: 'START' });

    actor.send({ type: 'TICK' });

    // Wait for async actions
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(actor.getSnapshot().value).toBe('waiting');
  });
});
