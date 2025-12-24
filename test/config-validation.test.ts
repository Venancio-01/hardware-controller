import { envSchema } from '../src/config/index.js';

describe('Config Validation', () => {
  it('should validate valid voice broadcast configuration', () => {
    const validEnv = {
      VOICE_BROADCAST_CABINET_HOST: '192.168.1.10',
      VOICE_BROADCAST_CABINET_PORT: '50000',
      VOICE_BROADCAST_CABINET_VOLUME: '8',
      VOICE_BROADCAST_CABINET_SPEED: '3',
      
      VOICE_BROADCAST_CONTROL_HOST: '192.168.1.11',
      VOICE_BROADCAST_CONTROL_PORT: '50000',
      VOICE_BROADCAST_CONTROL_VOLUME: '5',
      VOICE_BROADCAST_CONTROL_SPEED: '5',

      // Required defaults
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.VOICE_BROADCAST_CABINET_VOLUME).toBe(8);
      expect(result.data.VOICE_BROADCAST_CABINET_SPEED).toBe(3);
    }
  });

  it('should use default values when optional fields are missing', () => {
    const minimalEnv = {
       // Required defaults
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };

    const result = envSchema.safeParse(minimalEnv);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.VOICE_BROADCAST_CABINET_VOLUME).toBe(10); // Default
      expect(result.data.VOICE_BROADCAST_CABINET_SPEED).toBe(5); // Default
    }
  });

  it('should fail when volume is out of range', () => {
    const invalidEnv = {
      VOICE_BROADCAST_CABINET_VOLUME: '11', // Max is 10
       // Required defaults
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});
