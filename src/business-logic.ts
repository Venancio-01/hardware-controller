import { config } from './config/index.js';
import { type HardwareCommunicationManager } from './hardware/manager.js';
import { type StructuredLogger } from './logger/index.js';
import { RelayCommandBuilder, parseStatusResponse } from './relay/controller.js';
import { VoiceBroadcastController } from './voice-broadcast/index.js';
import { RelayContext } from './relay-strategies/index.js';
import { ApplyAmmoStrategy } from './relay-strategies/apply-ammo.js';

export class BusinessLogicManager {
  private ac: AbortController | null = null;
  private queryLoop: NodeJS.Timeout | null = null;
  private lastRelayStatus = new Map<string, string>();
  private relayContext: RelayContext;

  constructor(
    private manager: HardwareCommunicationManager,
    private logger: StructuredLogger
  ) {
    this.relayContext = new RelayContext(logger);
  }

  /**
   * 初始化业务逻辑
   * - 配置 UDP 客户端
   * - 初始化硬件管理器
   * - 设置数据处理回调
   */
  async initialize() {
    // 注册业务策略
    this.relayContext.registerStrategy(new ApplyAmmoStrategy());

    // 2. 初始化硬件通信 - 从 config 加载
    const udpClientsConfig = [
      {
        id: 'cabinet',
        targetHost: config.CABINET_TARGET_HOST,
        targetPort: config.CABINET_TARGET_PORT,
        description: '柜体端'
      },
      {
        id: 'control',
        targetHost: config.CONTROL_TARGET_HOST,
        targetPort: config.CONTROL_TARGET_PORT,
        description: '控制端'
      }
    ];

    const tcpClientsConfig = [
      {
        id: 'voice-broadcast',
        targetHost: config.VOICE_BROADCAST_HOST,
        targetPort: config.VOICE_BROADCAST_PORT,
        framing: false,
        description: '语音播报模块'
      }
    ];

    await this.manager.initialize({
      udpClients: udpClientsConfig,
      tcpClients: tcpClientsConfig,
      udpPort: config.UDP_LOCAL_PORT,
      globalTimeout: config.HARDWARE_TIMEOUT,
      globalRetries: config.HARDWARE_RETRY_ATTEMPTS,
    });

    this.logger.info('硬件通信已初始化');
    this.logger.info('UDP 客户端状态:', this.manager.getAllConnectionStatus().udp);
    this.logger.info('TCP 客户端状态:', this.manager.getAllConnectionStatus().tcp);

    // 在进入主循环前重置所有继电器状态为断开
    await this.resetAllRelays();

    //  初始化并测试语音模块
    try {
      VoiceBroadcastController.initialize(this.manager, {
        host: config.VOICE_BROADCAST_HOST,
        port: config.VOICE_BROADCAST_PORT
      });

      // const voiceController = VoiceBroadcastController.getInstance();
      // this.logger.info('正在发送启动语音: "你好"...');
      // await voiceController.broadcast('你好');
    } catch (err) {
      this.logger.warn('语音模块初始化失败', { error: err });
    }

    //设置数据处理
    this.setupDataHandler();
  }

  /**
   * 重置所有注册设备的继电器状态为断开
   */
  private async resetAllRelays() {
    this.logger.info('初始化所有继电器状态 (全部置为断开)...');
    const resetCmd = RelayCommandBuilder.open('all');

    const targets = ['cabinet', 'control'];

    const promises = targets.map(async (target) => {
      try {
        await this.manager.sendCommand('udp', resetCmd, undefined, target, false);
        this.logger.info(`[${target}] 继电器初始化重置成功`);
      } catch (err) {
        this.logger.error(`[${target}] 继电器初始化重置失败: ${(err as Error).message}`);
      }
    });

    await Promise.all(promises);
  }

  private setupDataHandler() {
    this.manager.onIncomingData = async (protocol, clientId, data, remote, parsedResponse) => {
      const rawStr = data.toString('utf8').trim();

      // 解析继电器状态响应 (dostatus)
      if (rawStr.startsWith('dostatus')) {
        try {
          const status = parseStatusResponse(rawStr, 'dostatus');

          // 更新策略上下文
          if (clientId === 'cabinet' || clientId === 'control') {
            await this.relayContext.updateState(clientId, status.channels);
          }

          // 检测变化
          const lastStatus = this.lastRelayStatus.get(clientId);
          if (lastStatus && lastStatus !== rawStr) {
            const oldStatus = parseStatusResponse(lastStatus, 'dostatus');
            const changes = status.channels
              .map((on, i) => oldStatus.channels[i] !== on ? `CH${i + 1}: ${oldStatus.channels[i] ? '闭合' : '断开'} → ${on ? '闭合' : '断开'}` : null)
              .filter(Boolean);
            if (changes.length > 0) {
              this.logger.info(`[${clientId}] 继电器状态变化: ${changes.join(', ')}`);
            }
          }
          this.lastRelayStatus.set(clientId, rawStr);
        } catch (err) {
          this.logger.error(`解析继电器状态失败: ${rawStr}`, err as Error);
        }
        return;
      }

      // 其他响应
      this.logger.info(`[${protocol.toUpperCase()}] Response from ${clientId}:`, { raw: rawStr, ...parsedResponse });
    };
  }

  /**
   * 启动查询循环
   */
  startLoop() {
    this.logger.info(`开始 UDP 查询循环 (${config.QUERY_INTERVAL}ms 间隔)`);
    this.logger.info('查询命令: 柜体端(dostatus), 控制端(dostatus)');

    this.ac = new AbortController();

    const relayStatusCmd = RelayCommandBuilder.queryRelayStatus(); // dostatus

    this.queryLoop = setInterval(async () => {
      if (this.ac?.signal.aborted) return;
      try {
        // 柜体端 -> 查询继电器状态
        await this.manager.sendCommand('udp', relayStatusCmd, undefined, 'cabinet', false);

        // 控制端 -> 查询继电器状态
        await this.manager.sendCommand('udp', relayStatusCmd, undefined, 'control', false);
      } catch (error) {
        this.logger.error('查询循环出错', error as Error);
      }
    }, config.QUERY_INTERVAL);
  }

  /**
   * 停止业务逻辑
   */
  stop() {
    if (this.queryLoop) {
      clearInterval(this.queryLoop);
      this.queryLoop = null;
    }
    if (this.ac) {
      this.ac.abort();
      this.ac = null;
    }
  }
}
