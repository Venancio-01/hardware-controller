import { createMainActor } from '../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { RelayStatusAggregator } from '../src/business-logic/relay-status-aggregator.js';
import { parseStatusResponse } from '../src/relay/controller.js';
import { EventPriority } from '../src/types/state-machine.js';
import { VoiceBroadcastController } from '../src/voice-broadcast/index.js';
import { type StructuredLogger } from '../src/logger/index.js';

// 1. Mock Logger
const mockLogger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.log(`[WARN] ${msg}`),
  error: (msg: string) => console.log(`[ERROR] ${msg}`),
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
} as unknown as StructuredLogger;

// 2. Mock Hardware
const mockHardware = new HardwareCommunicationManager();
mockHardware.sendCommand = async (protocol, command, parameters, clientId) => {
  console.log(`[MockHardware] Sending ${protocol} command to ${clientId}: ${command.toString()}`);
  return { [clientId || 'default']: { success: true, timestamp: Date.now() } };
};

// 3. Initialize Voice (needed by applyAmmoMachine)
// Use a dummy config
VoiceBroadcastController.initialize(mockHardware, { clients: [{ id: 'test', host: '127.0.0.1', port: 1234, description: 'test' }], defaultClientId: 'test' });

// 4. Create Main Machine
const mainActor = createMainActor(mockHardware, mockLogger);
mainActor.start();

// 5. Initialize Aggregator
const relayAggregator = new RelayStatusAggregator();

async function simulateIncoming(clientId: string, rawStr: string) {
    console.log(`
--- Simulating Incoming Data: ${clientId} ${rawStr} ---`);
    const status = parseStatusResponse(rawStr, 'dostatus');
    const combinedUpdate = relayAggregator.update(clientId as any, status);
    
    if (combinedUpdate && combinedUpdate.changed) {
        console.log(`[Aggregator] Change detected: ${combinedUpdate.changeDescriptions.join(', ')}`);
        
        // Match the logic in src/index.ts (re-implemented here for tracing)
        if (combinedUpdate.changeDescriptions.some(d => d.includes('CH1'))) {
            const isCabinetRelay1Closed = (combinedUpdate.combinedState[0]);
            console.log(`[Logic] CH1 changed. Closed: ${isCabinetRelay1Closed}`);
            if (isCabinetRelay1Closed) {
               console.log('[Logic] Sending apply_request to MainMachine');
               mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
            } else {
               console.log('[Logic] Sending finish_request to MainMachine');
               mainActor.send({ type: 'finish_request', priority: EventPriority.P2 });
            }
        }
    } else {
        console.log(`[Aggregator] No change or missing other client data.`);
    }
}

async function run() {
    // 1. Baseline: All open
    await simulateIncoming('control', 'dostatus00000000');
    await simulateIncoming('cabinet', 'dostatus00000000');
    
    // 2. Transition: CH1 Closed (Apply button pressed)
    await simulateIncoming('cabinet', 'dostatus10000000');
    
    // 3. Second event (simulating a repeat or button hold)
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('\n--- Sending SECOND apply_request ---');
    mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
    
    // Wait for async actions in state machine
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`
Final MainMachine State: ${mainActor.getSnapshot().value}`);
    const applyAmmo = mainActor.getSnapshot().children.applyAmmo;
    if (applyAmmo) {
        console.log(`ApplyAmmo State: ${applyAmmo.getSnapshot().value}`);
    } else {
        console.log('ApplyAmmo actor NOT found.');
    }
}

run().catch(console.error);
