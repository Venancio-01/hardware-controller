import iconv from 'iconv-lite';
import { createModuleLogger } from '../logger/index.js';
import { HardwareCommunicationManager } from '../hardware/manager.js';

/**
 * 语音播报模块控制器
 * 基于 TCP/IP 协议 (自由协议)
 */
export class VoiceBroadcastController {
  private log = createModuleLogger('VoiceBroadcastController');
  private clientId = 'voice-broadcast';
  private hardwareManager: HardwareCommunicationManager;

  constructor(
    hardwareManager: HardwareCommunicationManager,
    config: { host: string; port: number }
  ) {
    this.hardwareManager = hardwareManager;

    this.log.info('语音播报控制器已初始化', {
      host: config.host,
      port: config.port
    });
  }

  /**
   * 播报文本
   * @param text 要播报的文本
   * @param options 播报选项
   */
  async broadcast(text: string, options: {
    volume?: number; // 0-10
    speed?: number; // 0-10
    voice?: 3 | 51; // 3:女, 51:男
    sound?: string; // 预设提示音 ID, e.g. 'sound108'
    repeat?: number; // 播报次数，默认 1
  } = {}): Promise<boolean> {
    try {
      let cmdPrefix = '#';
      if (options.repeat && options.repeat > 1) {
        cmdPrefix = '#'.repeat(Math.min(options.repeat, 10));
      }

      let cmdBody = '';

      // 添加控制标识符
      if (options.volume !== undefined) cmdBody += `[v${Math.min(Math.max(options.volume, 0), 10)}]`;
      if (options.speed !== undefined) cmdBody += `[s${Math.min(Math.max(options.speed, 0), 10)}]`;
      if (options.voice !== undefined) cmdBody += `[m${options.voice}]`;

      // 添加提示音
      if (options.sound) cmdBody += `${options.sound} `;

      cmdBody += text;

      const fullCommandStr = `${cmdPrefix}${cmdBody}`;

      // 编码为 GB2312
      const encodedCommand = iconv.encode(fullCommandStr, 'gb2312');

      this.log.info('发送语音播报命令', {
        text,
        command: fullCommandStr,
        hex: encodedCommand.toString('hex')
      });

      const result = await this.hardwareManager.sendCommand(
        'tcp',
        encodedCommand,
        undefined,
        this.clientId
      );

      const response = result[this.clientId];
      if (response && response.success) {
        const data = response.data;
        if (typeof data === 'string' && data.includes('OK')) {
          this.log.info('语音播报指令已接收 (OK)');
          return true;
        }
        return true;
      } else {
        this.log.error('语音播报指令发送失败或未收到确认', { error: response?.error });
        return false;
      }

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
      await this.hardwareManager.sendCommand('tcp', cmd, undefined, this.clientId);
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
      await this.hardwareManager.sendCommand('tcp', cmd, undefined, this.clientId);
      this.log.info('已设置为缓存模式');
      return true;
    } catch (error) {
      this.log.error('设置缓存模式失败', error as Error);
      return false;
    }
  }
}
