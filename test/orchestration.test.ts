import { HardwareCommunicationManager } from '../src/hardware/manager.js';
import { RelayStatusAggregator } from '../src/business-logic/relay-status-aggregator.js';
import { createMainActor } from '../src/state-machines/main-machine.js';
import { initializeHardware } from '../src/hardware/initializer.js';
import { resetAllRelays } from '../src/relay/reset.js';
import { type StructuredLogger } from '../src/logger/index.js';

describe('System Orchestration', () => {
  it('should wire all components correctly via MainMachine', async () => {
    const mockLogger = { 
      info: vi.fn(), 
      warn: vi.fn(), 
      error: vi.fn(), 
      debug: vi.fn() 
    } as unknown as StructuredLogger;
    
    const manager = new HardwareCommunicationManager();
    vi.spyOn(manager, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(manager, 'sendCommand').mockResolvedValue({});
    
    const aggregator = new RelayStatusAggregator();
    const mainActor = createMainActor(manager, mockLogger);
    
    // Simulate index.ts initialization sequence
    await initializeHardware(manager, mockLogger);
    await resetAllRelays(manager, mockLogger);
    
    mainActor.start();
    const monitor = mainActor.getSnapshot().children.monitor;
    expect(monitor).toBeDefined();
    
    monitor.send({ type: 'START' });
    expect(monitor.getSnapshot().value).toBe('waiting');
    
    monitor.send({ type: 'TICK' });
    // Wait for async action in Monitor (fromPromise)
    await new Promise(resolve => setTimeout(resolve, 30));
    
    expect(manager.sendCommand).toHaveBeenCalled();
    mainActor.stop();
  });
});