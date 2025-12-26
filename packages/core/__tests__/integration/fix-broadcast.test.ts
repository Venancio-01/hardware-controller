import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { RelayStatusAggregator, type RelayClientId } from '../../src/business-logic/relay-status-aggregator.js';
import { createMainActor } from '../../src/state-machines/main-machine.js';
import { parseActiveReportFrame, type RelayStatus } from '../../src/relay/controller.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventPriority } from '../../src/types/state-machine.js';
import { config } from '../../src/config/index.js';

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
      if (clientId !== 'cabinet' && clientId !== 'control') return;
      const report = parseActiveReportFrame(data);
      const status: RelayStatus = { rawHex: report.rawHex, channels: report.inputState };
      const combinedUpdate = relayAggregator.update(clientId as RelayClientId, status);
      if (!combinedUpdate) return;

      if (hasEdgeChanged(report, clientId, config.APPLY_INDEX)) {
        const isCabinetRelay1Closed = combinedUpdate.combinedState[config.APPLY_INDEX];
        if (isCabinetRelay1Closed) {
          mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
        } else {
          mainActor.send({ type: 'finish_request', priority: EventPriority.P2 });
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
    const buildActiveReport = (inputMask: number, risingMask: number, fallingMask: number) => {
      return Buffer.from([
        0xEE,
        0xFF,
        0xC0,
        0x01,
        0x00,
        inputMask & 0xFF,
        risingMask & 0xFF,
        fallingMask & 0xFF,
        0x00
      ]);
    };

    // 1. Initialize states (all open)
    if (manager.onIncomingData) {
      await manager.onIncomingData('udp', 'control', buildActiveReport(0x00, 0x00, 0x00), { address: '127.0.0.1', port: 1235 }, {});
      await manager.onIncomingData('udp', 'cabinet', buildActiveReport(0x00, 0x00, 0x00), { address: '127.0.0.1', port: 1234 }, {});
    }

    // 2. Trigger change (Cabinet Index 0 closed)
    if (manager.onIncomingData) {
      await manager.onIncomingData(
        'udp',
        'cabinet',
        buildActiveReport(0x01, 0x01, 0x00),
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

function hasEdgeChanged(
  report: { risingEdge: number[]; fallingEdge: number[] },
  clientId: string,
  index: number
): boolean {
  const offset = clientId === 'control' ? 8 : 0;
  const localIndex = index - offset;

  if (localIndex < 0 || localIndex > 7) {
    return false;
  }

  return report.risingEdge.includes(localIndex) || report.fallingEdge.includes(localIndex);
}
