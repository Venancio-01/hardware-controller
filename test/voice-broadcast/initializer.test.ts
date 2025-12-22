import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { initializeVoiceBroadcast } from '../../src/voice-broadcast/initializer.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';

describe('Voice Broadcast Initializer', () => {
  let mockManager: any;
  let mockLogger: any;
  let initSpy: any;
  let getInstanceSpy: any;

  beforeEach(() => {
    mockManager = {};
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
    };
    
    initSpy = spyOn(VoiceBroadcastController, 'initialize').mockImplementation(() => {});
    getInstanceSpy = spyOn(VoiceBroadcastController, 'getInstance').mockReturnValue({
      broadcast: mock(() => Promise.resolve(true))
    } as any);
  });

  afterEach(() => {
    initSpy.mockRestore();
    getInstanceSpy.mockRestore();
  });

  it('should initialize VoiceBroadcastController if config is present', async () => {
    await initializeVoiceBroadcast(mockManager as any, mockLogger as any);
    expect(VoiceBroadcastController.initialize).toHaveBeenCalled();
  });
});
