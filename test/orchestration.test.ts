import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { RelayStatusAggregator } from '../src/business-logic/relay-status-aggregator.js';
import { ApplyAmmoFlow } from '../src/business-logic/apply-ammo-flow.js';
import { createMonitorActor } from '../src/state-machines/monitor-machine.js';
import { initializeHardware } from '../src/hardware/initializer.js';
import { resetAllRelays } from '../src/relay/reset.js';

describe('System Orchestration', () => {
  it('should wire all components correctly', async () => {
    const manager = new HardwareCommunicationManager();
    vi.spyOn(manager, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(manager, 'sendCommand').mockResolvedValue({});
    
    const aggregator = new RelayStatusAggregator();
    const flow = new ApplyAmmoFlow({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any);
    const poller = createMonitorActor(manager);
    
    // This is essentially what index.ts does
    await initializeHardware(manager, { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any);
    await resetAllRelays(manager, { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any);
    
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
