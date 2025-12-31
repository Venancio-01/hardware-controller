import iconv from 'iconv-lite';
import { createModuleLogger } from 'shared';
import { HardwareCommunicationManager } from '../hardware/manager.js';
import { VoiceSchemas } from './validation.js';
import { VoiceClient } from './client.js';
import type { VoiceClientConfig, VoiceTarget } from './types.js';

/**
 * 语音播报模块控制器
 *
 * 使用分离式访问器模式，通过 `cabinet` / `control` 属性访问不同端的语音客户端
 *
 * @example
 * ```typescript
 * const voiceBroadcast = VoiceBroadcast.getInstance();
 *
 * // 柜子端播报
 * voiceBroadcast.cabinet.broadcast('已申请，请等待授权');
 *
 * // 控制端播报
 * voiceBroadcast.control.broadcast('授权通过');
 * ```
 */
export class VoiceBroadcast {
  private static instance: VoiceBroadcast | null = null;
  private static initialized = false;

  private log = createModuleLogger('VoiceBroadcast');
  private hardwareManager: HardwareCommunicationManager;
  private clientConfigs: Map<string, VoiceClientConfig>;
  private clients: Map<VoiceTarget, VoiceClient>;
  private defaultClientId?: string;

  private constructor(
    hardwareManager: HardwareCommunicationManager,
    config: { clients: VoiceClientConfig[]; defaultClientId?: string }
  ) {
    this.hardwareManager = hardwareManager;
    this.clientConfigs = new Map(config.clients.map((c) => [c.id, c]));
    this.clients = new Map();
    this.defaultClientId = config.defaultClientId;

    // 初始化预置的语音客户端
    for (const clientConfig of config.clients) {
      const target = this.getTargetFromClientId(clientConfig.id);
      if (target) {
        this.clients.set(target, new VoiceClient(hardwareManager, clientConfig));
      }
    }

    this.log.debug('语音播报控制器已初始化', {
      clients: config.clients.map((client) => ({
        id: client.id,
        targetClientId: client.targetClientId,
        protocol: client.protocol,
        description: client.description,
        volume: client.volume,
        speed: client.speed
      })),
      defaultClientId: this.defaultClientId
    });
  }

  /**
   * 根据客户端 ID 获取目标类型
   */
  private getTargetFromClientId(clientId: string): VoiceTarget | null {
    if (clientId.includes('cabinet')) return 'cabinet';
    if (clientId.includes('control')) return 'control';
    return null;
  }

  /**
   * 柜子端语音客户端
   *
   * @example
   * ```typescript
   * VoiceBroadcast.getInstance().cabinet.broadcast('请取出弹药');
   * ```
   */
  get cabinet(): VoiceClient {
    const client = this.clients.get('cabinet');
    if (!client) {
      throw new Error('柜子端语音客户端未配置');
    }
    return client;
  }

  /**
   * 控制端语音客户端
   *
   * @example
   * ```typescript
   * VoiceBroadcast.getInstance().control.broadcast('授权已批准');
   * ```
   */
  get control(): VoiceClient {
    const client = this.clients.get('control');
    if (!client) {
      throw new Error('控制端语音客户端未配置');
    }
    return client;
  }

  /**
   * 检查是否存在指定目标的客户端
   * @param target 目标类型 ('cabinet' | 'control')
   */
  hasClient(target: VoiceTarget): boolean {
    return this.clients.has(target);
  }

  /**
   * 获取指定目标的客户端（可选，不存在时返回 undefined）
   * @param target 目标类型 ('cabinet' | 'control')
   */
  getClient(target: VoiceTarget): VoiceClient | undefined {
    return this.clients.get(target);
  }

  /**
   * 播报文本（保留用于高级场景，如动态选择目标）
   * @param text 要播报的文本
   * @param options 播报选项
   * @param targetClientId 目标客户端 ID（可选）
   *
   * @deprecated 建议使用 `cabinet.broadcast()` 或 `control.broadcast()` 来明确指定目标
   */
  async broadcast(
    text: string,
    options: {
      volume?: number; // 0-10
      speed?: number; // 0-10
      voice?: 3 | 51; // 3:女, 51:男
      sound?: string; // 预设提示音 ID, e.g. 'sound108'
      repeat?: number; // 播报次数，默认 1
    } = {},
    targetClientId?: string
  ): Promise<boolean> {
    try {
      const resolvedClientId = targetClientId ?? this.defaultClientId;

      if (resolvedClientId && !this.clientConfigs.has(resolvedClientId)) {
        this.log.warn('未找到指定的语音播报客户端，取消发送', {
          targetClientId: resolvedClientId
        });
        return false;
      }

      // 获取客户端配置
      const clientConfig = resolvedClientId ? this.clientConfigs.get(resolvedClientId) : undefined;
      const protocol = clientConfig?.protocol || 'tcp';
      const hardwareClientId = clientConfig?.targetClientId;

      // 合并配置：选项 > 默认配置
      const finalVolume = options.volume !== undefined ? options.volume : clientConfig?.volume;
      const finalSpeed = options.speed !== undefined ? options.speed : clientConfig?.speed;

      // 验证选项
      const validatedOptions = VoiceSchemas.BroadcastOptions.parse({
        ...options,
        volume: finalVolume,
        speed: finalSpeed
      });

      // 使用验证后的选项
      const opts = validatedOptions;

      let cmdPrefix = '#';
      if (opts.repeat && opts.repeat > 1) {
        cmdPrefix = '#'.repeat(Math.min(opts.repeat, 10));
      }

      let cmdBody = '';

      // 添加控制标识符
      if (opts.volume !== undefined) cmdBody += `[v${opts.volume}]`;
      if (opts.speed !== undefined) cmdBody += `[s${opts.speed}]`;
      if (opts.voice !== undefined) cmdBody += `[m${opts.voice}]`;

      // 添加提示音
      if (opts.sound) cmdBody += `${opts.sound} `;

      cmdBody += text;

      const fullCommandStr = `${cmdPrefix}${cmdBody}`;

      // 编码为 GB2312
      const encodedCommand = iconv.encode(fullCommandStr, 'gb2312');

      this.log.debug('发送语音播报命令', {
        text,
        command: fullCommandStr,
        hex: encodedCommand.toString('hex'),
        clientId: resolvedClientId ?? 'all',
        hardwareTarget: hardwareClientId
      });

      const result = await this.hardwareManager.sendCommand(
        protocol,
        encodedCommand,
        hardwareClientId,
        false
      );

      if (resolvedClientId) {
        if (hardwareClientId) {
          const response = result[hardwareClientId];
          if (response && response.success === false) {
            this.log.error('语音播报指令发送失败', {
              error: response.error,
              clientId: resolvedClientId
            });
            return false;
          }
        }
      } else {
        const failedClients = Object.entries(result)
          .filter(([, response]) => response && response.success === false)
          .map(([clientId]) => clientId);
        if (failedClients.length > 0) {
          this.log.error('语音播报指令发送失败', { failedClients });
          return false;
        }
      }

      return true;

    } catch (error) {
      this.log.error('播报过程发生错误', error as Error);
      return false;
    }
  }

  /**
   * 播放内置提示音
   * @param soundId 提示音 ID，例如 'sound108'
   *
   * @deprecated 建议使用 `cabinet.playSound()` 或 `control.playSound()` 来明确指定目标
   */
  async playSound(soundId: string): Promise<boolean> {
    return this.broadcast(soundId);
  }

  /**
   * 设置打断模式 (新指令会立即中断当前播报)
   *
   * @deprecated 建议使用 `cabinet.setInterruptMode()` 或 `control.setInterruptMode()` 来明确指定目标
   */
  async setInterruptMode(): Promise<boolean> {
    const cmd = Buffer.from([0xCC, 0xDD, 0xF3, 0x00]);

    const clientConfig = this.defaultClientId ? this.clientConfigs.get(this.defaultClientId) : undefined;
    const protocol = clientConfig?.protocol || 'tcp';
    const hardwareClientId = clientConfig?.targetClientId;

    try {
      await this.hardwareManager.sendCommand(protocol, cmd, hardwareClientId);
      this.log.info('已设置为打断模式');
      return true;
    } catch (error) {
      this.log.error('设置打断模式失败', error as Error);
      return false;
    }
  }

  /**
   * 设置缓存模式 (最多缓存 20 条指令)
   *
   * @deprecated 建议使用 `cabinet.setCacheMode()` 或 `control.setCacheMode()` 来明确指定目标
   */
  async setCacheMode(): Promise<boolean> {
    const cmd = Buffer.from([0xCC, 0xDD, 0xF3, 0x01]);

    const clientConfig = this.defaultClientId ? this.clientConfigs.get(this.defaultClientId) : undefined;
    const protocol = clientConfig?.protocol || 'tcp';
    const hardwareClientId = clientConfig?.targetClientId;

    try {
      await this.hardwareManager.sendCommand(protocol, cmd, hardwareClientId);
      this.log.info('已设置为缓存模式');
      return true;
    } catch (error) {
      this.log.error('设置缓存模式失败', error as Error);
      return false;
    }
  }

  /**
   * 初始化单例实例
   * @param hardwareManager 硬件通信管理器
   * @param config 语音播报模块配置
   */
  static initialize(
    hardwareManager: HardwareCommunicationManager,
    config: { clients: VoiceClientConfig[]; defaultClientId?: string }
  ): void {
    if (VoiceBroadcast.instance) {
      const log = createModuleLogger('VoiceBroadcast');
      log.warn('语音播报控制器已经初始化，跳过重复初始化');
      return;
    }

    VoiceBroadcast.instance = new VoiceBroadcast(hardwareManager, config);
    VoiceBroadcast.initialized = true;
  }

  /**
   * 获取单例实例
   * @returns VoiceBroadcast 实例
   * @throws 如果未初始化则抛出错误
   */
  static getInstance(): VoiceBroadcast {
    if (!VoiceBroadcast.instance) {
      throw new Error('语音播报控制器未初始化，请先调用 VoiceBroadcast.initialize()');
    }
    return VoiceBroadcast.instance;
  }

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  static isInitialized(): boolean {
    return VoiceBroadcast.initialized && VoiceBroadcast.instance !== null;
  }

  /**
   * 销毁单例实例
   */
  static destroy(): void {
    VoiceBroadcast.instance = null;
    VoiceBroadcast.initialized = false;
  }
}

// 向后兼容别名
export { VoiceBroadcast as VoiceBroadcastController };
