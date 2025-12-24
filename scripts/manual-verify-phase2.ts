import { createMainActor } from '../src/state-machines/main-machine.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { EventPriority } from '../src/types/state-machine.js';

console.log('--- Phase 2 Verification: Main Machine ---');

const mockHardware = new HardwareCommunicationManager();
mockHardware.sendCommand = async (protocol, command, parameters, clientId) => {
  console.log(`[MockHardware] Sending ${protocol} command to ${clientId}: ${command}`);
  return {};
};

const actor = createMainActor(mockHardware);

actor.subscribe((snapshot) => {
  console.log(`[Main Actor State] ${snapshot.value}`);
  if (snapshot.children.monitor) {
     console.log('  [Child] monitor actor is active');
  }
  if (snapshot.children.alarm) {
     console.log('  [Child] alarm actor is active');
  }
});

actor.start();

setTimeout(() => {
  console.log('-> Sending apply_request (P2)');
  actor.send({ type: 'apply_request', priority: EventPriority.P2 });
}, 500);

setTimeout(() => {
  console.log('-> Sending key_detected (P0) - Priority Interruption');
  actor.send({ type: 'key_detected', priority: EventPriority.P0 });
}, 1000);

setTimeout(() => {
  console.log('-> Sending alarm_cancelled');
  actor.send({ type: 'alarm_cancelled' });
  console.log('--- Verification Complete ---');
  process.exit(0);
}, 1500);