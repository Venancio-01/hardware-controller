import iconv from 'iconv-lite';
import { createModuleLogger } from '../logger/index.js';
import { HardwareCommunicationManager } from '../hardware/manager.js';
import { VoiceSchemas } from './validation.js';
import type { VoiceClientConfig } from './types.js';

/**
 * 语音播报模块控制器
 * 基于 TCP/IP 协议 (自由协议)
 */
export class VoiceBroadcastController {
  private static instance: VoiceBroadcastController | null = null;
  private static initialized = false;

  private log = createModuleLogger('VoiceBroadcastController');
  private hardwareManager: HardwareCommunicationManager;
  private clientConfigs: Map<string, VoiceClientConfig>;
  private defaultClientId?: string;

  private constructor(
    hardwareManager: HardwareCommunicationManager,
    config: { clients: VoiceClientConfig[]; defaultClientId?: string }
  ) {
    this.hardwareManager = hardwareManager;
    this.clientConfigs = new Map(config.clients.map((c) => [c.id, c]));
    this.defaultClientId = config.defaultClientId;

    this.log.debug('语音播报控制器已初始化', {
      clients: config.clients.map((client) => ({
        id: client.id,
        host: client.host,
        port: client.port,
        description: client.description,
        volume: client.volume,
        speed: client.speed
      })),
      defaultClientId: this.defaultClientId
    });
  }

  /**
   * 播报文本
   * @param text 要播报的文本
   * @param options 播报选项
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

      // 获取客户端默认配置
      const clientConfig = resolvedClientId ? this.clientConfigs.get(resolvedClientId) : undefined;

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
        clientId: resolvedClientId ?? 'all'
      });

      const result = await this.hardwareManager.sendCommand(
        'tcp',
        encodedCommand,
        undefined,
        resolvedClientId,
        false
      );

      if (resolvedClientId) {
        const response = result[resolvedClientId];
        if (response && response.success === false) {
          this.log.error('语音播报指令发送失败', {
            error: response.error,
            clientId: resolvedClientId
          });
          return false;
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
   */
  async playSound(soundId: string): Promise<boolean> {
    return this.broadcast(soundId);
  }

  /**
   * 设置打断模式 (新指令会立即中断当前播报)
   */
  async setInterruptMode(): Promise<boolean> {
    const cmd = Buffer.from([0xCC, 0xDD, 0xF3, 0x00]);
    try {
      await this.hardwareManager.sendCommand('tcp', cmd, undefined, this.defaultClientId);
      this.log.info('已设置为打断模式');
      return true;
    } catch (error) {
      this.log.error('设置打断模式失败', error as Error);
      return false;
    }
  }

  /**
   * 设置缓存模式 (最多缓存 20 条指令)
   */
  async setCacheMode(): Promise<boolean> {
    const cmd = Buffer.from([0xCC, 0xDD, 0xF3, 0x01]);
    try {
      await this.hardwareManager.sendCommand('tcp', cmd, undefined, this.defaultClientId);
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
    if (VoiceBroadcastController.instance) {
      const log = createModuleLogger('VoiceBroadcastController');
      log.warn('语音播报控制器已经初始化，跳过重复初始化');
      return;
    }

    VoiceBroadcastController.instance = new VoiceBroadcastController(hardwareManager, config);
    VoiceBroadcastController.initialized = true;
  }

  /**
   * 获取单例实例
   * @returns VoiceBroadcastController 实例
   * @throws 如果未初始化则抛出错误
   */
  static getInstance(): VoiceBroadcastController {
    if (!VoiceBroadcastController.instance) {
      throw new Error('语音播报控制器未初始化，请先调用 VoiceBroadcastController.initialize()');
    }
    return VoiceBroadcastController.instance;
  }

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  static isInitialized(): boolean {
    return VoiceBroadcastController.initialized && VoiceBroadcastController.instance !== null;
  }

  /**
   * 销毁单例实例
   */
  static destroy(): void {
    VoiceBroadcastController.instance = null;
    VoiceBroadcastController.initialized = false;
  }
}
