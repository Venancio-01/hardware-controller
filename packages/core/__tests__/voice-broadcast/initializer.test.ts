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
      info: vi.fn(() => {}),
      warn: vi.fn(() => {}),
      error: vi.fn(() => {})
    };
    
    // Ensure clean state
    if (VoiceBroadcastController.isInitialized()) {
      VoiceBroadcastController.destroy();
    }
  });

  afterEach(() => {
    if (VoiceBroadcastController.isInitialized()) {
      VoiceBroadcastController.destroy();
    }
  });

  it('should initialize VoiceBroadcastController if config is present', async () => {
    await initializeVoiceBroadcast(mockManager as any, mockLogger as any);
    expect(VoiceBroadcastController.isInitialized()).toBe(true);
  });
});
