/**
 * Frontend shared 包导入测试
 *
 * 验证 frontend 可以正确导入 shared 包的 schemas 和类型
 */

import { configSchema, networkConfigSchema, apiSuccessResponseSchema } from 'shared';
import type { Config, NetworkConfig, ApiSuccessResponse } from 'shared';

// 测试类型推断
const testConfig: Config = {
  deviceId: 'frontend-device',
  timeout: 3000,
  retryCount: 2,
  pollingInterval: 5000,
};

const testNetwork: NetworkConfig = {
  ipAddress: '10.0.0.100',
  subnetMask: '255.255.255.0',
  gateway: '10.0.0.1',
};

const testApiResponse: ApiSuccessResponse<Config> = {
  success: true,
  data: testConfig,
  message: '获取配置成功',
};

// 测试验证功能
const configResult = configSchema.safeParse(testConfig);
const networkResult = networkConfigSchema.safeParse(testNetwork);
const apiResult = apiSuccessResponseSchema.safeParse(testApiResponse);

console.log('✅ Frontend 成功导入并使用 shared 包');
console.log('Config validation:', configResult.success);
console.log('Network validation:', networkResult.success);
console.log('API validation:', apiResult.success);
