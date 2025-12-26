import { Protocol } from '../types/index.js';

/**
 * 语音播报模块相关类型定义
 */

/**
 * 语音播报客户端配置
 */
export interface VoiceClientConfig {
  /** 客户端唯一标识符 */
  id: string;
  /** 目标硬件客户端ID (HardwareManager中的ID) */
  targetClientId: string;
  /** 通信协议 */
  protocol: Protocol;
  /** 描述信息 */
  description?: string;
  /** 默认音量 (0-10) */
  volume?: number;
  /** 默认语速 (0-10) */
  speed?: number;
}

/**
 * 播报选项
 */
export interface BroadcastOptions {
  /** 音量 (0-10)，覆盖默认配置 */
  volume?: number;
  /** 语速 (0-10)，覆盖默认配置 */
  speed?: number;
  /** 发音人 (3:女, 51:男) */
  voice?: 3 | 51;
  /** 预设提示音 ID，例如 'sound108' */
  sound?: string;
  /** 播报次数，默认 1 */
  repeat?: number;
}

/**
 * 初始化配置
 */
export interface VoiceControllerConfig {
  clients: VoiceClientConfig[];
  defaultClientId?: string;
}
