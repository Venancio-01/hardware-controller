import { StructuredLogger } from '../logger/index.js';

/**
 * 组合继电器状态
 * 一个长度为 16 的布尔数组
 * - Index 0-7: Cabinet Relay 1-8 (柜体端)
 * - Index 8-15: Control Relay 1-8 (控制端)
 */

export type CombinedRelayState = boolean[];

/**
 * 继电器策略接口
 * 定义了基于 16 路组合状态的匹配和执行逻辑
 */
export interface RelayStrategy {
  /**
   * 策略名称，用于日志标识
   */
  name: string;

  /**
   * 检查是否匹配当前状态组合
   * @param state 16路组合状态
   */
  match(state: CombinedRelayState): boolean;

  /**
   * 执行策略业务逻辑
   * @param state 16路组合状态
   * @param logger 日志记录器
   * @param previousState 上一次的16路组合状态 (可能为空)
   */
  execute(state: CombinedRelayState, logger: StructuredLogger, previousState?: CombinedRelayState): Promise<void>;
}

/**
 * 继电器策略上下文/控制器
 * 负责维护状态并调度策略
 */
export class RelayContext {
  private strategies: RelayStrategy[] = [];

  // 内部维护两个客户端的状态
  private cabinetState: boolean[] = new Array(8).fill(false);
  private controlState: boolean[] = new Array(8).fill(false);
  
  // 记录上一次的完整组合状态
  private lastCombinedState: CombinedRelayState | undefined;

  constructor(private logger: StructuredLogger) { }

  /**
   * 注册策略
   */
  registerStrategy(strategy: RelayStrategy) {
    this.strategies.push(strategy);
    this.logger.info(`Registered relay strategy: ${strategy.name}`);
  }

  /**
   * 更新特定客户端的继电器状态，并触发策略检查
   * @param clientId 客户端ID ('cabinet' | 'control')
   * @param channels 8路通道状态数组
   */
  async updateState(clientId: 'cabinet' | 'control', channels: boolean[]): Promise<void> {
    if (channels.length !== 8) {
      this.logger.warn(`Invalid channel length for ${clientId}: ${channels.length}, expected 8`);
      return;
    }

    // 更新内部状态
    if (clientId === 'cabinet') {
      this.cabinetState = [...channels];
    } else {
      this.controlState = [...channels];
    }

    // 构建 16 路组合状态
    const fullState: CombinedRelayState = [...this.cabinetState, ...this.controlState];

    // 遍历并执行匹配的策略
    for (const strategy of this.strategies) {
      try {
        if (strategy.match(fullState)) {
          this.logger.info(`Strategy matched: ${strategy.name}`);
          // 传递当前状态、日志记录器和上一次状态
          await strategy.execute(fullState, this.logger, this.lastCombinedState);
        }
      } catch (error) {
        this.logger.error(`Error executing strategy ${strategy.name}`, error as Error);
      }
    }
    
    // 更新上一次状态记录 (深拷贝)
    this.lastCombinedState = [...fullState];
  }
}
