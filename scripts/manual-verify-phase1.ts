import { createMonitorActor } from '../src/state-machines/monitor-machine.js';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';

console.log('--- Phase 1 Verification: Poller Machine ---');

const mockHardware = new HardwareCommunicationManager();
// Override sendCommand
mockHardware.sendCommand = async (protocol, command, parameters, clientId) => {
  console.log(`[MockHardware] Sending ${protocol} command to ${clientId}: ${command}`);
  return {};
};

const actor = createMonitorActor(mockHardware);

actor.subscribe((snapshot) => {
  console.log(`[Actor State] ${snapshot.value}`);
});

actor.start();
console.log('-> Sending START event');
actor.send({ type: 'START' });

setTimeout(() => {
  console.log('-> Sending TICK event');
  actor.send({ type: 'TICK' });
}, 500);

setTimeout(() => {
  console.log('-> Sending STOP event');
  actor.send({ type: 'STOP' });
  console.log('--- Verification Complete ---');
  process.exit(0);
}, 1000);
