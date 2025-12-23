import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { createApplyAmmoActor } from '../../src/state-machines/apply-ammo-machine.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { type StructuredLogger } from '../../src/logger/index.ts';

// Mock VoiceBroadcastController
const mockBroadcast = mock(() => Promise.resolve());
const mockVoiceInstance = {
  broadcast: mockBroadcast
};

mock.module('../../src/voice-broadcast/index.js', () => {
  return {
    VoiceBroadcastController: {
      isInitialized: mock(() => true),
      getInstance: mock(() => mockVoiceInstance)
    }
  };
});

const mockLogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  debug: mock(() => {})
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
    expect(mockBroadcast).toHaveBeenCalledWith('已开门，请取弹，取弹后关闭柜门，并复位按键');
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
});
