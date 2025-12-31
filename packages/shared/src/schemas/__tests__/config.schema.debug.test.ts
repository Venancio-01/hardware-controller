import { describe, it, expect } from 'vitest';
import { configSchema } from '../config.schema.js';

describe('Zod Schema Validation Debug', () => {
  it('should reject VOICE_CONTROL_VOLUME value exceeding max (10)', () => {
    const result = configSchema.safeParse({
      deviceId: 'test-device',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '127.0.0.1',
      subnetMask: '255.255.255.0',
      gateway: '127.0.0.1',
      port: 80,
      VOICE_CONTROL_VOLUME: 99, // Invalid: exceeds max of 10
    });

    console.log('Result for VOICE_CONTROL_VOLUME = 99:', result);

    if (!result.success) {
      console.log('Validation errors:', result.error.errors);
    }

    // This SHOULD fail validation
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(e => e.path.includes('VOICE_CONTROL_VOLUME'))).toBe(true);
    }
  });

  it('should accept valid VOICE_CONTROL_VOLUME value', () => {
    const result = configSchema.safeParse({
      deviceId: 'test-device',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '127.0.0.1',
      subnetMask: '255.255.255.0',
      gateway: '127.0.0.1',
      port: 80,
      VOICE_CONTROL_VOLUME: 5, // Valid
    });

    console.log('Result for VOICE_CONTROL_VOLUME = 5:', result);

    expect(result.success).toBe(true);
  });
});
