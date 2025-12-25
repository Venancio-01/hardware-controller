/**
 * 冲突检测相关类型定义
 *
 * 定义与网络配置冲突检测相关的类型
 */

import type { Config } from './config.types.js';

/**
 * 冲突检测请求参数
 */
export interface ConflictDetectionRequest {
  /** 要检测的配置对象 */
  config: Config;
  /** 可选：指定要检测的配置部分，默认检测所有配置 */
  checkTypes?: ConflictCheckType[];
  /** 可选：自定义超时时间（毫秒） */
  timeout?: number;
}

/**
 * 冲突检测类型枚举
 */
export type ConflictCheckType =
  | 'ip'           // IP 地址冲突检测
  | 'port'         // 端口占用检测
  | 'network'      // 网络配置合理性检查
  | 'all';         // 所有类型的检测

/**
 * 冲突检测结果
 */
export interface ConflictDetectionResult {
  /** 检测是否成功通过（无冲突） */
  success: boolean;
  /** 检测通过的配置部分 */
  passedChecks?: ConflictCheckType[];
  /** 检测失败的配置部分及错误信息 */
  failedChecks?: {
    type: ConflictCheckType;
    error: string;
  }[];
  /** 总检测时间（毫秒） */
  totalLatency?: number;
  /** 详细检测结果 */
  details?: ConflictDetectionDetail[];
}

/**
 * 冲突检测详细结果
 */
export interface ConflictDetectionDetail {
  /** 检测类型 */
  type: ConflictCheckType;
  /** 检测是否通过 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 检测耗时（毫秒） */
  latency?: number;
  /** 额外的检测信息 */
  info?: Record<string, any>;
}