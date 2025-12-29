import { setup, createActor, sendParent, enqueueActions } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { parseActiveReportFrame, isActiveReportFrame, type RelayStatus } from '../relay/index.js';
import { EventPriority } from '../types/state-machine.js';
import { RelayStatusAggregator, type RelayClientId } from '../business-logic/index.js';
import { config } from '../config/index.js';
import { createModuleLogger } from 'shared';

const log = createModuleLogger('MonitorMachine');

type MonitorContext = {
  hardware: HardwareCommunicationManager;
  aggregator: RelayStatusAggregator;
};

type MonitorEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RELAY_DATA_RECEIVED'; clientId: string; data: Buffer };

export const monitorMachine = setup({
  types: {
    context: {} as MonitorContext,
    events: {} as MonitorEvent,
    input: {} as { hardware: HardwareCommunicationManager }
  },
  actors: {}
}).createMachine({
  id: 'monitor',
  initial: 'idle',
  context: ({ input }) => ({
    hardware: input.hardware,
    aggregator: new RelayStatusAggregator()
  }),
  entry: [
    ({ context, self }) => {
      // 监听所有协议的数据（TCP 和 Serial）
      context.hardware.onIncomingData = (protocol, clientId, data) => {
        log.debug(`收到硬件数据: protocol=${protocol}, clientId=${clientId}, data=${data.toString('hex')}`);
        self.send({ type: 'RELAY_DATA_RECEIVED', clientId, data });
      };
    }
  ],
  on: {
    RELAY_DATA_RECEIVED: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        const { clientId, data } = event;
        log.debug(`正在处理来自 ${clientId} 的继电器数据: ${data.toString('hex')}`);

        try {
          if (!isActiveReportFrame(data)) {
            log.debug(`跳过非主动上报帧: ${data.toString('hex')}`);
            return;
          }

          const report = parseActiveReportFrame(data);
          const status: RelayStatus = {
            rawHex: report.rawHex,
            channels: report.inputState
          };
          const combinedUpdate = context.aggregator.update(clientId as RelayClientId, status);

          if (!combinedUpdate) return;

          if (combinedUpdate.changed) {
            log.info(`检测到 ${clientId} 的状态变化, 总变化计数: ${combinedUpdate.changeDescriptions.length}`);
          }

          // 处理申请逻辑
          if (hasEdgeChanged(report, clientId, config.APPLY_INDEX)) {
            const isClosed = combinedUpdate.combinedState[config.APPLY_INDEX];
            log.info(`APPLY_INDEX (申请) 已变化. 闭合: ${isClosed}`);
            enqueue.sendParent({
              type: isClosed ? 'apply_request' : 'finish_request',
              priority: EventPriority.P2
            });
          }

          // 处理授权逻辑
          if (hasEdgeChanged(report, clientId, config.AUTH_PASS_INDEX)) {
            const isClosed = combinedUpdate.combinedState[config.AUTH_PASS_INDEX];
            log.info(`AUTH_PASS_INDEX (授权) 已变化. 闭合: ${isClosed}`);
            enqueue.sendParent({
              type: isClosed ? 'authorize_request' : 'refuse_request',
              priority: EventPriority.P2
            });
          }

          // 处理柜门状态逻辑
          // 默认为 open 状态（true = 断开），触发时为 close 状态（false = 闭合）
          if (hasEdgeChanged(report, clientId, config.CABINET_DOOR_INDEX)) {
            const isOpen = combinedUpdate.combinedState[config.CABINET_DOOR_INDEX]; // true = open（断开，默认），false = close（闭合，触发）
            log.info(`CABINET_DOOR_INDEX (柜门) 已变化. 开门: ${isOpen}`);
            enqueue.sendParent({
              type: 'cabinet_lock_changed',
              priority: EventPriority.P2,
              isClosed: !isOpen  // true = 关门（触发状态），false = 开门（默认状态）
            });
          }

          // 处理门跳开关逻辑
          // 默认为 open 状态（true = 断开），触发时为 close 状态（false = 闭合）
          if (hasEdgeChanged(report, clientId, config.DOOR_JUMP_SWITCH_INDEX)) {
            const isOpen = combinedUpdate.combinedState[config.DOOR_JUMP_SWITCH_INDEX]; // true = open（断开，默认），false = close（闭合，触发）
            log.info(`DOOR_JUMP_SWITCH_INDEX (门跳开关) 已变化. 断开: ${isOpen}`);
            enqueue.sendParent({
              type: 'door_jump_switch_changed',
              priority: EventPriority.P2,
              isTriggered: !isOpen  // true = 触发（闭合），false = 未触发（断开，默认）
            });
          }

          // 处理钥匙开关逻辑
          // 默认为 open 状态（true = 断开），触发时为 close 状态（false = 闭合）
          if (hasEdgeChanged(report, clientId, config.KEY_SWITCH_INDEX)) {
            const isOpen = combinedUpdate.combinedState[config.KEY_SWITCH_INDEX]; // true = open（断开，默认），false = close（闭合，触发）
            log.info(`KEY_SWITCH_INDEX (钥匙开关) 已变化. 断开: ${isOpen}`);
            enqueue.sendParent({
              type: 'key_switch_changed',
              priority: EventPriority.P2,
              isTriggered: !isOpen  // true = 触发（闭合），false = 未触发（断开，默认）
            });
          }

          // 处理报警取消按钮逻辑
          if (hasEdgeChanged(report, clientId, config.ALARM_CANCEL_INDEX)) {
            log.info(`ALARM_CANCEL_INDEX (报警取消) 已变化`);
            enqueue.sendParent({
              type: 'alarm_cancel_toggled',
              priority: EventPriority.P2
            });
          }

          if (combinedUpdate.changed && combinedUpdate.changeDescriptions.length > 0) {
            log.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
          }
        } catch (err) {
          log.error('在 MonitorMachine 中解析继电器状态失败', err as Error);
        }
      })
    }
  },
  states: {
    idle: {
      on: {
        START: 'waiting'
      }
    },
    waiting: {
      on: {
        STOP: 'idle'
      }
    },
    error: {
      entry: sendParent(({ event }) => ({
        type: 'monitor_anomaly',
        priority: EventPriority.P1,
        data: (event as any).data
      })),
      always: 'waiting'
    }
  }
});

export function createMonitorActor(hardware: HardwareCommunicationManager) {
  return createActor(monitorMachine, { input: { hardware } });
}

function hasEdgeChanged(
  report: { risingEdge: number[]; fallingEdge: number[] },
  clientId: string,
  index: number
): boolean {
  const offset = clientId === 'control' ? 8 : 0;
  const localIndex = index - offset;

  if (localIndex < 0 || localIndex > 7) {
    return false;
  }

  return report.risingEdge.includes(localIndex) || report.fallingEdge.includes(localIndex);
}
