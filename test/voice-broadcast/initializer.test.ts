import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { initializeVoiceBroadcast } from '../../src/voice-broadcast/initializer.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';

describe('Voice Broadcast Initializer', () => {
  let mockManager: any;
  let mockLogger: any;

  beforeEach(() => {
    mockManager = {};
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
    };
    // Reset singleton if possible, but here we just mock the class methods
    mock.module('../../src/voice-broadcast/index.js', () => {
      return {
        VoiceBroadcastController: {
          initialize: mock(() => {}),
          getInstance: mock(() => ({
            broadcast: mock(() => Promise.resolve())
          }))
        }
      };
    });
  });

  it('should initialize VoiceBroadcastController if config is present', async () => {
    await initializeVoiceBroadcast(mockManager as any, mockLogger as any);
    expect(VoiceBroadcastController.initialize).toHaveBeenCalled();
  });
});
