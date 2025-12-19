import { config } from './config/index.js';
import { type HardwareCommunicationManager } from './hardware/manager.js';
import { type StructuredLogger } from './logger/index.js';
import { RelayCommandBuilder, parseStatusResponse } from './relay/controller.js';

export class BusinessLogicManager {
  private ac: AbortController | null = null;
  private queryLoop: NodeJS.Timeout | null = null;
  private lastRelayStatus = new Map<string, string>();

  constructor(
    private manager: HardwareCommunicationManager,
    private logger: StructuredLogger
  ) { }

  /**
   * 初始化业务逻辑（Step 2）
   * - 配置 UDP 客户端
   * - 初始化硬件管理器
   * - 设置数据处理回调
   */
  async initialize() {
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

    await this.manager.initialize({
      udpClients: udpClientsConfig,
      udpPort: config.UDP_LOCAL_PORT,
      globalTimeout: config.HARDWARE_TIMEOUT,
      globalRetries: config.HARDWARE_RETRY_ATTEMPTS,
    });

    this.logger.info('硬件通信已初始化');
    this.logger.info('UDP 客户端状态:', this.manager.getAllConnectionStatus().udp);

    //设置数据处理
    this.setupDataHandler();
  }

  private setupDataHandler() {
    this.manager.onIncomingData = (protocol, clientId, data, remote, parsedResponse) => {
      const rawStr = data.toString('utf8').trim();

      // 解析继电器状态响应 (dostatus)
      if (rawStr.startsWith('dostatus')) {
        try {
          const status = parseStatusResponse(rawStr, 'dostatus');
          const statusDisplay = status.channels.map((on, i) => `CH${i + 1}:${on ? '闭合' : '断开'}`).join(' | ');
          this.logger.info(`[${clientId}] 继电器状态: ${statusDisplay}`);

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
   * 启动查询循环（Step 3）
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

        // 控制端 -> 查询继电器状态 (maybe also input?)
        // Let's stick to relay status for now unless requested otherwise, but "Control" implies inputs.
        // However, without specific instruction on commands, I will keep it simple or send relay status to both to match previous behavior but split by ID.
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
