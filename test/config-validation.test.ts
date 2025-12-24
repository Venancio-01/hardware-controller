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

  it('should validate hardware input indices', () => {
    const validEnv = {
      // Inputs
      APPLY_INDEX: '0',
      CABINET_DOOR_INDEX: '1',
      ELECTRIC_LOCK_IN_INDEX: '2',
      // ... minimal required envs
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };

    const result = envSchema.safeParse(validEnv);
    // Expect failure until implemented in config/index.ts
    // In TDD Red phase, we expect this test to fail if we asserted success.
    // However, since we haven't updated the Schema yet, safeParse will strip unknown keys
    // and might return success if we don't assert on the presence of the new keys.
    // So we should assert that the parsed data contains the new keys.
    
    // BUT, since we are in strict TDD, I will write the test assuming the schema IS updated.
    // Since it's NOT, safeParse (by default in Zod unless .strict() is used) ignores unknown keys.
    // So to make it fail, I must check if the keys exist in the output.
    
    // However, if the schema doesn't define them, they won't be in result.data.
    if (result.success) {
      expect((result.data as any).APPLY_INDEX).toBe(0);
    } else {
        // If it fails for other reasons, that's fine too, but we want it to fail because 
        // the schema is missing these fields or they are not parsed correctly.
        // Actually, without the schema definition, result.data won't have APPLY_INDEX.
        // So expect((result.data as any).APPLY_INDEX).toBe(0) will fail (undefined != 0).
        expect((result.data as any).APPLY_INDEX).toBe(0);
    }
  });

  it('should validate hardware relay indices', () => {
     const validEnv = {
      // Relays
      RELAY_LOCK_INDEX: '2',
      RELAY_CABINET_ALARM_INDEX: '8',
      // ... minimal required envs
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };
    
    const result = envSchema.safeParse(validEnv);
    if (result.success) {
        expect((result.data as any).RELAY_LOCK_INDEX).toBe(2);
    } else {
        expect((result.data as any).RELAY_LOCK_INDEX).toBe(2);
    }
  });
});
