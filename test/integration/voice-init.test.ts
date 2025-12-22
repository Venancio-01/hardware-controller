import { describe, expect, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { initializeHardware } from '../../src/hardware/initializer.js';
import { initializeVoiceBroadcast } from '../../src/voice-broadcast/initializer.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';

describe('Voice Initialization Integration', () => {
  let manager: HardwareCommunicationManager;
  const logger = createModuleLogger('Test');
  
  beforeEach(async () => {
    // Reset instance before each test
    VoiceBroadcastController.destroy();
    
    manager = new HardwareCommunicationManager();
    // Directly mock the methods on the instance
    manager.initialize = mock(() => Promise.resolve()) as any;
    manager.getAllConnectionStatus = mock(() => ({ udp: {}, tcp: {} })) as any;
    manager.sendCommand = mock(() => Promise.resolve({})) as any;
  });

  afterEach(() => {
    VoiceBroadcastController.destroy();
  });

  it('should initialize VoiceBroadcastController with config values', async () => {
    const initSpy = spyOn(VoiceBroadcastController, 'initialize');
    
    await initializeHardware(manager, logger);
    await initializeVoiceBroadcast(manager, logger);
    
    expect(initSpy).toHaveBeenCalled();
    const config = initSpy.mock.calls[0][1];
    
    // Check if cabinet module has correct config from .env (or defaults in test env)
    const cabinet = config.clients.find((c: any) => c.id === 'voice-broadcast-cabinet');
    expect(cabinet).toBeDefined();
    if (cabinet) {
        expect(cabinet.volume).toBeDefined();
        expect(cabinet.speed).toBeDefined();
    }
    
    initSpy.mockRestore();
  });
});
