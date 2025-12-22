import { initializeHardware } from '../src/hardware/initializer.js';
import { initializeVoiceBroadcast } from '../src/voice-broadcast/initializer.ts';
import { resetAllRelays } from '../src/relay/reset.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { createModuleLogger } from '../src/logger/index.js';

console.log('--- Phase 2 Verification: Initializers & Reset ---');

const mockHardware = new HardwareCommunicationManager();
const logger = createModuleLogger('VerifyPhase2');

// Mock initialize
mockHardware.initialize = async (cfg) => {
  console.log('[MockHardware] Initializing with:', JSON.stringify(cfg, null, 2));
};

// Mock sendCommand
mockHardware.sendCommand = async (protocol, cmd, params, clientId) => {
  console.log(`[MockHardware] Sending ${protocol} command to ${clientId}: ${cmd}`);
  return {};
};

// Mock getAllConnectionStatus
mockHardware.getAllConnectionStatus = () => ({ udp: { cabinet: 'reg', control: 'reg' }, tcp: {} });

async function verify() {
  await initializeHardware(mockHardware, logger);
  await resetAllRelays(mockHardware, logger);
  await initializeVoiceBroadcast(mockHardware, logger);
  console.log('--- Verification Complete ---');
}

verify().catch(console.error);
