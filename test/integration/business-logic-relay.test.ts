import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { RelayStatusAggregator, type RelayClientId } from '../../src/business-logic/relay-status-aggregator.js';
import { ApplyAmmoFlow } from '../../src/business-logic/apply-ammo-flow.js';
import { parseStatusResponse } from '../../src/relay/controller.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

describe('BusinessLogic & Relay Strategy Integration (Modularized)', () => {
  let manager: HardwareCommunicationManager;
  let relayAggregator: RelayStatusAggregator;
  let applyAmmoFlow: ApplyAmmoFlow;
  const logger = createModuleLogger('Test');
  
  beforeEach(async () => {
    manager = new HardwareCommunicationManager();
    relayAggregator = new RelayStatusAggregator();
    applyAmmoFlow = new ApplyAmmoFlow(logger);
    
    // Mock hardware setup
    vi.spyOn(manager, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    vi.spyOn(manager, 'sendCommand').mockResolvedValue({}); // Default success

    // Setup manual routing logic (same as in index.ts)
    manager.onIncomingData = async (protocol, clientId, data, remote, parsedResponse) => {
        const rawStr = data.toString('utf8').trim();
        if (rawStr.startsWith('dostatus')) {
            const status = parseStatusResponse(rawStr, 'dostatus');
            if (clientId === 'cabinet' || clientId === 'control') {
                const combinedUpdate = relayAggregator.update(clientId as RelayClientId, status);
                if (combinedUpdate && combinedUpdate.changed) {
                    applyAmmoFlow.handleCombinedChange(combinedUpdate.previousCombined, combinedUpdate.combinedState);
                }
            }
        }
    };

    applyAmmoFlow.start();
    broadcastMock.mockClear();
  });

  afterEach(() => {
    applyAmmoFlow.stop();
    vi.clearAllMocks();
  });

  it('should trigger "Apply" broadcast when Cabinet sends Index 0 closed', async () => {
    // Correct format: dostatus + 8 chars of 0/1
    // Channel 1 (Index 0) Closed = '1', others '0'
    // 1. Initialize states (all open)
    if (manager.onIncomingData) {
        manager.onIncomingData('udp', 'control', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1235 }, {});
        manager.onIncomingData('udp', 'cabinet', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1234 }, {});
    }

    // 2. Trigger change (Cabinet Index 0 closed)
    if (manager.onIncomingData) {
        manager.onIncomingData(
            'udp', 
            'cabinet', 
            Buffer.from('dostatus10000000'), 
            { address: '127.0.0.1', port: 1234 }, 
            {}
        );
    }
    
    // Wait for event loop
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
  });
});