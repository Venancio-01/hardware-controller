import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { RelayStatusAggregator } from '../src/business-logic/relay-status-aggregator.js';
import { ApplyAmmoFlow } from '../src/business-logic/apply-ammo-flow.js';
import { createPollerActor } from '../src/state-machines/poller-machine.js';
import { initializeHardware } from '../src/hardware/initializer.js';
import { resetAllRelays } from '../src/relay/reset.js';

describe('System Orchestration', () => {
  it('should wire all components correctly', async () => {
    const manager = new HardwareCommunicationManager();
    spyOn(manager, 'initialize').mockResolvedValue(undefined);
    spyOn(manager, 'sendCommand').mockResolvedValue({});
    
    const aggregator = new RelayStatusAggregator();
    const flow = new ApplyAmmoFlow({ info: mock(), warn: mock(), error: mock(), debug: mock() } as any);
    const poller = createPollerActor(manager);
    
    // This is essentially what index.ts does
    await initializeHardware(manager, { info: mock(), warn: mock(), error: mock(), debug: mock() } as any);
    await resetAllRelays(manager, { info: mock(), warn: mock(), error: mock(), debug: mock() } as any);
    
    poller.start();
    poller.send({ type: 'START' });
    
    expect(poller.getSnapshot().value).toBe('waiting');
    
    poller.send({ type: 'TICK' });
    // Wait for async action
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(manager.sendCommand).toHaveBeenCalled();
    poller.stop();
  });
});
