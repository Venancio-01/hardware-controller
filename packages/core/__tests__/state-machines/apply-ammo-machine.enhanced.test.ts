import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setup, createActor } from 'xstate';
import { applyAmmoMachine } from '../../src/state-machines/apply-ammo-machine.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { type StructuredLogger } from 'shared';

// Mock VoiceBroadcastController
const mockCabinetBroadcast = vi.fn(() => Promise.resolve());
const mockControlBroadcast = vi.fn(() => Promise.resolve());
const mockBroadcast = vi.fn(() => Promise.resolve()); // Fallback/Deprecated

const mockCabinetClient = { broadcast: mockCabinetBroadcast };
const mockControlClient = { broadcast: mockControlBroadcast };
const mockVoiceInstance = {
  broadcast: mockBroadcast,
  cabinet: mockCabinetClient,
  control: mockControlClient,
  hasClient: vi.fn(() => true)
};

vi.mock('../../src/voice-broadcast/index.js', () => {
  return {
    VoiceBroadcastController: {
      isInitialized: vi.fn(() => true),
      getInstance: vi.fn(() => mockVoiceInstance)
    },
    VoiceBroadcast: {
      isInitialized: vi.fn(() => true),
      getInstance: vi.fn(() => mockVoiceInstance)
    }
  };
});

const mockLogger = {
  info: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
  debug: vi.fn(() => {})
} as unknown as StructuredLogger;

const mockHardware = {
  sendCommand: vi.fn(() => Promise.resolve({})),
  queueCommand: vi.fn(() => Promise.resolve({}))
} as any;

/**
 * Helper to create an actor with a parent to avoid sendParent errors
 */
function createWrappedActor() {
  const parentMachine = setup({
    actors: { applyAmmo: applyAmmoMachine }
  }).createMachine({
    invoke: {
      src: 'applyAmmo',
      id: 'applyAmmo',
      input: { logger: mockLogger, manager: mockHardware }
    }
  });

  const parentActor = createActor(parentMachine);
  parentActor.start();
  return parentActor.getSnapshot().children.applyAmmo;
}

describe('ApplyAmmoMachine Enhanced', () => {
  beforeEach(() => {
    mockBroadcast.mockClear();
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();
  });

  it('应该在 applying 状态下支持控制端拒绝后直接回到 idle', () => {
    const actor = createWrappedActor();

    // 进入 applying 状态
    actor.send({ type: 'APPLY' });
    expect(actor.getSnapshot().value).toBe('applying');

    // 控制端拒绝 (发送 REFUSE 事件) - 现在直接回到 idle
    actor.send({ type: 'REFUSE' });

    // 验证状态直接回到 idle（不再有 refused 中间状态）
    expect(actor.getSnapshot().value).toBe('idle');

    // 验证播报了"授权未通过，供弹结束"（按状态机清单文档规范）
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('授权未通过，供弹[=dan4]结束');
    expect(mockControlBroadcast).toHaveBeenCalledWith('授权未通过，供弹[=dan4]结束');
  });

  it('应该支持完整的开门取弹流程 (AUTHORIZED -> DOOR_OPEN -> DOOR_CLOSE -> 自动结束)', () => {
    vi.useFakeTimers();
    const actor = createWrappedActor();

    // 1. 申请供弹
    actor.send({ type: 'APPLY' });
    expect(actor.getSnapshot().value).toBe('applying');
    vi.advanceTimersByTime(300);
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 2. 授权通过
    actor.send({ type: 'AUTHORIZED' });
    // 期望进入 authorized 状态
    expect(actor.getSnapshot().value).toBe('authorized');
    vi.advanceTimersByTime(300);
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('授权通过，已开锁请打开柜门');
    expect(mockControlBroadcast).toHaveBeenCalledWith('授权通过，已开锁');
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 3. 打开柜门
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门');
    expect(mockControlBroadcast).toHaveBeenCalledWith('柜门已打开');
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 4. 关闭柜门 - 自复位按钮适配：自动进入 idle 状态
    actor.send({ type: 'DOOR_CLOSE' });
    // 由于 always transition，door_closed 会立即转换到 idle
    expect(actor.getSnapshot().value).toBe('idle');
    // 验证播报了"供弹完毕"（broadcastDoorClosed 和 broadcastFinished）
    vi.advanceTimersByTime(500);
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('供弹[=dan4]完毕');
    expect(mockControlBroadcast).toHaveBeenCalledWith('供弹[=dan4]完毕');
    vi.useRealTimers();
  });

  it('should transition to door_open_timeout if door is not closed in time', async () => {
    // 使用 fake timers
    vi.useFakeTimers();

    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');

    // 清理之前的 mock 调用
    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 快进时间超过默认的30秒超时
    await Promise.resolve(); // 让事件循环处理当前事件
    await vi.advanceTimersByTime(31000); // 快进31秒

    // 检查状态是否变为 door_open_timeout
    expect(actor.getSnapshot().value).toBe('door_open_timeout');

    // 检查是否触发了语音播报
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜门超时未关');
    expect(mockControlBroadcast).toHaveBeenCalledWith('柜门超时未关');

    vi.useRealTimers();
  });

  it('应该在 door_open_timeout 状态下支持 ALARM_CANCEL 进入 door_open_alarm_cancelled', async () => {
    vi.useFakeTimers();

    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open -> door_open_timeout
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');

    mockBroadcast.mockClear();

    // 快进时间超过30秒超时
    await Promise.resolve();
    await vi.advanceTimersByTime(31000);

    expect(actor.getSnapshot().value).toBe('door_open_timeout');
    // 验证播报了"柜门超时未关"
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜门超时未关');
    expect(mockControlBroadcast).toHaveBeenCalledWith('柜门超时未关');

    // 模拟发送硬件指令（闭锁和报警灯）
    mockHardware.sendCommand.mockClear();

    // 发送 ALARM_CANCEL 事件
    mockBroadcast.mockClear();
    actor.send({ type: 'ALARM_CANCEL' });

    // 验证状态转换到 door_open_alarm_cancelled
    expect(actor.getSnapshot().value).toBe('door_open_alarm_cancelled');

    // 验证播报了"取消报警"
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('取消报警');
    expect(mockControlBroadcast).toHaveBeenCalledWith('取消报警');

    // 验证执行了 alarmOff（关闭报警灯）
    // 柜体端 + 控制端
    expect(mockHardware.sendCommand).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('应该在非 timeout 状态下忽略 ALARM_CANCEL 事件', () => {
    const actor = createWrappedActor();

    // 进入 idle 状态
    expect(actor.getSnapshot().value).toBe('idle');

    mockBroadcast.mockClear();

    // 发送 ALARM_CANCEL 事件
    actor.send({ type: 'ALARM_CANCEL' });

    // 验证状态不变（依然在 idle）
    expect(actor.getSnapshot().value).toBe('idle');

    // 验证没有播报任何语音
    expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    expect(mockControlBroadcast).not.toHaveBeenCalled();
  });

  it('应该在 door_open 状态下忽略 ALARM_CANCEL 事件', () => {
    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');

    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 发送 ALARM_CANCEL 事件
    actor.send({ type: 'ALARM_CANCEL' });

    // 验证状态不变（依然在 door_open）
    expect(actor.getSnapshot().value).toBe('door_open');

    // 验证没有播报任何语音
    expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    expect(mockControlBroadcast).not.toHaveBeenCalled();
  });

  it('应该在 door_open_alarm_cancelled 状态下支持 DOOR_CLOSE 自动结束流程', () => {
    vi.useFakeTimers();

    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open -> door_open_timeout -> door_open_alarm_cancelled
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });

    // 快进到超时
    vi.advanceTimersByTime(31000);
    expect(actor.getSnapshot().value).toBe('door_open_timeout');

    // 取消报警
    actor.send({ type: 'ALARM_CANCEL' });
    expect(actor.getSnapshot().value).toBe('door_open_alarm_cancelled');

    mockBroadcast.mockClear();

    // 关闭柜门 - 自复位按钮适配：自动结束流程
    actor.send({ type: 'DOOR_CLOSE' });

    // 由于 always transition，door_closed 会立即转换到 idle
    expect(actor.getSnapshot().value).toBe('idle');

    // 等待定时器让 broadcastFinished 的异步播报执行
    vi.advanceTimersByTime(500);

    // 验证播报了"供弹完毕"
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('供弹[=dan4]完毕');
    expect(mockControlBroadcast).toHaveBeenCalledWith('供弹[=dan4]完毕');

    vi.useRealTimers();
  });

  it('应该在 door_open_alarm_cancelled 状态下支持再次超时', async () => {
    vi.useFakeTimers();

    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open -> door_open_timeout -> door_open_alarm_cancelled
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });

    // 快进到超时
    await Promise.resolve();
    vi.advanceTimersByTime(31000);
    expect(actor.getSnapshot().value).toBe('door_open_timeout');

    // 取消报警
    actor.send({ type: 'ALARM_CANCEL' });
    expect(actor.getSnapshot().value).toBe('door_open_alarm_cancelled');

    mockBroadcast.mockClear();
    mockHardware.sendCommand.mockClear();

    // 再次快进30秒
    vi.advanceTimersByTime(31000);

    // 验证状态回到 door_open_timeout
    expect(actor.getSnapshot().value).toBe('door_open_timeout');

    // 验证播报了"柜门超时未关"
    expect(mockCabinetBroadcast).toHaveBeenCalledWith('柜门超时未关');
    expect(mockControlBroadcast).toHaveBeenCalledWith('柜门超时未关');

    // 验证报警灯再次开启
    expect(mockHardware.sendCommand).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('应该在 door_open_timeout 且柜门关闭后自动结束流程', () => {
    vi.useFakeTimers();

    const actor = createWrappedActor();

    // 流程: applying -> authorized -> door_open -> door_open_timeout
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');

    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 快进时间超过30秒超时
    vi.advanceTimersByTime(31000);
    expect(actor.getSnapshot().value).toBe('door_open_timeout');

    // 关闭柜门 - 自复位按钮适配：自动结束流程
    actor.send({ type: 'DOOR_CLOSE' });
    // 由于 always transition，door_closed 会立即转换到 idle
    expect(actor.getSnapshot().value).toBe('idle');

    vi.useRealTimers();
  });

  it('应该在 authorized 状态下忽略 ALARM_CANCEL 事件', () => {
    const actor = createWrappedActor();

    // 进入 authorized 状态
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    expect(actor.getSnapshot().value).toBe('authorized');

    mockCabinetBroadcast.mockClear();
    mockControlBroadcast.mockClear();

    // 发送 ALARM_CANCEL 事件
    actor.send({ type: 'ALARM_CANCEL' });

    // 验证状态不变（依然在 authorized）
    expect(actor.getSnapshot().value).toBe('authorized');

    // 验证没有播报任何语音
    expect(mockCabinetBroadcast).not.toHaveBeenCalled();
    expect(mockControlBroadcast).not.toHaveBeenCalled();
  });
});
