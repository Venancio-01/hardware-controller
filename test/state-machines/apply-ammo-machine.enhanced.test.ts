import { createApplyAmmoActor } from '../../src/state-machines/apply-ammo-machine.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { type StructuredLogger } from '../../src/logger/index.ts';

// Mock VoiceBroadcastController
const mockBroadcast = vi.fn(() => Promise.resolve());
const mockVoiceInstance = {
  broadcast: mockBroadcast
};

vi.mock('../../src/voice-broadcast/index.js', () => {
  return {
    VoiceBroadcastController: {
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

describe('ApplyAmmoMachine Enhanced', () => {
  beforeEach(() => {
    mockBroadcast.mockClear();
  });

  it('应该在 applying 状态下支持用户取消 (CABINET1 变低)', () => {
    const actor = createApplyAmmoActor(mockLogger);
    actor.start();
    
    // 进入 applying 状态
    actor.send({ type: 'APPLY' });
    expect(actor.getSnapshot().value).toBe('applying');
    
    // 用户取消 (发送 FINISHED 事件)
    actor.send({ type: 'FINISHED' });
    
    // 验证状态回到 idle
    expect(actor.getSnapshot().value).toBe('idle');
    
    // 验证播报了“供弹结束”
    expect(mockBroadcast).toHaveBeenCalledWith('供弹[=dan4]结束');
  });

  it('应该在 applying 状态下支持控制端拒绝 (CONTROL5 变化)', () => {
    const actor = createApplyAmmoActor(mockLogger);
    actor.start();
    
    // 进入 applying 状态
    actor.send({ type: 'APPLY' });
    
    // 控制端拒绝 (发送 REFUSE 事件)
    actor.send({ type: 'REFUSE' });
    
    // 验证状态进入 refused
    expect(actor.getSnapshot().value).toBe('refused');
    
    // 验证播报了“授权未通过，请取消供弹”
    expect(mockBroadcast).toHaveBeenCalledWith('授权未通过，请取消供弹[=dan4]');
  });

  it('应该在 refused 状态下支持用户复位 (CABINET1 变低)', () => {
    const actor = createApplyAmmoActor(mockLogger);
    actor.start();
    
    // 进入 applying -> refused
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'REFUSE' });
    expect(actor.getSnapshot().value).toBe('refused');
    
    mockBroadcast.mockClear();

    // 用户复位
    actor.send({ type: 'FINISHED' });
    
    // 验证状态回到 idle
    expect(actor.getSnapshot().value).toBe('idle');
    
    // 验证播报了“供弹结束”
    expect(mockBroadcast).toHaveBeenCalledWith('供弹[=dan4]结束');
  });

  it('应该支持完整的开门取弹流程 (AUTHORIZED -> DOOR_OPEN -> DOOR_CLOSE)', () => {
    const actor = createApplyAmmoActor(mockLogger);
    actor.start();

    // 1. 申请供弹
    actor.send({ type: 'APPLY' });
    expect(actor.getSnapshot().value).toBe('applying');
    mockBroadcast.mockClear();

    // 2. 授权通过
    actor.send({ type: 'AUTHORIZED' });
    // 期望进入 authorized 状态，而不是直接回到 idle
    expect(actor.getSnapshot().value).toBe('authorized');
    expect(mockBroadcast).toHaveBeenCalledWith('授权通过，已开锁请打开柜门');
    mockBroadcast.mockClear();

    // 3. 打开柜门
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');
    expect(mockBroadcast).toHaveBeenCalledWith('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门，并复位按键');
    mockBroadcast.mockClear();

    // 4. 关闭柜门
    actor.send({ type: 'DOOR_CLOSE' });
    expect(actor.getSnapshot().value).toBe('door_closed');
    expect(mockBroadcast).toHaveBeenCalledWith('柜门已关闭');
    mockBroadcast.mockClear();

    // 5. 复位按键 (结束)
    actor.send({ type: 'FINISHED' });
    expect(actor.getSnapshot().value).toBe('idle');
    expect(mockBroadcast).toHaveBeenCalledWith('供弹[=dan4]结束');
  });

  it('should transition to door_open_timeout if door is not closed in time', async () => {
    // 使用 fake timers
    vi.useFakeTimers();

    const actor = createApplyAmmoActor(mockLogger);
    actor.start();

    // 流程: applying -> authorized -> door_open
    actor.send({ type: 'APPLY' });
    actor.send({ type: 'AUTHORIZED' });
    actor.send({ type: 'DOOR_OPEN' });
    expect(actor.getSnapshot().value).toBe('door_open');

    // 清理之前的 mock 调用
    mockBroadcast.mockClear();

    // 快进时间超过默认的30秒超时
    await Promise.resolve(); // 让事件循环处理当前事件
    await vi.advanceTimersByTime(31000); // 快进31秒

    // 检查状态是否变为 door_open_timeout
    expect(actor.getSnapshot().value).toBe('door_open_timeout');
    
    // 检查是否触发了语音播报
    expect(mockBroadcast).toHaveBeenCalledWith('柜门超时未关');

    vi.useRealTimers();
  });
});
