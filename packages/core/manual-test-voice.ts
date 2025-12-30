import { HardwareCommunicationManager } from './src/hardware/manager.js';
import { VoiceBroadcast } from './src/voice-broadcast/index.js';
import { createModuleLogger } from 'shared';

const log = createModuleLogger('ManualVoiceTest');

async function main() {
  const HOST = '192.168.0.18';
  const PORT = 50000;

  // Use standard IDs to enable use of .cabinet getter
  const VOICE_CLIENT_ID = 'voice-broadcast-cabinet';
  const HARDWARE_CLIENT_ID = 'cabinet';

  log.info(`Initializing Hardware Manager...`);
  const hardwareManager = new HardwareCommunicationManager();

  await hardwareManager.initialize({
    tcpClients: [
      {
        id: HARDWARE_CLIENT_ID,
        targetHost: HOST,
        targetPort: PORT,
        framing: false,
        timeout: 5000,
        retries: 0
      }
    ]
  });

  // Listen for data to verify response
  hardwareManager.onIncomingData = (protocol, clientId, data) => {
    log.info(`[HW] Received from ${clientId}: ${data.toString('hex').toUpperCase()}`);
    // Check for "OK" response
    if (data.toString('ascii').includes('OK')) {
      log.info('✅ Received OK response!');
    }
  };

  log.info(`Initializing VoiceBroadcast...`);
  // Reset singleton if needed (though new process, so not strictly needed)
  if (VoiceBroadcast.isInitialized()) {
    VoiceBroadcast.destroy();
  }

  VoiceBroadcast.initialize(hardwareManager, {
    clients: [{
      id: VOICE_CLIENT_ID,
      targetClientId: HARDWARE_CLIENT_ID,
      protocol: 'tcp',
      volume: 1,
      speed: 5
    }]
  });

  const voice = VoiceBroadcast.getInstance();

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const text = "你好";
    log.info(`Testing VoiceBroadcast.cabinet.broadcast("${text}")...`);

    const result = await voice.cabinet.broadcast(text);

    if (result) {
      log.info('✅ Broadcast command sent successfully (returned true)');
    } else {
      log.error('❌ Broadcast command returned false');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    log.info('Test completed. Shutting down...');
    await hardwareManager.shutdown();
    log.info('Disconnected.');

  } catch (error) {
    log.error('Test failed:', error);
    try {
      await hardwareManager.shutdown();
    } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
