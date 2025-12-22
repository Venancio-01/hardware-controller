import { config } from '../config/index.js';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { VoiceBroadcastController } from './index.js';

export async function initializeVoiceBroadcast(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  const voiceClients: { id: string; host: string; port: number; description: string; volume?: number; speed?: number }[] = [];

  if (config.VOICE_BROADCAST_CABINET_HOST && config.VOICE_BROADCAST_CABINET_PORT) {
    voiceClients.push({
      id: 'voice-broadcast-cabinet',
      host: config.VOICE_BROADCAST_CABINET_HOST,
      port: config.VOICE_BROADCAST_CABINET_PORT,
      description: '柜体端语音播报模块',
      volume: config.VOICE_BROADCAST_CABINET_VOLUME,
      speed: config.VOICE_BROADCAST_CABINET_SPEED
    });
  } else {
    logger.warn('柜体端语音播报配置缺失，已跳过初始化');
  }

  if (config.VOICE_BROADCAST_CONTROL_HOST && config.VOICE_BROADCAST_CONTROL_PORT) {
    voiceClients.push({
      id: 'voice-broadcast-control',
      host: config.VOICE_BROADCAST_CONTROL_HOST,
      port: config.VOICE_BROADCAST_CONTROL_PORT,
      description: '控制端语音播报模块',
      volume: config.VOICE_BROADCAST_CONTROL_VOLUME,
      speed: config.VOICE_BROADCAST_CONTROL_SPEED
    });
  } else if (config.VOICE_BROADCAST_CONTROL_HOST || config.VOICE_BROADCAST_CONTROL_PORT) {
    logger.warn('控制端语音播报配置不完整，已跳过初始化');
  }

  if (voiceClients.length > 0) {
    try {
      VoiceBroadcastController.initialize(manager, {
        clients: voiceClients,
        defaultClientId: voiceClients[0]?.id
      });

      const voiceController = VoiceBroadcastController.getInstance();
      await voiceController.broadcast('测试');
    } catch (err) {
      logger.warn('语音模块初始化失败', { error: err });
    }
  } else {
    logger.warn('未检测到可用的语音播报配置，已跳过语音模块初始化');
  }
}
