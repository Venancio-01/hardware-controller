import { createActor } from 'xstate';
import { monitorMachine } from '../../src/state-machines/monitor-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';

// Mock the HardwareCommunicationManager class
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
      getAllConnectionStatus = vi.fn(() => ({ tcp: { cabinet: 'connected' }, serial: { control: 'connected' } }));
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

  it('should detect door lock switch change using state aggregation even if edge flags are missing', () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    actor.send({ type: 'START' });

    // 1. Initial State: All 0 (using correct frame header EE FF C0 ...)
    const frame1 = Buffer.from([0xEE, 0xFF, 0xC0, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
    actor.send({ type: 'RELAY_DATA_RECEIVED', clientId: 'cabinet', data: frame1 });

    const context1 = actor.getSnapshot().context;
    expect(context1.aggregator['lastCombined'][2]).toBe(false);

    // 2. New State: Index 2 is 1 (Input State = 0x04)
    // Edge bytes (indices 6, 7) are 0x00. PROVING that we don't need edge flags.
    const frame2 = Buffer.from([0xEE, 0xFF, 0xC0, 0x01, 0x00, 0x04, 0x00, 0x00, 0x00]);
    actor.send({ type: 'RELAY_DATA_RECEIVED', clientId: 'cabinet', data: frame2 });

    const context2 = actor.getSnapshot().context;
    expect(context2.aggregator['lastCombined'][2]).toBe(true);
  });
});
