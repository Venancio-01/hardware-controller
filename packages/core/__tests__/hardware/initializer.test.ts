import { initializeHardware } from '../../src/hardware/initializer.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { type StructuredLogger } from '../../src/logger/index.js';

describe('Hardware Initializer', () => {
  let mockManager: any;
  let mockLogger: any;

  beforeEach(() => {
    mockManager = {
      initialize: vi.fn(() => Promise.resolve()),
      getAllConnectionStatus: vi.fn(() => ({ udp: {}, tcp: {} }))
    };
    mockLogger = {
      info: vi.fn(() => {}),
      warn: vi.fn(() => {}),
      error: vi.fn(() => {})
    };
  });

  it('should call manager.initialize with correct config', async () => {
    await initializeHardware(mockManager as any, mockLogger as any);
    
    expect(mockManager.initialize).toHaveBeenCalled();
    const initConfig = mockManager.initialize.mock.calls[0][0];
    
    expect(initConfig.udpClients).toContainEqual(expect.objectContaining({ id: 'cabinet' }));
    expect(initConfig.udpClients).toContainEqual(expect.objectContaining({ id: 'control' }));
    expect(mockLogger.info).toHaveBeenCalledWith('硬件通信已初始化');
  });
});
