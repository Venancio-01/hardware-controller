import { RelaySchemas } from './validation.js';

/**
 * 继电器通道类型定义
 * 支持1-8路独立通道或'all'全通道控制
 */
export type RelayChannel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'all';

/**
 * 继电器输入状态接口（来自主动上报 KL 位图）
 * @property rawHex - 原始上报帧 Hex
 * @property channels - 8个通道输入状态数组，true表示闭合/触发，false表示断开/未触发
 */
export interface RelayStatus {
  rawHex: string;
  channels: boolean[];
}

/**
 * 主动上报帧解析结果
 */
export interface RelayActiveReport {
  rawHex: string;
  address: number;
  relayState: boolean[];
  inputState: boolean[];
  risingEdge: number[];
  fallingEdge: number[];
}

/**
 * 继电器命令选项
 * @property delaySeconds - 延时秒数（已不再支持）
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
 * - 继电器通道的开闭控制命令（A1短帧）
 * - 查询命令保留但不发送有效帧
 */
export class RelayCommandBuilder {
  /**
   * 构建闭合指定继电器通道的命令
   *
   * 根据主动上报协议控制指令（A1短帧）
   *
   * @param channel - 继电器通道（1-8或'all'）
   * @param options - 命令选项
   * @returns 命令字节帧
   */
  static close(channel: RelayChannel, options: RelayCommandOptions = {}): Buffer {
    return buildRelayCommand('on', channel, options.delaySeconds);
  }

  /**
   * 构建断开指定继电器通道的命令
   *
   * 根据主动上报协议控制指令（A1短帧）
   *
   * @param channel - 继电器通道（1-8或'all'）
   * @returns 命令字节帧
   */
  static open(channel: RelayChannel): Buffer {
    return buildRelayCommand('off', channel);
  }

  /**
   * 获取查询继电器输出状态的命令
   *
   * 主动上报模式无需轮询，保留 API 但返回空帧
   *
   * @returns 空命令帧
   */
  static queryRelayStatus(): Buffer {
    return Buffer.alloc(0);
  }

  /**
   * 获取查询开关量输入状态的命令
   *
   * 主动上报模式无需轮询，保留 API 但返回空帧
   *
   * @returns 空命令帧
   */
  static queryInputStatus(): Buffer {
    return Buffer.alloc(0);
  }
}

/**
 * 构建继电器控制命令
 *
 * 根据主动上报协议控制指令（A1短帧）
 *
 * @param action - 动作类型（'on'闭合或'off'断开）
 * @param channel - 继电器通道
 * @param delaySeconds - 延时秒数（可选，已不支持）
 * @returns 构建完成的命令帧
 */
function buildRelayCommand(action: 'on' | 'off', channel: RelayChannel, delaySeconds?: number): Buffer {
  if (delaySeconds !== undefined) {
    throw new Error('Delay control is not supported in the active-report protocol');
  }

  const enableMask = formatRelayChannel(channel);
  const setMask = action === 'on' ? enableMask : 0x00;
  const address = 0x01;

  const controlHigh = 0x00;
  const controlLow = setMask & 0xFF;
  const enableHigh = 0x00;
  const enableLow = enableMask & 0xFF;

  const checksumHigh = calculateChecksum(0xA1, address, controlHigh, controlLow, enableHigh, enableLow);
  const checksumLow = (checksumHigh + checksumHigh) & 0xFF;

  return Buffer.from([
    0xCC,
    0xDD,
    0xA1,
    address,
    controlHigh,
    controlLow,
    enableHigh,
    enableLow,
    checksumHigh,
    checksumLow
  ]);
}

/**
 * 格式化继电器通道为掩码位
 *
 * 根据主动上报协议控制指令：
 * - 1-8路通道：bit0 -> 路1
 * - 全通道：0xFF
 *
 * @param channel - 通道号或'all'
 * @returns 通道掩码
 */
function formatRelayChannel(channel: RelayChannel): number {
  RelaySchemas.Channel.parse(channel);

  if (channel === 'all') {
    return 0xFF;
  }

  return 1 << (channel - 1);
}

/**
 * 解析主动上报帧
 *
 * @param data - 原始字节帧
 * @returns 解析后的上报对象
 */
function parseActiveReportFrame(data: Buffer): RelayActiveReport {
  const frame = RelaySchemas.ActiveReportFrame.parse(data);
  const address = frame[3];
  const relayState = parseBitmap(frame[4]);
  const inputState = parseBitmap(frame[5]);
  const risingEdge = parseEdgeIndices(frame[6]);
  const fallingEdge = parseEdgeIndices(frame[7]);

  return {
    rawHex: formatHex(frame),
    address,
    relayState,
    inputState,
    risingEdge,
    fallingEdge
  };
}

function parseBitmap(value: number): boolean[] {
  const states: boolean[] = [];
  for (let i = 0; i < 8; i += 1) {
    states.push(((value >> i) & 0x01) === 1);
  }
  return states;
}

function parseEdgeIndices(value: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    if (((value >> i) & 0x01) === 1) {
      indices.push(i);
    }
  }
  return indices;
}

function calculateChecksum(
  functionCode: number,
  address: number,
  controlHigh: number,
  controlLow: number,
  enableHigh: number,
  enableLow: number
): number {
  const sum = functionCode + address + controlHigh + controlLow + enableHigh + enableLow;
  return sum & 0xFF;
}

function formatHex(buffer: Buffer): string {
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}

export { buildRelayCommand, formatRelayChannel, parseActiveReportFrame };
