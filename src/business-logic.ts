import { config } from './config/index.js';
import { type HardwareCommunicationManager } from './hardware/manager.js';
import { type StructuredLogger } from './logger/index.js';
import { RelayCommandBuilder, parseStatusResponse } from './relay/controller.js';
import { VoiceBroadcastController } from './voice-broadcast/index.js';
import { ApplyAmmoFlow } from './business-logic/apply-ammo-flow.js';
import { RelayStatusAggregator, type RelayClientId } from './business-logic/relay-status-aggregator.js';

export class BusinessLogicManager {
  private ac: AbortController | null = null;
  private queryLoop: NodeJS.Timeout | null = null;
  private relayAggregator = new RelayStatusAggregator();
  private applyAmmoFlow: ApplyAmmoFlow;

  constructor(
    private manager: HardwareCommunicationManager,
    private logger: StructuredLogger
  ) {
    this.applyAmmoFlow = new ApplyAmmoFlow(logger);
  }

  async initialize() {
    //  初始化硬件通信
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

    const tcpClientsConfig: {
      id: string;
      targetHost: string;
      targetPort: number;
      framing: boolean;
      heartbeatStrict: boolean;
      description: string;
    }[] = [];

    const voiceClients: { id: string; host: string; port: number; description: string; volume?: number; speed?: number }[] = [];

    if (config.VOICE_BROADCAST_CABINET_HOST && config.VOICE_BROADCAST_CABINET_PORT) {
      tcpClientsConfig.push({
        id: 'voice-broadcast-cabinet',
        targetHost: config.VOICE_BROADCAST_CABINET_HOST,
        targetPort: config.VOICE_BROADCAST_CABINET_PORT,
        framing: false,
        heartbeatStrict: false,
        description: '柜体端语音播报模块'
      });
      voiceClients.push({
        id: 'voice-broadcast-cabinet',
        host: config.VOICE_BROADCAST_CABINET_HOST,
        port: config.VOICE_BROADCAST_CABINET_PORT,
        description: '柜体端语音播报模块',
        volume: config.VOICE_BROADCAST_CABINET_VOLUME,
        speed: config.VOICE_BROADCAST_CABINET_SPEED
      });
    } else {
      this.logger.warn('柜体端语音播报配置缺失，已跳过初始化');
    }

    if (config.VOICE_BROADCAST_CONTROL_HOST && config.VOICE_BROADCAST_CONTROL_PORT) {
      tcpClientsConfig.push({
        id: 'voice-broadcast-control',
        targetHost: config.VOICE_BROADCAST_CONTROL_HOST,
        targetPort: config.VOICE_BROADCAST_CONTROL_PORT,
        framing: false,
        heartbeatStrict: false,
        description: '控制端语音播报模块'
      });
      voiceClients.push({
        id: 'voice-broadcast-control',
        host: config.VOICE_BROADCAST_CONTROL_HOST,
        port: config.VOICE_BROADCAST_CONTROL_PORT,
        description: '控制端语音播报模块',
        volume: config.VOICE_BROADCAST_CONTROL_VOLUME,
        speed: config.VOICE_BROADCAST_CONTROL_SPEED
      });
    } else if (config.VOICE_BROADCAST_CONTROL_HOST || config.VOICE_BROADCAST_CONTROL_PORT) {
      this.logger.warn('控制端语音播报配置不完整，已跳过初始化');
    }

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

    // 重置所有继电器状态为断开
    await this.resetAllRelays();

    //  初始化并测试语音模块
    if (voiceClients.length > 0) {
      try {
        VoiceBroadcastController.initialize(this.manager, {
          clients: voiceClients,
          defaultClientId: voiceClients[0]?.id
        });

        // const voiceController = VoiceBroadcastController.getInstance();
        // await voiceController.broadcast('你好');
      } catch (err) {
        this.logger.warn('语音模块初始化失败', { error: err });
      }
    } else {
      this.logger.warn('未检测到可用的语音播报配置，已跳过语音模块初始化');
    }

    this.applyAmmoFlow.start();

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

          if (clientId === 'cabinet' || clientId === 'control') {
            const combinedUpdate = this.relayAggregator.update(
              clientId as RelayClientId,
              status
            );

            if (combinedUpdate && combinedUpdate.changed) {
              this.applyAmmoFlow.handleCombinedChange(
                combinedUpdate.previousCombined,
                combinedUpdate.combinedState
              );

              if (combinedUpdate.changeDescriptions.length > 0) {
                this.logger.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
                this.logger.info(
                  `[combined] 当前全部十六路状态: ${combinedUpdate.allStatusText} (raw: cabinet=${combinedUpdate.raw.cabinet} control=${combinedUpdate.raw.control})`
                );
              }
            }
          }
        } catch (err) {
          this.logger.error(`解析继电器状态失败: ${rawStr}`, err as Error);
        }
        return;
      }

      // 其他响应
      this.logger.debug(`[${protocol.toUpperCase()}] Response from ${clientId}:`, { raw: rawStr, ...parsedResponse });
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
    this.applyAmmoFlow.stop();
  }
}
