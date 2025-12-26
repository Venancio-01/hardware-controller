/**
 * 门开超时配置验证测试
 *
 * 测试 DOOR_OPEN_TIMEOUT_S 配置项的验证逻辑
 */
import { configSchema } from 'shared';

describe('Door Open Timeout Config Validation', () => {
  it('should validate DOOR_OPEN_TIMEOUT_S with default value', () => {
    const minimalConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
    };

    const result = configSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.DOOR_OPEN_TIMEOUT_S).toBe(30);
    }
  });

  it('should allow overriding DOOR_OPEN_TIMEOUT_S', () => {
    const customConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      DOOR_OPEN_TIMEOUT_S: 60,
    };

    const result = configSchema.safeParse(customConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.DOOR_OPEN_TIMEOUT_S).toBe(60);
    }
  });

  it('should fail when DOOR_OPEN_TIMEOUT_S is negative', () => {
    const invalidConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      DOOR_OPEN_TIMEOUT_S: -1,
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});
