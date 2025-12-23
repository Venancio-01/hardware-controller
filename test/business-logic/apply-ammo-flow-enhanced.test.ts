import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ApplyAmmoFlow } from '../../src/business-logic/apply-ammo-flow.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { type StructuredLogger } from '../../src/logger/index.js';

// Mock VoiceBroadcastController
const mockBroadcast = mock(() => Promise.resolve());
mock.module('../../src/voice-broadcast/index.js', () => ({
  VoiceBroadcastController: {
    isInitialized: mock(() => true),
    getInstance: mock(() => ({
      broadcast: mockBroadcast
    }))
  }
}));

const mockLogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  debug: mock(() => {})
} as unknown as StructuredLogger;

describe('ApplyAmmoFlow Enhanced Integration', () => {
  let flow: ApplyAmmoFlow;

  beforeEach(() => {
    flow = new ApplyAmmoFlow(mockLogger);
    flow.start();
    mockBroadcast.mockClear();
  });

  it('应该在 CABINET1 下降沿时触发“供弹结束” (申请中)', async () => {
    // 1. 进入申请状态 (Index 0: false -> true)
    const state0 = new Array(16).fill(false);
    const state1 = [...state0];
    state1[0] = true;
   
    flow.handleCombinedChange(state0, state1);
    expect(mockBroadcast).toHaveBeenCalledWith('已申请，请等待授权');
    mockBroadcast.mockClear();

    // 2. 用户取消 (Index 0: true -> false)
    flow.handleCombinedChange(state1, state0);

    // 验证播报了“供弹结束”
    expect(mockBroadcast).toHaveBeenCalledWith('供弹结束');
  });

  it('应该在 CONTROL5 变化时触发“拒绝”逻辑', async () => {
    // 1. 进入申请状态
    const state0 = new Array(16).fill(false);
    const state1 = [...state0];
    state1[0] = true;
    flow.handleCombinedChange(state0, state1);
    mockBroadcast.mockClear();

    // 2. 控制端拒绝 (Index 12 变化: false -> true)
    const state2 = [...state1];
    state2[12] = true;
    flow.handleCombinedChange(state1, state2);

    // 验证播报了“授权未通过，请取消供弹”
    expect(mockBroadcast).toHaveBeenCalledWith('授权未通过，请取消供弹');
    mockBroadcast.mockClear();

    // 3. 用户复位 (Index 0: true -> false)
    const state3 = [...state2];
    state3[0] = false;
    flow.handleCombinedChange(state2, state3);

    // 验证播报了“供弹结束”
    expect(mockBroadcast).toHaveBeenCalledWith('供弹结束');
  });
});
