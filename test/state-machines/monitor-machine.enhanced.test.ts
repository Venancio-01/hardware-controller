import { setup, createActor } from 'xstate';
import { monitorMachine } from '../../src/state-machines/monitor-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventPriority } from '../../src/types/state-machine.js';
import { config } from '../../src/config/index.js';

// Mock the HardwareCommunicationManager class
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
      onIncomingData?: Function;
    }
  };
});

describe('MonitorMachine - Enhanced Subscriptions', () => {
  let mockHardware: HardwareCommunicationManager;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
    vi.clearAllMocks();
  });

  it('should notify parent of business events when relay status changes', async () => {
    let receivedEvents: any[] = [];
    const cabinetIndexes = new Set<number>();
    const controlIndexes = new Set<number>();

    const buildStatusPayload = (indexes: Set<number>, offset: number) => {
      const bits = Array.from({ length: 8 }, () => '0');
      indexes.forEach((index) => {
        if (index >= offset && index < offset + 8) {
          bits[index - offset] = '1';
        }
      });
      return `dostatus${bits.join('')}`;
    };

    const sendStatus = (clientId: 'cabinet' | 'control') => {
      const payload = clientId === 'cabinet'
        ? buildStatusPayload(cabinetIndexes, 0)
        : buildStatusPayload(controlIndexes, 8);
      mockHardware.onIncomingData?.('udp', clientId, Buffer.from(payload), { address: '127.0.0.1', port: 8000 }, {});
    };
    
    const parentMachine = setup({
      actors: { monitor: monitorMachine }
    }).createMachine({
      invoke: {
        src: 'monitor',
        id: 'monitor',
        input: { hardware: mockHardware }
      },
      on: {
        '*': {
          actions: ({ event }) => {
            // Only collect relevant business events
            if (['apply_request', 'authorize_request', 'cabinet_lock_changed', 'finish_request', 'refuse_request', 'alarm_cancel_toggled'].includes(event.type)) {
                receivedEvents.push(event);
            }
          }
        }
      }
    });

    const parentActor = createActor(parentMachine);
    parentActor.start();
    
    // Wait for actor to initialize and entry actions to run
    await new Promise(resolve => setTimeout(resolve, 50));

    // Ensure subscription is established
    expect(mockHardware.onIncomingData).toBeDefined();

    // Simulate Hardware Data Callback
    // 1. Initial State
    sendStatus('cabinet');
    sendStatus('control');
    await new Promise(resolve => setTimeout(resolve, 50));

    // 2. CH1 (Index 0) Closed -> apply_request
    cabinetIndexes.add(config.APPLY_INDEX);
    sendStatus('cabinet');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'apply_request', priority: EventPriority.P2 }));

    receivedEvents = [];
    controlIndexes.add(config.ELECTRIC_LOCK_OUT_INDEX);
    sendStatus('control');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'authorize_request', priority: EventPriority.P2 }));


    // Ensure CH1 logic was NOT triggered again
    expect(receivedEvents.filter(e => e.type === 'apply_request').length).toBe(0);

    // 4. CABINET_DOOR_INDEX (CH2) changed -> cabinet_lock_changed
    receivedEvents = [];
    const doorClientId = config.CABINET_DOOR_INDEX >= 8 ? 'control' : 'cabinet';
    if (doorClientId === 'control') {
      controlIndexes.add(config.CABINET_DOOR_INDEX);
    } else {
      cabinetIndexes.add(config.CABINET_DOOR_INDEX);
    }
    sendStatus(doorClientId);
    await new Promise(resolve => setTimeout(resolve, 50));
    // 柜门状态：high (true) = 开门，所以 isClosed 应该是 false
    expect(receivedEvents).toContainEqual(expect.objectContaining({
        type: 'cabinet_lock_changed',
        priority: EventPriority.P2,
        isClosed: false  // high = 开门 = isClosed: false
    }));

    // 5. 测试柜门从 high 变为 low 的场景（关门）
    receivedEvents = [];
    if (doorClientId === 'control') {
      controlIndexes.delete(config.CABINET_DOOR_INDEX);
    } else {
      cabinetIndexes.delete(config.CABINET_DOOR_INDEX);
    }
    sendStatus(doorClientId);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
        type: 'cabinet_lock_changed',
        priority: EventPriority.P2,
        isClosed: true  // low = 关门 = isClosed: true
    }));

    // 6. ALARM_STATUS_INDEX (CH11) changed -> alarm_cancel_toggled
    receivedEvents = [];
    const alarmClientId = config.ALARM_STATUS_INDEX >= 8 ? 'control' : 'cabinet';
    if (alarmClientId === 'control') {
      controlIndexes.add(config.ALARM_STATUS_INDEX);
    } else {
      cabinetIndexes.add(config.ALARM_STATUS_INDEX);
    }
    sendStatus(alarmClientId);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'alarm_cancel_toggled',
      priority: EventPriority.P2
    }));

    // 测试 toggle：再次改变状态
    receivedEvents = [];
    if (alarmClientId === 'control') {
      controlIndexes.delete(config.ALARM_STATUS_INDEX);
    } else {
      cabinetIndexes.delete(config.ALARM_STATUS_INDEX);
    }
    sendStatus(alarmClientId);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Toggle 按钮每次状态变化都应该触发事件
    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'alarm_cancel_toggled',
      priority: EventPriority.P2
    }));
  });
});
