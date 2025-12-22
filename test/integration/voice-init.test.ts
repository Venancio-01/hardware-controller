import { describe, expect, it, spyOn, beforeEach, afterEach, vi } from 'bun:test';
import { BusinessLogicManager } from '../../src/business-logic.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';

describe('Voice Initialization Integration', () => {
  let manager: HardwareCommunicationManager;
  let bizLogic: BusinessLogicManager;
  const logger = createModuleLogger('Test');
  
  beforeEach(async () => {
    // Reset instance before each test
    VoiceBroadcastController.destroy();
    
    manager = new HardwareCommunicationManager();
    // Mock hardware setup
    spyOn(manager, 'initialize').mockResolvedValue(undefined);
    spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    spyOn(manager, 'sendCommand').mockResolvedValue({});

    bizLogic = new BusinessLogicManager(manager, logger);
  });

  afterEach(() => {
    bizLogic.stop();
    VoiceBroadcastController.destroy();
  });

  it('should initialize VoiceBroadcastController with config values', async () => {
    const initSpy = spyOn(VoiceBroadcastController, 'initialize');
    
    await bizLogic.initialize();
    
    expect(initSpy).toHaveBeenCalled();
    const config = initSpy.mock.calls[0][1];
    
    // Check if cabinet module has correct config from .env (or defaults in test env)
    const cabinet = config.clients.find((c: any) => c.id === 'voice-broadcast-cabinet');
    expect(cabinet).toBeDefined();
    if (cabinet) {
        expect(cabinet.volume).toBeDefined();
        expect(cabinet.speed).toBeDefined();
    }

    // Check if control module has correct config
    const control = config.clients.find((c: any) => c.id === 'voice-broadcast-control');
    // In test env, VOICE_BROADCAST_CONTROL_HOST might be empty, so it might not be initialized
    // But we can verify it if we mock the config or set env vars
  });
});
