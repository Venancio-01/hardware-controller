import { createMainActor } from '../../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { EventPriority } from '../../src/types/state-machine.js';

// Mock the HardwareCommunicationManager class
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
    }
  };
});

describe('MainMachine', () => {
  let mockHardware: HardwareCommunicationManager;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
  });

  it('should start in idle state', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to normal on apply_request (P2)', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
  });

  it('should transition to alarm on key_detected (P0) from idle', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    actor.send({ type: 'key_detected', priority: EventPriority.P0 });
    expect(actor.getSnapshot().value).toBe('alarm');
  });

  it('should transition to alarm on key_detected (P0) from normal', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
    
    actor.send({ type: 'key_detected', priority: EventPriority.P0 });
    expect(actor.getSnapshot().value).toBe('alarm');
  });

  it('should return to idle from normal on operation_complete (P2)', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
    
    actor.send({ type: 'operation_complete', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should spawn monitor actor on start', () => {
    const actor = createMainActor(mockHardware);
    actor.start();
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.children.monitor).toBeDefined();
  });
});
