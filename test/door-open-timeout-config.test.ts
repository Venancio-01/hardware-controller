import { describe, it, expect } from 'bun:test';
import { envSchema } from '../src/config/index.js';

describe('Door Open Timeout Config Validation', () => {
  it('should validate DOOR_OPEN_TIMEOUT_S with default value', () => {
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
      // @ts-ignore - DOOR_OPEN_TIMEOUT_S might not exist yet
      expect(result.data.DOOR_OPEN_TIMEOUT_S).toBe(30);
    }
  });

  it('should allow overriding DOOR_OPEN_TIMEOUT_S', () => {
    const customEnv = {
      DOOR_OPEN_TIMEOUT_S: '60',
      // Required defaults
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: '127.0.0.1',
      CABINET_TARGET_HOST: '127.0.0.1',
      CABINET_TARGET_PORT: '8000',
      CONTROL_TARGET_HOST: '127.0.0.1',
      CONTROL_TARGET_PORT: '8000',
    };

    const result = envSchema.safeParse(customEnv);
    expect(result.success).toBe(true);

    if (result.success) {
      // @ts-ignore
      expect(result.data.DOOR_OPEN_TIMEOUT_S).toBe(60);
    }
  });

  it('should fail when DOOR_OPEN_TIMEOUT_S is negative', () => {
    const invalidEnv = {
      DOOR_OPEN_TIMEOUT_S: '-1',
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
