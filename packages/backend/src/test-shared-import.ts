/**
 * Backend shared 包导入测试
 *
 * 验证 backend 可以正确导入 shared 包的 schemas 和类型
 */

import { configSchema, networkConfigSchema, deviceStatusSchema } from 'shared';
import type { Config, NetworkConfig, DeviceStatus } from 'shared';

// 测试类型推断
const testConfig: Config = {
  deviceId: 'test-device',
  timeout: 5000,
  retryCount: 3,
  pollingInterval: 5000,
};

const testNetwork: NetworkConfig = {
  ipAddress: '192.168.1.100',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1',
  dns: ['8.8.8.8'],
};

const testDevice: DeviceStatus = {
  online: true,
  ipAddress: '192.168.1.50',
  port: 8080,
  protocol: 'UDP',
};

// 测试验证功能
const configResult = configSchema.safeParse(testConfig);
const networkResult = networkConfigSchema.safeParse(testNetwork);
const deviceResult = deviceStatusSchema.safeParse(testDevice);

console.log('✅ Backend 成功导入并使用 shared 包');
console.log('Config validation:', configResult.success);
console.log('Network validation:', networkResult.success);
console.log('Device validation:', deviceResult.success);
