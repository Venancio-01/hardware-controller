import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { RelayStatusAggregator, type RelayClientId } from '../../src/business-logic/relay-status-aggregator.js';
import { createMainActor } from '../../src/state-machines/main-machine.js';
import { parseStatusResponse } from '../../src/relay/controller.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventPriority } from '../../src/types/state-machine.js';

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

describe('Bug Reproduction: Missing apply_request Broadcast', () => {
  let manager: HardwareCommunicationManager;
  let relayAggregator: RelayStatusAggregator;
  let mainActor: any;
  const logger = createModuleLogger('Test');
  
  beforeEach(async () => {
    manager = new HardwareCommunicationManager();
    relayAggregator = new RelayStatusAggregator();
    mainActor = createMainActor(manager, logger);
    
    // Mock hardware setup
    vi.spyOn(manager, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    vi.spyOn(manager, 'sendCommand').mockResolvedValue({}); 

    // Setup routing logic (same as in index.ts)
    manager.onIncomingData = async (protocol, clientId, data, remote, parsedResponse) => {
        const rawStr = data.toString('utf8').trim();
        if (rawStr.startsWith('dostatus')) {
            const status = parseStatusResponse(rawStr, 'dostatus');
            if (clientId === 'cabinet' || clientId === 'control') {
                const combinedUpdate = relayAggregator.update(clientId as RelayClientId, status);
                if (combinedUpdate && combinedUpdate.changed) {
                    if (combinedUpdate.changeDescriptions.some(d => d.includes('CH1'))) {
                        const isCabinetRelay1Closed = (combinedUpdate.combinedState[0]);
                        if (isCabinetRelay1Closed) {
                           mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
                        } else {
                           mainActor.send({ type: 'finish_request', priority: EventPriority.P2 });
                        }
                    }
                }
            }
        }
    };

    mainActor.start();
    broadcastMock.mockClear();
  });

  afterEach(() => {
    mainActor.stop();
    vi.clearAllMocks();
  });

  it('should trigger broadcastApply on the VERY FIRST apply_request', async () => {
    // 1. Initialize states (all open)
    if (manager.onIncomingData) {
        await manager.onIncomingData('udp', 'control', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1235 }, {});
        await manager.onIncomingData('udp', 'cabinet', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1234 }, {});
    }

    // 2. Trigger change (Cabinet Index 0 closed)
    if (manager.onIncomingData) {
        await manager.onIncomingData(
            'udp', 
            'cabinet', 
            Buffer.from('dostatus10000000'), 
            { address: '127.0.0.1', port: 1234 }, 
            {}
        );
    }
    
    // Wait for event loop and state machine
    await new Promise(resolve => setTimeout(resolve, 200));

    // EXPECTATION: Broadcast should have been called
    // REality (Bug): It is not called.
    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
    
    const snapshot = mainActor.getSnapshot();
    expect(snapshot.value).toBe('normal');
    expect(snapshot.children.applyAmmo.getSnapshot().value).toBe('applying');
  });
});
