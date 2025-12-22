import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { initializeHardware } from '../../src/hardware/initializer.js';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { type StructuredLogger } from '../../src/logger/index.js';

describe('Hardware Initializer', () => {
  let mockManager: any;
  let mockLogger: any;

  beforeEach(() => {
    mockManager = {
      initialize: mock(() => Promise.resolve()),
      getAllConnectionStatus: mock(() => ({ udp: {}, tcp: {} }))
    };
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
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
