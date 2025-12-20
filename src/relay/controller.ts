import { RelaySchemas } from './validation.js';

/**
 * 继电器通道类型定义
 * 支持1-8路独立通道或'all'全通道控制
 */
export type RelayChannel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'all';

/**
 * 继电器状态响应接口
 * @property raw - 原始响应字符串，如 "dostatus11000000"
 * @property channels - 8个通道的状态数组，true表示闭合/触发，false表示断开/未触发
 */
export interface RelayStatus {
  raw: string;
  channels: boolean[];
}

/**
 * 继电器命令选项
 * @property delaySeconds - 延时秒数（1-99秒），仅支持单通道控制
 */
export interface RelayCommandOptions {
  delaySeconds?: number;
}

/**
 * 继电器命令构建器
 *
 * 基于ETH设备通信协议V42实现的继电器命令构建类
 * 只负责构建命令字符串，不负责实际发送
 * 实际发送由 HardwareCommunicationManager 管理
 *
 * 功能包括：
 * - 继电器通道的开闭控制命令
 * - 继电器状态查询命令
 * - 开关量输入状态查询命令
 * - 延时控制命令（最大99秒）
 */
export class RelayCommandBuilder {
  /**
   * 构建闭合指定继电器通道的命令
   *
   * 根据协议文档V42：
   * - 简单协议：doonXX 指令
   * - 延时控制：doonXXtYY 指令（YY为延时秒数）
   *
   * @param channel - 继电器通道（1-8或'all'）
   * @param options - 命令选项
   * @returns 命令字符串
   */
  static close(channel: RelayChannel, options: RelayCommandOptions = {}): string {
    return buildRelayCommand('on', channel, options.delaySeconds);
  }

  /**
   * 构建断开指定继电器通道的命令
   *
   * 根据协议文档V42：
   * - 简单协议：dooffXX 指令
   *
   * @param channel - 继电器通道（1-8或'all'）
   * @returns 命令字符串
   */
  static open(channel: RelayChannel): string {
    return buildRelayCommand('off', channel);
  }

  /**
   * 获取查询继电器输出状态的命令
   *
   * 根据协议文档V42：
   * - 发送指令：dostatus
   * - 响应示例：dostatus11000000（表示第1、2路继电器闭合）
   *
   * @returns 命令字符串 'dostatus'
   */
  static queryRelayStatus(): string {
    return 'dostatus';
  }

  /**
   * 获取查询开关量输入状态的命令
   *
   * 根据协议文档V42：
   * - 发送指令：distatus
   * - 响应示例：distatus11000000（表示第1、2路输入触发）
   *
   * @returns 命令字符串 'distatus'
   */
  static queryInputStatus(): string {
    return 'distatus';
  }
}

/**
 * 构建继电器控制命令
 *
 * 根据协议文档V42的简单协议格式：
 * - 闭合指令：doonXX（XX为通道号）
 * - 断开指令：dooffXX（XX为通道号）
 * - 全通道：doon99/dooff99
 * - 延时控制：doonXXtYY（YY为延时秒数，1-99）
 *
 * @param action - 动作类型（'on'闭合或'off'断开）
 * @param channel - 继电器通道
 * @param delaySeconds - 延时秒数（可选）
 * @returns 构建完成的命令字符串
 */
function buildRelayCommand(action: 'on' | 'off', channel: RelayChannel, delaySeconds?: number): string {
  const channelCode = formatRelayChannel(channel);

  // 处理延时控制
  if (delaySeconds !== undefined) {
    if (channel === 'all') {
      throw new Error('Delay control does not support the all-channel command');
    }
    // 使用 Zod 验证
    RelaySchemas.Delay.parse(delaySeconds);
    // 格式：doonXXtYY，YY为两位数延时秒数
    return `doon${channelCode}t${String(delaySeconds).padStart(2, '0')}`;
  }

  // 普通控制：doonXX 或 dooffXX
  return action === 'on' ? `doon${channelCode}` : `dooff${channelCode}`;
}

/**
 * 格式化继电器通道代码
 *
 * 根据协议文档V42：
 * - 1-8路通道：01-08
 * - 全通道：99
 *
 * @param channel - 通道号或'all'
 * @returns 格式化后的通道代码字符串
 */
function formatRelayChannel(channel: RelayChannel): string {
  // 使用 Zod 验证
  RelaySchemas.Channel.parse(channel);

  if (channel === 'all') {
    return '99';
  }

  // 将1-8格式化为两位数：01, 02, ..., 08
  return String(channel).padStart(2, '0');
}

/**
 * 解析状态响应
 *
 * 根据协议文档V42解析状态查询响应：
 * - dostatus响应：dostatus11000000（继电器输出状态）
 * - distatus响应：distatus11000000（开关量输入状态）
 *
 * 响应格式：prefix + 8位状态码
 * - 每位对应一个通道：1=闭合/触发，0=断开/未触发
 * - 第1位对应第1路通道，以此类推
 *
 * @param raw - 原始响应字符串
 * @param prefix - 响应前缀（'dostatus'或'distatus'）
 * @returns 解析后的状态对象
 */
function parseStatusResponse(raw: string, prefix: 'dostatus' | 'distatus'): RelayStatus {
  const parsed = RelaySchemas.StatusResponse.parse(raw);
  
  if (!parsed.raw.trim().startsWith(prefix)) {
      throw new Error(`Unexpected status response prefix: expected ${prefix}`);
  }
  
  return parsed;
}

export { buildRelayCommand, formatRelayChannel, parseStatusResponse };
