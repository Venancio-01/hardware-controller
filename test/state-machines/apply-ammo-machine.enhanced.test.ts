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
    expect(mockBroadcast).toHaveBeenCalledWith('供弹结束');
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
    expect(mockBroadcast).toHaveBeenCalledWith('授权未通过，请取消供弹');
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
    expect(mockBroadcast).toHaveBeenCalledWith('供弹结束');
  });
});
