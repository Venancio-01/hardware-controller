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
  private lastCombined: boolean[] | null = null;
  private lastRaw = new Map<RelayClientId, string>();

  update(clientId: RelayClientId, status: RelayStatus): RelayCombinedUpdate | null {
    this.latestChannels[clientId] = status.channels;
    this.lastRaw.set(clientId, status.raw);

    const cabinetChannels = this.latestChannels.cabinet;
    const controlChannels = this.latestChannels.control;

    if (!cabinetChannels || !controlChannels) {
      return null;
    }

    const combinedState = [...cabinetChannels, ...controlChannels];
    const previousCombined = this.lastCombined;
    const changed = previousCombined ? !this.isSameCombinedState(previousCombined, combinedState) : false;

    const changeDescriptions = changed && previousCombined
      ? combinedState
        .map((on, i) => previousCombined[i] !== on
          ? `CH${i + 1}: ${previousCombined[i] ? '闭合' : '断开'} → ${on ? '闭合' : '断开'}`
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
