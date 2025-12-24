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

describe('BusinessLogic & StateMachine Integration', () => {
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
    vi.spyOn(manager, 'sendCommand').mockResolvedValue({}); // Default success

    // Setup routing logic (bridging hardware to state machine as in index.ts)
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
                           
                           // Give XState time to process transition and spawn child
                           await new Promise(resolve => setTimeout(resolve, 10));

                           const snapshot = mainActor.getSnapshot();
                           if (snapshot.value === 'normal' && snapshot.children.applyAmmo) {
                              snapshot.children.applyAmmo.send({ type: 'APPLY' });
                           }
                        } else {
                           const snapshot = mainActor.getSnapshot();
                           if (snapshot.value === 'normal' && snapshot.children.applyAmmo) {
                              snapshot.children.applyAmmo.send({ type: 'FINISHED' });
                           }
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

  it('should trigger "Apply" broadcast via MainMachine when Cabinet sends Index 0 closed', async () => {
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
    
    // Wait for event loop
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mainActor.getSnapshot().value).toBe('normal');
    expect(broadcastMock).toHaveBeenCalledWith('已申请，请等待授权');
  });
});
