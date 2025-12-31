import iconv from 'iconv-lite';
import { createModuleLogger, type StructuredLogger } from 'shared';
import type { HardwareCommunicationManager } from '../hardware/manager.js';
import type { Protocol } from '../types/index.js';
import { VoiceSchemas } from './validation.js';
import type { BroadcastOptions, VoiceClientConfig } from './types.js';

/**
 * 语音播报客户端
 * 封装单个端（柜子端/控制端）的播报逻辑
 */
export class VoiceClient {
  private log: StructuredLogger;
  private hardwareManager: HardwareCommunicationManager;
  private clientConfig: VoiceClientConfig;

  constructor(
    hardwareManager: HardwareCommunicationManager,
    clientConfig: VoiceClientConfig
  ) {
    this.hardwareManager = hardwareManager;
    this.clientConfig = clientConfig;
    this.log = createModuleLogger(`VoiceClient:${clientConfig.id}`);
  }

  /**
   * 客户端标识符
   */
  get id(): string {
    return this.clientConfig.id;
  }

  /**
   * 目标硬件客户端 ID
   */
  get targetClientId(): string {
    return this.clientConfig.targetClientId;
  }

  /**
   * 通信协议
   */
  get protocol(): Protocol {
    return this.clientConfig.protocol;
  }

  /**
   * 播报文本
   * @param text 要播报的文本
   * @param options 播报选项（可覆盖客户端默认配置）
   */
  async broadcast(text: string, options: BroadcastOptions = {}): Promise<boolean> {
    try {
      // 合并配置：调用选项 > 客户端默认配置
      const finalVolume = options.volume ?? this.clientConfig.volume;
      const finalSpeed = options.speed ?? this.clientConfig.speed;

      // 验证选项
      const validatedOptions = VoiceSchemas.BroadcastOptions.parse({
        ...options,
        volume: finalVolume,
        speed: finalSpeed
      });

      // 构建命令字符串
      let cmdPrefix = '#';
      if (validatedOptions.repeat && validatedOptions.repeat > 1) {
        cmdPrefix = '#'.repeat(Math.min(validatedOptions.repeat, 10));
      }

      let cmdBody = '';

      // 添加控制标识符
      if (validatedOptions.volume !== undefined) cmdBody += `[v${validatedOptions.volume}]`;
      if (validatedOptions.speed !== undefined) cmdBody += `[s${validatedOptions.speed}]`;
      if (validatedOptions.voice !== undefined) cmdBody += `[m${validatedOptions.voice}]`;

      // 添加提示音
      if (validatedOptions.sound) cmdBody += `${validatedOptions.sound} `;

      cmdBody += text;

      // 协议不需要 CRLF 结尾，否则会导致设备无响应
      const fullCommandStr = `${cmdPrefix}${cmdBody}`;

      // 编码为 GB2312
      const encodedCommand = iconv.encode(fullCommandStr, 'gb2312');

      this.log.debug('发送语音播报命令', {
        text,
        command: fullCommandStr,
        hex: encodedCommand.toString('hex'),
        target: this.clientConfig.targetClientId
      });

      const result = await this.hardwareManager.queueCommand(
        this.clientConfig.protocol,
        encodedCommand,
        this.clientConfig.targetClientId,
        false
      );

      const response = result[this.clientConfig.targetClientId];
      if (response && response.success === false) {
        this.log.error('语音播报指令发送失败', {
          error: response.error,
          clientId: this.clientConfig.id
        });
        return false;
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
    const cmd = Buffer.from([0xcc, 0xdd, 0xf3, 0x00]);

    try {
      await this.hardwareManager.sendCommand(
        this.clientConfig.protocol,
        cmd,
        this.clientConfig.targetClientId
      );
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
    const cmd = Buffer.from([0xcc, 0xdd, 0xf3, 0x01]);

    try {
      await this.hardwareManager.sendCommand(
        this.clientConfig.protocol,
        cmd,
        this.clientConfig.targetClientId
      );
      this.log.info('已设置为缓存模式');
      return true;
    } catch (error) {
      this.log.error('设置缓存模式失败', error as Error);
      return false;
    }
  }
}
