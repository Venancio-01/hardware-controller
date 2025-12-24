import { createMainActor } from '../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { EventPriority } from '../src/types/state-machine.js';
import { type StructuredLogger } from '../src/logger/index.js';

console.log('--- Phase 4 Verification: P0 Interruption ---');

const mockLogger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.log(`[WARN] ${msg}`),
  error: (msg: string) => console.log(`[ERROR] ${msg}`),
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
} as unknown as StructuredLogger;

const mockHardware = new HardwareCommunicationManager();
mockHardware.sendCommand = async (protocol, command, parameters, clientId) => {
  return {};
};

const actor = createMainActor(mockHardware, mockLogger);

actor.subscribe((snapshot) => {
  console.log(`[Main State] ${snapshot.value}`);
});

actor.start();

setTimeout(() => {
  console.log('\n1. Starting Normal Flow (apply_request P2)');
  actor.send({ type: 'apply_request', priority: EventPriority.P2 });
}, 500);

setTimeout(() => {
  console.log('\n2. CRITICAL EVENT: key_detected (P0)');
  console.log('-> Expecting immediate transition to alarm state, interrupting normal flow.');
  actor.send({ type: 'key_detected', priority: EventPriority.P0 });
}, 1000);

setTimeout(() => {
  if (actor.getSnapshot().value === 'alarm') {
    console.log('\nSUCCESS: Normal flow was interrupted by P0 event.');
  } else {
    console.log('\nFAILURE: Normal flow was NOT interrupted.');
  }
  console.log('--- Verification Complete ---');
  process.exit(0);
}, 1500);
