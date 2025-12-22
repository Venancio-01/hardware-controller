import { describe, expect, it, spyOn, beforeEach, afterEach, vi } from 'bun:test';
import { BusinessLogicManager } from '../../src/business-logic.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';

// Mock VoiceBroadcastController
const broadcastMock = vi.fn();

vi.mock('../../src/voice-broadcast/index.js', () => ({
  VoiceBroadcastController: {
    initialize: vi.fn(),
    getInstance: () => ({ broadcast: broadcastMock }),
    isInitialized: () => true,
    destroy: vi.fn()
  }
}));

describe('BusinessLogic & Relay Strategy Integration', () => {
  let manager: HardwareCommunicationManager;
  let bizLogic: BusinessLogicManager;
  const logger = createModuleLogger('Test');
  
  beforeEach(async () => {
    manager = new HardwareCommunicationManager();
    // Mock hardware setup
    spyOn(manager, 'initialize').mockResolvedValue(undefined);
    spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    spyOn(manager, 'sendCommand').mockResolvedValue({}); // Default success

    bizLogic = new BusinessLogicManager(manager, logger);
    await bizLogic.initialize();
    
    broadcastMock.mockClear();
  });

  afterEach(() => {
    bizLogic.stop();
    vi.clearAllMocks();
  });

  it('should trigger "Apply" broadcast when Cabinet sends Index 0 closed', async () => {
    // Correct format: dostatus + 8 chars of 0/1
    // Channel 1 (Index 0) Closed = '1', others '0'
    // 1. Initialize states (all open)
    if (manager.onIncomingData) {
        manager.onIncomingData('udp', 'control', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1235, family: 'IPv4', size: 10 }, {});
        manager.onIncomingData('udp', 'cabinet', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1234, family: 'IPv4', size: 10 }, {});
    }

    // 2. Trigger change (Cabinet Index 0 closed)
    if (manager.onIncomingData) {
        manager.onIncomingData(
            'udp', 
            'cabinet', 
            Buffer.from('dostatus10000000'), 
            { address: '127.0.0.1', port: 1234, family: 'IPv4', size: 10 }, 
            {}
        );
    }
    
    // Wait for event loop
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
  });
});
