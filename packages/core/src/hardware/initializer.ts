import { config } from '../config/index.js';
import { type HardwareCommunicationManager } from './manager.js';
import { type StructuredLogger } from '../logger/index.js';

export async function initializeHardware(manager: HardwareCommunicationManager, logger: StructuredLogger) {
  const tcpClientsConfig = [
    {
      id: 'cabinet',
      targetHost: config.CABINET_HOST,
      targetPort: config.CABINET_PORT,
      framing: false,      // Relay protocol uses raw binary, no framing needed
      heartbeatStrict: true,
      description: '柜体端 (TCP)'
    }
  ];

  // Control is now Serial-based
  const serialClientsConfig = [
    {
      id: 'control',
      path: config.CONTROL_SERIAL_PATH,
      baudRate: config.CONTROL_SERIAL_BAUDRATE,
      dataBits: config.CONTROL_SERIAL_DATABITS as 8 | 7 | 6 | 5,
      stopBits: config.CONTROL_SERIAL_STOPBITS as 1 | 2,
      parity: config.CONTROL_SERIAL_PARITY as 'none' | 'even' | 'mark' | 'odd' | 'space',
      description: '控制端 (Serial)'
    }
  ];



  await manager.initialize({
    tcpClients: tcpClientsConfig,
    serialClients: serialClientsConfig,
    globalTimeout: config.HARDWARE_TIMEOUT,
    globalRetries: config.HARDWARE_RETRY_ATTEMPTS,
  });

  logger.info('硬件通信已初始化');
  logger.info('TCP 客户端状态:', manager.getAllConnectionStatus().tcp);
  logger.info('Serial 客户端状态:', manager.getAllConnectionStatus().serial);
}
