import { type RelayStatus } from '../relay/controller.js';

export type RelayClientId = 'cabinet' | 'control';

export interface RelayCombinedUpdate {
  combinedState: boolean[];
  previousCombined: boolean[] | null;
  changed: boolean;
  changeDescriptions: string[];
  allStatusText: string;
  raw: { cabinet: string; control: string };
}

export class RelayStatusAggregator {
  private latestChannels: { cabinet?: boolean[]; control?: boolean[] } = {};
  private lastCombined: boolean[] | null = new Array(16).fill(false);
  private lastRaw = new Map<RelayClientId, string>();

  update(clientId: RelayClientId, status: RelayStatus): RelayCombinedUpdate | null {
    this.latestChannels[clientId] = status.channels;
    this.lastRaw.set(clientId, status.rawHex);

    const cabinetChannels = this.latestChannels.cabinet;
    const controlChannels = this.latestChannels.control;

    // 支持单客户端模式：任意客户端上报都触发对比逻辑
    // 为了保证索引稳定（control 始终从 8 开始），我们需要填充默认值
    // cabinet: 0-7, control: 8-15
    const cabinetState = cabinetChannels || new Array(8).fill(false);
    const controlState = controlChannels || new Array(8).fill(false);

    // 如果没有任何数据，则不更新
    if (!cabinetChannels && !controlChannels) {
      return null;
    }

    const combinedState = [...cabinetState, ...controlState];
    const previousCombined = this.lastCombined;
    const changed = previousCombined ? !this.isSameCombinedState(previousCombined, combinedState) : false;

    const changeDescriptions = changed && previousCombined
      ? combinedState
        .map((on, i) => previousCombined[i] !== on
          ? `CH${i}: ${previousCombined[i] ? '闭合' : '断开'} → ${on ? '闭合' : '断开'}`
          : null)
        .filter(Boolean) as string[]
      : [];

    const allStatusText = combinedState
      .map((on, i) => `CH${i + 1}:${on ? '闭合' : '断开'}`)
      .join(' ');

    const raw = {
      cabinet: this.lastRaw.get('cabinet') ?? '',
      control: this.lastRaw.get('control') ?? '',
    };

    this.lastCombined = [...combinedState];

    return {
      combinedState,
      previousCombined,
      changed,
      changeDescriptions,
      allStatusText,
      raw
    };
  }

  /**
   * 检查指定索引的继电器是否发生变化
   * @param index 继电器索引（0-based）
   * @param combinedUpdate 继电器状态更新对象
   * @returns 如果该继电器状态发生变化返回 true，否则返回 false
   */
  hasIndexChanged(index: number, combinedUpdate: RelayCombinedUpdate): boolean {
    if (!combinedUpdate.previousCombined) {
      return false;
    }
    if (index < 0 || index >= combinedUpdate.combinedState.length) {
      return false;
    }
    return combinedUpdate.previousCombined[index] !== combinedUpdate.combinedState[index];
  }

  /**
   * 检查指定索引是否在主动上报模式下触发
   * 用于自复位按钮：硬件每次按下只上报一次，状态始终为 true
   * 需要通过重置上次状态来检测新的按下事件
   * @param index 继电器索引（0-based）
   * @param clientId 客户端标识
   * @param combinedUpdate 继电器状态更新对象
   * @returns 如果该继电器被触发返回 true
   */
  hasActiveReportTrigger(index: number, clientId: RelayClientId, combinedUpdate: RelayCombinedUpdate): boolean {
    if (index < 0 || index >= combinedUpdate.combinedState.length) {
      return false;
    }
    // 检查该索引是否属于该客户端
    // cabinet: 0-7, control: 8-15
    const isControlIndex = index >= 8;
    if ((clientId === 'control' && !isControlIndex) || (clientId === 'cabinet' && isControlIndex)) {
      return false;
    }
    // 主动上报模式：只要当前状态为 true 就认为触发
    return combinedUpdate.combinedState[index] === true;
  }

  /**
   * 重置指定客户端的通道状态，用于主动上报模式
   * 在处理完触发事件后调用，以便下次能再次检测
   * @param clientId 客户端标识
   * @param index 要重置的索引
   */
  resetChannelState(clientId: RelayClientId, index: number): void {
    if (this.lastCombined && index >= 0 && index < this.lastCombined.length) {
      this.lastCombined[index] = false;
    }
  }

  private isSameCombinedState(previous: boolean[], current: boolean[]): boolean {
    if (previous.length !== current.length) {
      return false;
    }

    for (let i = 0; i < current.length; i += 1) {
      if (previous[i] !== current[i]) {
        return false;
      }
    }

    return true;
  }
}
