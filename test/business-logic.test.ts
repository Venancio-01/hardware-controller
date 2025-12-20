import { describe, expect, it, spyOn, beforeEach, afterEach } from 'bun:test';
import { BusinessLogicManager } from '../src/business-logic.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { createModuleLogger } from '../src/logger/index.js';
import { VoiceBroadcastController } from '../src/voice-broadcast/index.js';

describe('BusinessLogicManager Initialization', () => {
  let manager: HardwareCommunicationManager;
  const logger = createModuleLogger('Test');

  let voiceInitSpy: any;

  beforeEach(() => {
    manager = new HardwareCommunicationManager();
    // 模拟 initialize 方法避免实际的网络绑定
    spyOn(manager, 'initialize').mockResolvedValue(undefined);
    spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    
    // 模拟语音模块初始化，避免实际连接，并记录以便恢复
    voiceInitSpy = spyOn(VoiceBroadcastController, 'initialize').mockImplementation(() => {});
  });

  afterEach(() => {
    voiceInitSpy.mockRestore();
  });

  it('should send dooff99 to both cabinet and control during initialization', async () => {
    const sendCommandSpy = spyOn(manager, 'sendCommand').mockResolvedValue({});
    const bizLogic = new BusinessLogicManager(manager, logger);
    
    await bizLogic.initialize();

    // 验证是否向 cabinet 发送了 dooff99
    expect(sendCommandSpy).toHaveBeenCalledWith(
      'udp',
      'dooff99',
      undefined,
      'cabinet',
      false
    );

    // 验证是否向 control 发送了 dooff99
    expect(sendCommandSpy).toHaveBeenCalledWith(
      'udp',
      'dooff99',
      undefined,
      'control',
      false
    );
  });

  it('should continue initialization even if relay reset fails', async () => {
    const sendCommandSpy = spyOn(manager, 'sendCommand').mockImplementation(async (protocol, cmd) => {
      if (cmd === 'dooff99') {
        throw new Error('Network timeout');
      }
      return {};
    });

    const bizLogic = new BusinessLogicManager(manager, logger);
    
    // 即使抛出错误，initialize 也不应该抛出异常（内部捕获后记录日志）
    await bizLogic.initialize();

    // 确保 resetAllRelays 被尝试调用
    expect(sendCommandSpy).toHaveBeenCalledWith('udp', 'dooff99', undefined, 'cabinet', false);
  });
});
