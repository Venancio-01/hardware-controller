import { config } from '../config/index.js';
import { type HardwareCommunicationManager } from './manager.js';
import { type StructuredLogger } from '../logger/index.js';

export async function initializeHardware(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  const udpClientsConfig = [
    {
      id: 'cabinet',
      targetHost: config.CABINET_TARGET_HOST,
      targetPort: config.CABINET_TARGET_PORT,
      description: '柜体端'
    },
    {
      id: 'control',
      targetHost: config.CONTROL_TARGET_HOST,
      targetPort: config.CONTROL_TARGET_PORT,
      description: '控制端'
    }
  ];

  const tcpClientsConfig: {
    id: string;
    targetHost: string;
    targetPort: number;
    framing: boolean;
    heartbeatStrict: boolean;
    description: string;
  }[] = [];

  // Voice broadcast modules are TCP-based
  if (config.VOICE_BROADCAST_CABINET_HOST && config.VOICE_BROADCAST_CABINET_PORT) {
    tcpClientsConfig.push({
      id: 'voice-broadcast-cabinet',
      targetHost: config.VOICE_BROADCAST_CABINET_HOST,
      targetPort: config.VOICE_BROADCAST_CABINET_PORT,
      framing: false,
      heartbeatStrict: false,
      description: '柜体端语音播报模块'
    });
  }

  if (config.VOICE_BROADCAST_CONTROL_HOST && config.VOICE_BROADCAST_CONTROL_PORT) {
    tcpClientsConfig.push({
      id: 'voice-broadcast-control',
      targetHost: config.VOICE_BROADCAST_CONTROL_HOST,
      targetPort: config.VOICE_BROADCAST_CONTROL_PORT,
      framing: false,
      heartbeatStrict: false,
      description: '控制端语音播报模块'
    });
  }

  await manager.initialize({
    udpClients: udpClientsConfig,
    tcpClients: tcpClientsConfig,
    udpPort: config.UDP_LOCAL_PORT,
    globalTimeout: config.HARDWARE_TIMEOUT,
    globalRetries: config.HARDWARE_RETRY_ATTEMPTS,
  });

  logger.info('硬件通信已初始化');
  logger.info('UDP 客户端状态:', manager.getAllConnectionStatus().udp);
  logger.info('TCP 客户端状态:', manager.getAllConnectionStatus().tcp);
}
