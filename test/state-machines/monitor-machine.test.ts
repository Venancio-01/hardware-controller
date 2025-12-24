import { setup, createActor } from 'xstate';
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

  it('should invoke hardware query on TICK and return to waiting', async () => {
    const actor = createActor(monitorMachine, { input: { hardware: mockHardware } });
    actor.start();
    actor.send({ type: 'START' });

    actor.send({ type: 'TICK' });

    // Wait for async actions
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(mockHardware.sendCommand).toHaveBeenCalled();
    expect(mockHardware.sendCommand).toHaveBeenCalledTimes(2);
    
    const calls = (mockHardware.sendCommand as any).mock.calls;
    const targets = calls.map((c: any[]) => c[3]);
    expect(targets).toContain('cabinet');
    expect(targets).toContain('control');
  });

  it('should send monitor_anomaly to parent on hardware failure', async () => {
    mockHardware.sendCommand = vi.fn().mockRejectedValue(new Error('Network timeout'));
    
    let receivedAnomaly = false;
    const parentMachine = setup({
      actors: { monitor: monitorMachine }
    }).createMachine({
      invoke: {
        src: 'monitor',
        id: 'monitor',
        input: { hardware: mockHardware }
      },
      on: {
        monitor_anomaly: {
          actions: () => { receivedAnomaly = true; }
        }
      }
    });

    const parentActor = createActor(parentMachine);
    parentActor.start();
    
    const monitorActor = parentActor.getSnapshot().children.monitor;
    monitorActor.send({ type: 'START' });
    monitorActor.send({ type: 'TICK' });

    // Wait for async action
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(receivedAnomaly).toBe(true);
  });
});