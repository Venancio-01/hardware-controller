/**
 * 共享类型定义
 *
 * 该模块包含项目中前端和后端共享的类型定义。
 */

/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 应用名称 */
  appName: string;
  /** 应用版本 */
  version: string;
  /** 是否为生产环境 */
  isProduction: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 服务器端口 */
  port: number;
  /** 主机地址 */
  host: string;
}

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  /** IP地址 */
  ipAddress: string;
  /** 子网掩码 */
  subnetMask: string;
  /** 网关地址 */
  gateway: string;
  /** DNS服务器 */
  dns: string;
  /** 端口号 */
  port: number;
}

/**
 * 系统配置接口
 */
export interface SystemConfig {
  /** 应用配置 */
  app: AppConfig;
  /** 网络配置 */
  network: NetworkConfig;
}

/**
 * 配置更新请求类型
 */
export interface ConfigUpdateRequest {
  /** 要更新的配置 */
  config: Partial<SystemConfig>;
  /** 是否立即应用（而不重启） */
  applyImmediately?: boolean;
}

/**
 * 配置响应类型
 */
export interface ConfigResponse {
  /** 配置是否有效 */
  valid: boolean;
  /** 配置数据 */
  config: SystemConfig;
  /** 验证错误 */
  errors?: string[];
}