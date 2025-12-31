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
      queueCommand = vi.fn();
      onIncomingData?: Function;
      getAllConnectionStatus = vi.fn(() => ({ tcp: {}, serial: {} }));
    }
  };
});

// Mock VoiceBroadcast 模块
const mockCabinetBroadcast = vi.fn(() => Promise.resolve(true));
const mockControlBroadcast = vi.fn(() => Promise.resolve(true));
vi.mock('../../src/voice-broadcast/index.js', () => {
  return {
    VoiceBroadcast: {
      getInstance: () => ({
        cabinet: { broadcast: mockCabinetBroadcast },
        control: { broadcast: mockControlBroadcast }
      })
    }
  };
});

describe('MonitorMachine - Enhanced Subscriptions', () => {
  let mockHardware: HardwareCommunicationManager;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
    vi.clearAllMocks();
  });

  it('should notify parent of business events when input edges arrive', async () => {
    let receivedEvents: any[] = [];
    const cabinetIndexes = new Set<number>();
    const controlIndexes = new Set<number>();

    const maskFromIndexes = (indexes: Set<number>, offset: number) => {
      let mask = 0x00;
      indexes.forEach((index) => {
        if (index >= offset && index < offset + 8) {
          mask |= 1 << (index - offset);
        }
      });
      return mask;
    };

    const buildActiveReport = (inputMask: number, risingMask: number, fallingMask: number) => {
      return Buffer.from([
        0xEE,
        0xFF,
        0xC0,
        0x01,
        0x00,
        inputMask & 0xFF,
        risingMask & 0xFF,
        fallingMask & 0xFF,
        0x00
      ]);
    };

    const sendReport = (clientId: 'cabinet' | 'control', rising: Set<number> = new Set(), falling: Set<number> = new Set()) => {
      const offset = clientId === 'cabinet' ? 0 : 8;
      const inputMask = maskFromIndexes(clientId === 'cabinet' ? cabinetIndexes : controlIndexes, offset);
      const risingMask = maskFromIndexes(rising, offset);
      const fallingMask = maskFromIndexes(falling, offset);
      const payload = buildActiveReport(inputMask, risingMask, fallingMask);
      mockHardware.onIncomingData?.('tcp', clientId, payload, { address: '127.0.0.1', port: 8000 }, { success: true, timestamp: Date.now() });
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
            if (['apply_request', 'authorize_request', 'cabinet_lock_changed', 'finish_request', 'refuse_request', 'alarm_cancel_toggled', 'vibration_detected'].includes(event.type)) {
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
    sendReport('cabinet');
    sendReport('control');
    await new Promise(resolve => setTimeout(resolve, 50));

    // 2. CH1 (Index 0) Closed -> apply_request
    cabinetIndexes.add(config.APPLY_INDEX);
    sendReport('cabinet', new Set([config.APPLY_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'apply_request', priority: EventPriority.P2 }));

    receivedEvents = [];
    controlIndexes.add(config.AUTH_PASS_INDEX);
    sendReport('control', new Set([config.AUTH_PASS_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'authorize_request', priority: EventPriority.P2 }));


    // Ensure CH1 logic was NOT triggered again
    expect(receivedEvents.filter(e => e.type === 'apply_request').length).toBe(0);

    // Verify NO refuse_request on AUTH_PASS_INDEX open (falling edge)
    receivedEvents = [];
    controlIndexes.delete(config.AUTH_PASS_INDEX);
    sendReport('control', new Set(), new Set([config.AUTH_PASS_INDEX])); // Falling edge
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(receivedEvents.filter(e => e.type === 'refuse_request').length).toBe(0);

    // Verify refuse_request on AUTH_CANCEL_INDEX close (rising edge)
    receivedEvents = [];
    controlIndexes.add(config.AUTH_CANCEL_INDEX);
    sendReport('control', new Set([config.AUTH_CANCEL_INDEX])); // Rising edge
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'refuse_request', priority: EventPriority.P2 }));

    // 4. CABINET_DOOR_INDEX (CH2) changed -> cabinet_lock_changed
    receivedEvents = [];
    const doorClientId = config.CABINET_DOOR_INDEX >= 8 ? 'control' : 'cabinet';
    if (doorClientId === 'control') {
      controlIndexes.add(config.CABINET_DOOR_INDEX);
    } else {
      cabinetIndexes.add(config.CABINET_DOOR_INDEX);
    }
    sendReport(doorClientId, new Set([config.CABINET_DOOR_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));
    // 柜门状态：high (true) = 开门，所以 isClosed 应该是 false
    expect(receivedEvents).toContainEqual(expect.objectContaining({
        type: 'cabinet_lock_changed',
        priority: EventPriority.P2,
      isClosed: true  // high = 闭合 = isClosed: true (NC sensor logic: Closed circuit = Door Closed)
    }));

    // 5. 测试柜门从 high 变为 low 的场景（关门）
    receivedEvents = [];
    if (doorClientId === 'control') {
      controlIndexes.delete(config.CABINET_DOOR_INDEX);
    } else {
      cabinetIndexes.delete(config.CABINET_DOOR_INDEX);
    }
    sendReport(doorClientId, new Set(), new Set([config.CABINET_DOOR_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
        type: 'cabinet_lock_changed',
        priority: EventPriority.P2,
      isClosed: false  // low = 断开 = 开门 = isClosed: false
    }));

    // 6. ALARM_CANCEL_INDEX (CH11) changed -> alarm_cancel_toggled
    receivedEvents = [];
    const alarmClientId = config.ALARM_CANCEL_INDEX >= 8 ? 'control' : 'cabinet';
    if (alarmClientId === 'control') {
      controlIndexes.add(config.ALARM_CANCEL_INDEX);
    } else {
      cabinetIndexes.add(config.ALARM_CANCEL_INDEX);
    }
    sendReport(alarmClientId, new Set([config.ALARM_CANCEL_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'alarm_cancel_toggled',
      priority: EventPriority.P2
    }));

    // 测试 toggle：再次改变状态
    receivedEvents = [];
    if (alarmClientId === 'control') {
      controlIndexes.delete(config.ALARM_CANCEL_INDEX);
    } else {
      cabinetIndexes.delete(config.ALARM_CANCEL_INDEX);
    }
    sendReport(alarmClientId, new Set(), new Set([config.ALARM_CANCEL_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));

    // Toggle 按钮每次状态变化都应该触发事件
    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'alarm_cancel_toggled',
      priority: EventPriority.P2
    }));
  });

  it('should broadcast vibration alarm when VIBRATION_SWITCH_INDEX is triggered', async () => {
    let receivedEvents: any[] = [];
    const cabinetIndexes = new Set<number>();

    const maskFromIndexes = (indexes: Set<number>, offset: number) => {
      let mask = 0x00;
      indexes.forEach((index) => {
        if (index >= offset && index < offset + 8) {
          mask |= 1 << (index - offset);
        }
      });
      return mask;
    };

    const buildActiveReport = (inputMask: number, risingMask: number, fallingMask: number) => {
      return Buffer.from([
        0xEE,
        0xFF,
        0xC0,
        0x01,
        0x00,
        inputMask & 0xFF,
        risingMask & 0xFF,
        fallingMask & 0xFF,
        0x00
      ]);
    };

    const sendReport = (clientId: 'cabinet' | 'control', rising: Set<number> = new Set(), falling: Set<number> = new Set()) => {
      const offset = clientId === 'cabinet' ? 0 : 8;
      const inputMask = maskFromIndexes(cabinetIndexes, offset);
      const risingMask = maskFromIndexes(rising, offset);
      const fallingMask = maskFromIndexes(falling, offset);
      const payload = buildActiveReport(inputMask, risingMask, fallingMask);
      mockHardware.onIncomingData?.('tcp', clientId, payload, { address: '127.0.0.1', port: 8000 }, { success: true, timestamp: Date.now() });
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
            if (event.type === 'vibration_detected') {
              receivedEvents.push(event);
            }
          }
        }
      }
    });

    const parentActor = createActor(parentMachine);
    parentActor.start();

    await new Promise(resolve => setTimeout(resolve, 50));

    // 初始化状态
    sendReport('cabinet');
    await new Promise(resolve => setTimeout(resolve, 50));

    // 清除初始化时的 mock 调用
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 触发震动开关：从 close（默认，低电平）变为 open（触发，高电平）
    // 这意味着 rising edge 触发
    cabinetIndexes.add(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set([config.VIBRATION_SWITCH_INDEX]), new Set());
    await new Promise(resolve => setTimeout(resolve, 50));

    // 验证柜子端和控制端都被调用播报 "柜体震动报警"
    // expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜体震动报警');
    // expect(mockControlBroadcast).toHaveBeenCalledWith('柜体震动报警');

    // MIGRATION NOTE: Logic moved to AlarmMachine. MonitorMachine only emits event now.

    // 验证事件被捕获 (moved to end of test block)

    // 清除 mock 记录，准备验证防抖
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();
    (mockHardware.queueCommand as any).mockClear();

    // 立即再次触发（应该被防抖拦截）
    // 为了模拟“再次触发”，我们需要先让它变为 close (falling edge)，然后再 open (rising edge)
    // 或者发送只有 rising edge 的包（如果逻辑只要 rising edge 就出发）
    // hasEdgeChanged 检查 risingEdge.includes(index) || fallingEdge.includes(index)
    // 然后检查 combinedState[index] 是否为 true (open)

    // 模拟一次 Falling Edge (恢复闭合/未触发状态)
    cabinetIndexes.delete(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set(), new Set([config.VIBRATION_SWITCH_INDEX]));
    await new Promise(resolve => setTimeout(resolve, 50));

    // 再次触发 Rising Edge (触发/断开状态)
    cabinetIndexes.add(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set([config.VIBRATION_SWITCH_INDEX]), new Set());
    await new Promise(resolve => setTimeout(resolve, 50));

    // 应该没有调用（防抖中）
    expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    expect(mockControlBroadcast).not.toHaveBeenCalled();
    expect(mockHardware.queueCommand).not.toHaveBeenCalled();

    // 前进 2 分钟 + 1 秒
    // 由于 monitorMachine 使用 Date.now()，我们需要 mock System time 或者等待
    // 这里我们使用 vi.useFakeTimers 在测试开始前 mock 时间会更好，但这里我们可以修改 monitorMachine 的 Date.now
    // 或者简单点，我们修改 monitorMachine 的 context.lastVibrationTime (如果能访问到 actor 实例)
    // 但 monitorMachine 是封装在 actor 里的。

    // 清除之前的事件，准备验证节流
    receivedEvents = [];

    // 更好的方式是 mock Date
    vi.useFakeTimers();
    // 默认配置是 5000ms，我们测试 3000ms (不足)
    vi.setSystemTime(Date.now() + 3000);

    // 再次触发
    // 先复位
    cabinetIndexes.delete(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set(), new Set([config.VIBRATION_SWITCH_INDEX]));
    await vi.advanceTimersByTimeAsync(50);

    // 再触发
    cabinetIndexes.add(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set([config.VIBRATION_SWITCH_INDEX]), new Set());
    await vi.advanceTimersByTimeAsync(50);

    // 验证应该没有发出新事件 (节流中)
    expect(receivedEvents.length).toBe(0);

    // 再过 2001ms (总共 5001ms > 5000ms)
    vi.setSystemTime(Date.now() + 2001);

    // 再次触发
    // 先复位
    cabinetIndexes.delete(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set(), new Set([config.VIBRATION_SWITCH_INDEX]));
    await vi.advanceTimersByTimeAsync(50);

    // 再触发
    cabinetIndexes.add(config.VIBRATION_SWITCH_INDEX);
    sendReport('cabinet', new Set([config.VIBRATION_SWITCH_INDEX]), new Set());
    await vi.advanceTimersByTimeAsync(50);

    // 应该再次收到事件
    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'vibration_detected',
      priority: EventPriority.P1
    }));

    vi.useRealTimers();
    parentActor.stop();
  });

  it('should emit monitor_connection_update when connection status changes', async () => {
    let receivedEvents: any[] = [];

    // Copy helpers
    const maskFromIndexes = (indexes: Set<number>, offset: number) => 0; // Simplified
    const buildActiveReport = (inputMask: number, risingMask: number, fallingMask: number) => {
      return Buffer.from([
        0xEE, 0xFF, 0xC0, 0x01, 0x00, inputMask & 0xFF, risingMask & 0xFF, fallingMask & 0xFF, 0x00
      ]);
    };
    const sendReport = (clientId: 'cabinet' | 'control') => {
      // Just valid packet to trigger heartbeat
      const payload = buildActiveReport(0, 0, 0);
      mockHardware.onIncomingData?.('tcp', clientId, payload, { address: '127.0.0.1', port: 8000 }, { success: true, timestamp: Date.now() });
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
            if (event.type === 'monitor_connection_update') {
              receivedEvents.push(event);
            }
          }
        }
      }
    });

    const parentActor = createActor(parentMachine);
    parentActor.start();
    await new Promise(resolve => setTimeout(resolve, 50));

    // 1. Send Cabinet Heartbeat -> Should Connect Cabinet
    sendReport('cabinet');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'monitor_connection_update',
      connections: { cabinet: true, control: false }
    }));

    // 2. Send Control Heartbeat -> Should Connect Control
    receivedEvents = [];
    sendReport('control');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedEvents).toContainEqual(expect.objectContaining({
      type: 'monitor_connection_update',
      connections: { cabinet: true, control: true }
    }));

    parentActor.stop();
  });
});
