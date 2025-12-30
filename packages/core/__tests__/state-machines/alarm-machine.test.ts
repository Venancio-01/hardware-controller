import { createActor, setup } from 'xstate';
import { alarmMachine } from '../../src/state-machines/alarm-machine.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Mock HardwareCommunicationManager
const mockHardware = {
  sendCommand: vi.fn(() => Promise.resolve({})),
  queueCommand: vi.fn()
};

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('AlarmMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTestActor = (trigger?: string, monitorReason?: 'connection' | 'heartbeat' | 'network') => {
    return createActor(alarmMachine, {
      input: {
        hardware: mockHardware as any,
        logger: mockLogger as any,
        trigger,
        monitorReason
      }
    });
  };

  // 创建带父 actor 的测试 actor（用于测试需要 sendParent 的场景）
  const createTestActorWithParent = (trigger?: string, monitorReason?: 'connection' | 'heartbeat' | 'network') => {
    const receivedEvents: any[] = [];

    const parentMachine = setup({
      actors: { alarm: alarmMachine }
    }).createMachine({
      invoke: {
        src: 'alarm',
        id: 'alarm',
        input: {
          hardware: mockHardware as any,
          logger: mockLogger as any,
          trigger,
          monitorReason
        }
      },
      on: {
        '*': {
          actions: ({ event }) => {
            receivedEvents.push(event);
          }
        }
      }
    });

    const parentActor = createActor(parentMachine);
    return { parentActor, receivedEvents };
  };

  describe('基本功能', () => {
    it('不带 trigger 时应该从 determining 进入 idle 状态', () => {
      const actor = createTestActor();
      actor.start();
      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('应该在 idle 状态时响应 KEY_DETECTED 事件进入 key_alarm', () => {
      const actor = createTestActor();
      actor.start();
      actor.send({ type: 'KEY_DETECTED' });
      expect(actor.getSnapshot().value).toBe('key_alarm');
    });

    it('应该在 idle 状态时响应 VIBRATION_DETECTED 事件进入 vibration_alarm', () => {
      const actor = createTestActor();
      actor.start();
      actor.send({ type: 'VIBRATION_DETECTED' });
      expect(actor.getSnapshot().value).toBe('vibration_alarm');
    });

    it('应该在 active 状态时响应 ACKNOWLEDGE 事件', () => {
      const actor = createTestActor();
      actor.start();
      actor.send({ type: 'ALARM_DETECTED' });
      expect(actor.getSnapshot().value).toBe('active');
      actor.send({ type: 'ACKNOWLEDGE' });
      expect(actor.getSnapshot().value).toBe('acknowledged');
    });

    it('应该在 acknowledged 状态时响应 RESOLVE 事件返回 idle', () => {
      const actor = createTestActor();
      actor.start();
      actor.send({ type: 'ALARM_DETECTED' });
      actor.send({ type: 'ACKNOWLEDGE' });
      actor.send({ type: 'RESOLVE' });
      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('钥匙报警', () => {
    it('带 KEY_DETECTED trigger 时应该进入 key_alarm 状态并播报', () => {
      const actor = createTestActor('KEY_DETECTED');
      actor.start();
      expect(actor.getSnapshot().value).toBe('key_alarm');
      expect(mockCabinetBroadcast).toHaveBeenCalledWith('钥匙开门请核实');
      expect(mockControlBroadcast).toHaveBeenCalledWith('钥匙开门请核实');
    });
  });

  describe('震动报警', () => {
    it('带 VIBRATION_DETECTED trigger 时应该进入 vibration_alarm 状态并播报', () => {
      const actor = createTestActor('VIBRATION_DETECTED');
      actor.start();
      expect(actor.getSnapshot().value).toBe('vibration_alarm');
      expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜体震动报警');
      expect(mockControlBroadcast).toHaveBeenCalledWith('柜体震动报警');
    });
  });

  describe('监控报警', () => {
    it('带 MONITOR_DETECTED trigger 时应该进入 monitor_alarm 状态', () => {
      const actor = createTestActor('MONITOR_DETECTED', 'heartbeat');
      actor.start();
      expect(actor.getSnapshot().value).toBe('monitor_alarm');
    });

    it('应该根据 heartbeat reason 播报 "设备心跳异常"（仅控制端）', () => {
      const actor = createTestActor('MONITOR_DETECTED', 'heartbeat');
      actor.start();
      expect(mockControlBroadcast).toHaveBeenCalledWith('设备心跳异常');
      // 监控报警仅控制端，不应该调用柜体端
      expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    });

    it('应该根据 connection reason 播报 "设备连接异常"（仅控制端）', () => {
      const actor = createTestActor('MONITOR_DETECTED', 'connection');
      actor.start();
      expect(mockControlBroadcast).toHaveBeenCalledWith('设备连接异常');
      expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    });

    it('应该根据 network reason 播报 "网络连接异常"（仅控制端）', () => {
      const actor = createTestActor('MONITOR_DETECTED', 'network');
      actor.start();
      expect(mockControlBroadcast).toHaveBeenCalledWith('网络连接异常');
      expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    });

    it('ALARM_CANCEL 应该解除监控报警并播报 "取消报警"（带父 actor）', async () => {
      const { parentActor, receivedEvents } = createTestActorWithParent('MONITOR_DETECTED', 'heartbeat');
      parentActor.start();

      await new Promise(resolve => setTimeout(resolve, 50));
      mockControlBroadcast.mockClear();

      const alarmActor = parentActor.getSnapshot().children['alarm'];
      expect(alarmActor?.getSnapshot().value).toBe('monitor_alarm');

      alarmActor?.send({ type: 'ALARM_CANCEL' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alarmActor?.getSnapshot().value).toBe('idle');
      expect(mockControlBroadcast).toHaveBeenCalledWith('取消报警');
      expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'alarm_cancelled' }));

      parentActor.stop();
    });

    it('RECOVER 应该静默解除监控报警（无语音，带父 actor）', async () => {
      const { parentActor, receivedEvents } = createTestActorWithParent('MONITOR_DETECTED', 'heartbeat');
      parentActor.start();

      await new Promise(resolve => setTimeout(resolve, 50));
      mockControlBroadcast.mockClear();

      const alarmActor = parentActor.getSnapshot().children['alarm'];
      expect(alarmActor?.getSnapshot().value).toBe('monitor_alarm');

      alarmActor?.send({ type: 'RECOVER' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alarmActor?.getSnapshot().value).toBe('idle');
      // RECOVER 是静默解除，不应该有语音播报
      expect(mockControlBroadcast).not.toHaveBeenCalled();
      expect(receivedEvents).toContainEqual(expect.objectContaining({ type: 'alarm_cancelled' }));

      parentActor.stop();
    });
  });
});
