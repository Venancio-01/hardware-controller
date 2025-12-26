/**
 * 配置验证测试
 *
 * 测试 JSON 配置的验证逻辑
 */
import { configSchema } from 'shared';

describe('Config Validation', () => {
  it('should validate valid voice broadcast configuration', () => {
    const validConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      NODE_ENV: 'test',
      PORT: 3000,
      HOST: '127.0.0.1',
      VOICE_CABINET_VOLUME: 8,
      VOICE_CABINET_SPEED: 3,
      VOICE_CONTROL_VOLUME: 5,
      VOICE_CONTROL_SPEED: 5,
    };

    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.VOICE_CABINET_VOLUME).toBe(8);
      expect(result.data.VOICE_CABINET_SPEED).toBe(3);
    }
  });

  it('should use default values when optional fields are missing', () => {
    const minimalConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
    };

    const result = configSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.VOICE_CABINET_VOLUME).toBe(10); // Default
      expect(result.data.VOICE_CABINET_SPEED).toBe(5); // Default
    }
  });

  it('should fail when volume is out of range', () => {
    const invalidConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      VOICE_CABINET_VOLUME: 11, // Max is 10
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should validate hardware input indices', () => {
    const validConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      APPLY_INDEX: 0,
      CABINET_DOOR_INDEX: 1,
      DOOR_JUMP_SWITCH_INDEX: 2,
    };

    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.APPLY_INDEX).toBe(0);
    }
  });

  it('should validate hardware relay indices', () => {
    const validConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      RELAY_LOCK_INDEX: 2,
      RELAY_CABINET_ALARM_INDEX: 8,
    };

    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.RELAY_LOCK_INDEX).toBe(2);
    }
  });
});
