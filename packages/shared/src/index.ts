/**
 * Shared 包主导出文件
 *
 * 该模块包含项目中前端和后端共享的类型定义、验证模式和工具函数。
 */

// ============ Schemas 导出 ============
// 配置验证 schemas
export { configSchema } from './schemas/config.schema.js';

// 网络配置 schemas
export { networkConfigSchema, ipv4Schema } from './schemas/network.schema.js';

// 设备状态 schemas
export { deviceStatusSchema, portSchema, protocolSchema } from './schemas/device.schema.js';

// API 响应 schemas
export {
  apiSuccessResponseSchema,
  apiErrorResponseSchema,
  apiResponseSchema,
} from './schemas/api-response.schema.js';

// ============ Types 导出 ============
// 配置类型
export type { Config } from './types/config.types.js';

// 网络配置类型
export type { NetworkConfig, IPv4Address } from './types/network.types.js';

// 设备状态类型
export type { DeviceStatus, Port, Protocol } from './types/device.types.js';

// API 响应类型
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from './types/api.types.js';

// ============ Legacy 导出 (向后兼容) ============
// 保留现有的导出以兼容已有代码
export * from './types.js';
export * from './validation.js';
export * from './utils.js';
