/**
 * Shared 包主导出文件
 *
 * 该模块包含项目中前端和后端共享的类型定义、验证模式和工具函数。
 */

// ============ Schemas 导出 ============
// 配置验证 schemas
export { configSchema, appConfigSchema, envConfigSchema } from './schemas/config.schema.js';

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

// 认证 schemas
export { loginRequestSchema, loginResponseSchema } from './schemas/auth.schema.js';

// 冲突检测 schemas
export {
  conflictDetectionRequestSchema,
  conflictDetectionResultSchema
} from './schemas/conflict-detection.schema.js';


// ============ Config Reader 导出 ============
// 注意：ConfigReader 使用 node:fs，仅可在 Node.js 环境使用
// 请使用：import { createConfigReader } from 'shared/node'



// ============ Types 导出 ============
// 配置类型
export type { Config } from './types/config.types.js';

// 网络配置类型
export type { NetworkConfig, IPv4Address } from './types/network.types.js';

// 设备状态类型
export type { DeviceStatus, Port, Protocol } from './types/device.types.js';

// API 响应类型
export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse, CoreStatusResponse } from './types/api.types.js';

// 认证类型
export type { LoginRequest, LoginResponse } from './schemas/auth.schema.js';

// 冲突检测类型
export type {
  ConflictDetectionRequest,
  ConflictDetectionResult,
  ConflictCheckType
} from './types/conflict-detection.types.js';

// IPC Types
export { IpcMessages } from './types/ipc.js';
export type {
  IpcPacket,
  IpcMessageType,
  CoreStatus,
  IpcLogLevel,
  LogPayload,
  StatusPayload,
} from './types/ipc.js';

// ============ Logger 导出 ============
export {
  logger,
  StructuredLogger,
  createModuleLogger,
  LogLevel,
  LOG_LEVEL_NAMES,
} from './logger/index.js';

export type {
  LoggerConfig,
  LogEntry,
  LogFormatter,
  LogWriter,
  LogStats,
  FileWriterConfig,
} from './logger/index.js';
