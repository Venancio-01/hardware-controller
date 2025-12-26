import { config } from '../config/index.js';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { VoiceBroadcastController } from './index.js';
import { type VoiceClientConfig } from './types.js';

export async function initializeVoiceBroadcast(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  const voiceClients: VoiceClientConfig[] = [];

  // Cabinet Voice (Reuse TCP connection)
  if (config.CABINET_HOST && config.CABINET_PORT) {
    voiceClients.push({
      id: 'voice-broadcast-cabinet',
      targetClientId: 'cabinet', // Maps to HardwareManager client ID
      protocol: 'tcp',
      description: '柜体端语音播报模块',
      volume: config.VOICE_CABINET_VOLUME,
      speed: config.VOICE_CABINET_SPEED
    });
  } else {
    // Should verify if CABINET_HOST is actually optional? Schema says default exists.
    // Keeping check for safety.
    logger.warn('柜体端通信配置缺失，语音模块无法初始化');
  }

  // Control Voice (Reuse Serial connection)
  if (config.CONTROL_SERIAL_PATH) {
    voiceClients.push({
      id: 'voice-broadcast-control',
      targetClientId: 'control', // Maps to HardwareManager client ID
      protocol: 'serial',
      description: '控制端语音播报模块',
      volume: config.VOICE_CONTROL_VOLUME,
      speed: config.VOICE_CONTROL_SPEED
    });
  } else {
    logger.warn('控制端串口配置缺失，语音模块无法初始化');
  }

  if (voiceClients.length > 0) {
    try {
      VoiceBroadcastController.initialize(manager, {
        clients: voiceClients,
        defaultClientId: voiceClients[0]?.id
      });
      logger.info('语音播报模块初始化成功', {
        clients: voiceClients.map(c => c.id)
      });
    } catch (err) {
      logger.warn('语音模块初始化失败', { error: err });
    }
  } else {
    logger.warn('未检测到可用的语音播报配置，已跳过语音模块初始化');
  }
}
