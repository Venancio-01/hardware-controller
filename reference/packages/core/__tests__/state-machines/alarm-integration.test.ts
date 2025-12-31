import { setup, createActor } from 'xstate';
import { mainMachine } from '../../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { config } from '../../src/config/index.js';
import { createModuleLogger } from 'shared';

// Mock Hardware
vi.mock('../../src/hardware/manager.js', () => {
  return {
    HardwareCommunicationManager: class {
      sendCommand = vi.fn(() => Promise.resolve({}));
      queueCommand = vi.fn();
      getAllConnectionStatus = vi.fn(() => ({ udp: {}, tcp: {} }));
      onIncomingData?: Function;
    }
  };
});

// Mock VoiceBroadcast
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

// Mock Logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('Alarm Integration Test', () => {
  let mockHardware: HardwareCommunicationManager;
  let actor: any;

  beforeEach(() => {
    mockHardware = new HardwareCommunicationManager();
    vi.clearAllMocks();
    vi.useFakeTimers();

    actor = createActor(mainMachine, {
      input: {
        hardware: mockHardware,
        logger: mockLogger as any
      }
    });
    actor.start();

    // 初始化状态 (所有开关断开/闭合为默认状态)
    // 必须发送初始包以建立 baseline，这样后续变化才能被检测为 change
    // 初始化状态
    // Key Switch active low (false = trigger), so initialize to true (safe)
    const initialInputs = new Set<number>();
    initialInputs.add(config.KEY_SWITCH_INDEX);

    sendReport('cabinet', new Set(), new Set(), initialInputs);
    sendReport('control', new Set(), new Set(), new Set());
  });

  afterEach(() => {
    actor.stop();
    vi.useRealTimers();
  });

  const sendReport = (clientId: 'cabinet' | 'control', rising: Set<number>, falling: Set<number>, current: Set<number>) => {
    const offset = clientId === 'cabinet' ? 0 : 8;

    // Construct masks
    let inputMask = 0;
    current.forEach(idx => {
      if (idx >= offset && idx < offset + 8) inputMask |= (1 << (idx - offset));
    });

    let risingMask = 0;
    rising.forEach(idx => {
      if (idx >= offset && idx < offset + 8) risingMask |= (1 << (idx - offset));
    });

    let fallingMask = 0;
    falling.forEach(idx => {
      if (idx >= offset && idx < offset + 8) fallingMask |= (1 << (idx - offset));
    });

    const payload = Buffer.from([
      0xEE, 0xFF, 0xC0, 0x01, 0x00,
      inputMask, risingMask, fallingMask,
      0x00
    ]);

    mockHardware.onIncomingData?.('tcp', clientId, payload, { address: '127.0.0.1', port: 8000 }, { success: true, timestamp: Date.now() });
  };

  it('should transition to alarm state and trigger effects when vibration is detected', async () => {
    // 1. Trigger Vibration (Rising Edge on Index 4)
    // Monitor Machine should detect this and emit 'vibration_detected' to Main
    // Main should transition to 'alarm'
    // Alarm Machine should be invoked and broadcast alarm

    // Initial state setup (call listener once to attach)
    await vi.advanceTimersByTimeAsync(10);

    // 触发震动传感器，但保持钥匙开关闭合（避免触发钥匙报警）
    const cabinetIndexes = new Set<number>();
    cabinetIndexes.add(config.VIBRATION_SWITCH_INDEX);
    cabinetIndexes.add(config.KEY_SWITCH_INDEX);  // 保持钥匙开关闭合状态

    sendReport('cabinet', new Set([config.VIBRATION_SWITCH_INDEX]), new Set(), cabinetIndexes);

    await vi.advanceTimersByTimeAsync(100);

    // Verify Main Machine State
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual('alarm');
    // Note: alarm state invokes child, but parent state is 'alarm'.

    // Verify Side Effects (from Alarm Machine)
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜体震动报警');
    expect(mockControlBroadcast).toHaveBeenCalledWith('柜体震动报警');

    // Verify Alarm Lights ON
    expect(mockHardware.queueCommand).toHaveBeenCalledWith(
      'tcp',
      expect.any(Buffer), // Cabinet Alarm Channel 4 ON
      'cabinet',
      false
    );
    expect(mockHardware.queueCommand).toHaveBeenCalledWith(
      'serial',
      expect.any(Buffer), // Control Alarm Channel 1 ON
      'control',
      false
    );

    // 2. Trigger Alarm Cancel (Index 8 - Control Side)
    // Monitor detects change -> emits 'alarm_cancel_toggled'
    const controlIndexes = new Set<number>();
    controlIndexes.add(config.ALARM_CANCEL_SWITCH_INDEX);
    sendReport('control', new Set([config.ALARM_CANCEL_SWITCH_INDEX]), new Set(), controlIndexes);

    await vi.advanceTimersByTimeAsync(100);

    // Verify Main Machine State returns to 'idle'
    const snapshot2 = actor.getSnapshot();
    // Alarm cancelled -> sends 'alarm_cancelled' to main -> transitions to 'idle'
    expect(snapshot2.value).toEqual('idle');

    // Verify Alarm Off Commands
    // The previous calls (ON) are still in the mock history, so we expect ANY call with open command
    // But since we use queueCommand, we can check for specific logic.
    // Reset Alarm logic:
    // const cabinetCommand = RelayCommandBuilder.open(config.ALARM_LIGHT_RELAY_INDEX as RelayChannel);
    // context.hardware.queueCommand('tcp', cabinetCommand, 'cabinet', false);

    // We can just verify it was called.
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('取消报警');
    expect(mockControlBroadcast).toHaveBeenCalledWith('取消报警');
  });

  it('should transition to alarm state when key switch is triggered', async () => {
    await vi.advanceTimersByTimeAsync(10);

    // 触发钥匙开关 (Falling Edge on KEY_SWITCH_INDEX = 3, 因为钥匙触发是从 open 变为 close)
    sendReport('cabinet', new Set(), new Set([config.KEY_SWITCH_INDEX]), new Set());

    await vi.advanceTimersByTimeAsync(100);

    // 验证进入 alarm 状态
    expect(actor.getSnapshot().value).toEqual('alarm');
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('钥匙开门请核实');
    expect(mockControlBroadcast).toHaveBeenCalledWith('钥匙开门请核实');
  });

  it('should broadcast key reset message when key is reset in alarm state', async () => {
    await vi.advanceTimersByTimeAsync(10);

    // 1. 触发钥匙报警 (Falling Edge，钥匙闭合)
    sendReport('cabinet', new Set(), new Set([config.KEY_SWITCH_INDEX]), new Set());
    await vi.advanceTimersByTimeAsync(100);
    expect(actor.getSnapshot().value).toEqual('alarm');

    // 2. 钥匙复位 (Rising Edge，钥匙断开)
    sendReport('cabinet', new Set([config.KEY_SWITCH_INDEX]), new Set(), new Set([config.KEY_SWITCH_INDEX]));
    await vi.advanceTimersByTimeAsync(100);

    // 仍在 alarm 状态，但播报了复位消息
    expect(actor.getSnapshot().value).toEqual('alarm');
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('钥匙已复位，请取消报警');
    expect(mockControlBroadcast).toHaveBeenCalledWith('钥匙已复位，请取消报警');

    // 3. 按下取消报警
    sendReport('control', new Set([config.ALARM_CANCEL_SWITCH_INDEX]), new Set(), new Set([config.ALARM_CANCEL_SWITCH_INDEX]));
    await vi.advanceTimersByTimeAsync(100);

    expect(actor.getSnapshot().value).toEqual('idle');
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('取消报警');
    expect(mockControlBroadcast).toHaveBeenCalledWith('取消报警');
  });
});
