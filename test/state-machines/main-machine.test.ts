import { createMainActor } from '../../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { EventPriority } from '../../src/types/state-machine.js';
import { type StructuredLogger } from '../../src/logger/index.js';

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
  let mockLogger: StructuredLogger;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as StructuredLogger;
  });

  it('should start in idle state', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to normal on apply_request (P2)', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
  });

  it('should transition to alarm on key_detected (P0) from idle', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'key_detected', priority: EventPriority.P0 });
    expect(actor.getSnapshot().value).toBe('alarm');
  });

  it('should transition to alarm on key_detected (P0) from normal', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
    
    actor.send({ type: 'key_detected', priority: EventPriority.P0 });
    expect(actor.getSnapshot().value).toBe('alarm');
  });

  it('should return to idle from normal on operation_complete (P2)', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('normal');
    
    actor.send({ type: 'operation_complete', priority: EventPriority.P2 });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should spawn monitor actor on start', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.children.monitor).toBeDefined();
  });

  it('should transition to alarm on monitor_anomaly from monitor actor', async () => {
    mockHardware.sendCommand = vi.fn().mockRejectedValue(new Error('Hardware Error'));
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    
    const monitorActor = actor.getSnapshot().children.monitor;
    monitorActor.send({ type: 'START' });
    monitorActor.send({ type: 'TICK' });

    // Wait for async poll and sendParent
    await new Promise(resolve => setTimeout(resolve, 30));

    expect(actor.getSnapshot().value).toBe('alarm');
  });

  it('should spawn applyAmmo actor in normal state', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.children.applyAmmo).toBeDefined();
  });

  it('should return to idle when applyAmmo sends operation_complete', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    
    const applyAmmoActor = actor.getSnapshot().children.applyAmmo;
    // Simulate finishing the flow
    applyAmmoActor.send({ type: 'FINISHED' });

    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should forward cabinet_lock_changed to applyAmmo actor', () => {
    const actor = createMainActor(mockHardware, mockLogger);
    actor.start();
    actor.send({ type: 'apply_request', priority: EventPriority.P2 });
    
    const applyAmmoActor = actor.getSnapshot().children.applyAmmo;
    
    // Initial state of child
    expect(applyAmmoActor.getSnapshot().value).toBe('idle');
    applyAmmoActor.send({ type: 'APPLY' });
    applyAmmoActor.send({ type: 'AUTHORIZED' });
    expect(applyAmmoActor.getSnapshot().value).toBe('authorized');

    // Send global event to Main
    actor.send({ type: 'cabinet_lock_changed', priority: EventPriority.P2, isClosed: false });

    // Verify child transitioned
    expect(applyAmmoActor.getSnapshot().value).toBe('door_open');
  });
});
