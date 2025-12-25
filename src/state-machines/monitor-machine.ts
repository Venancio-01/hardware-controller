import { setup, createActor, fromPromise, sendParent, enqueueActions } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder, parseStatusResponse } from '../relay/controller.js';
import { EventPriority } from '../types/state-machine.js';
import { RelayStatusAggregator, type RelayClientId } from '../business-logic/relay-status-aggregator.js';
import { config } from '../config/index.js';
import { createModuleLogger } from '../logger/index.js';

const log = createModuleLogger('MonitorMachine');

type MonitorContext = {
  hardware: HardwareCommunicationManager;
  aggregator: RelayStatusAggregator;
};

type MonitorEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'TICK' }
  | { type: 'RELAY_DATA_RECEIVED'; clientId: string; data: Buffer };

export const monitorMachine = setup({
  types: {
    context: {} as MonitorContext,
    events: {} as MonitorEvent,
    input: {} as { hardware: HardwareCommunicationManager }
  },
  actors: {
    queryRelayStatus: fromPromise(async ({ input }: { input: { hardware: HardwareCommunicationManager } }) => {
      const cmd = RelayCommandBuilder.queryRelayStatus();
      await Promise.all([
        input.hardware.sendCommand('udp', cmd, undefined, 'cabinet', false),
        input.hardware.sendCommand('udp', cmd, undefined, 'control', false)
      ]);
    })
  }
}).createMachine({
  id: 'monitor',
  initial: 'idle',
  context: ({ input }) => ({
    hardware: input.hardware,
    aggregator: new RelayStatusAggregator()
  }),
  entry: [
    ({ context, self }) => {
      context.hardware.onIncomingData = (protocol, clientId, data) => {
        log.debug(`收到硬件数据: ${clientId} ${data.toString()}`);
        if (protocol === 'udp') {
          self.send({ type: 'RELAY_DATA_RECEIVED', clientId, data });
        }
      };
    }
  ],
  on: {
    RELAY_DATA_RECEIVED: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        const { clientId, data } = event;
        const rawStr = data.toString('utf8').trim();
        log.debug(`正在处理来自 ${clientId} 的继电器数据: ${rawStr}`);
        if (!rawStr.startsWith('dostatus')) return;

        try {
          const status = parseStatusResponse(rawStr, 'dostatus');
          const combinedUpdate = context.aggregator.update(clientId as RelayClientId, status);

          if (combinedUpdate && combinedUpdate.changed) {
            log.info(`检测到 ${clientId} 的状态变化, 总变化计数: ${combinedUpdate.changeDescriptions.length}`);
            // 1. 处理申请逻辑 (CH1)
            if (context.aggregator.hasIndexChanged(config.APPLY_INDEX, combinedUpdate)) {
              const isClosed = combinedUpdate.combinedState[config.APPLY_INDEX];
              log.info(`[逻辑] CH1 (申请) 已变化. 闭合: ${isClosed}`);
              enqueue.sendParent({
                type: isClosed ? 'apply_request' : 'finish_request',
                priority: EventPriority.P2
              });
            }

            // 2. 处理授权逻辑 (CH13)
            if (context.aggregator.hasIndexChanged(config.ELECTRIC_LOCK_OUT_INDEX, combinedUpdate)) {
              const isClosed = combinedUpdate.combinedState[config.ELECTRIC_LOCK_OUT_INDEX];
              log.info(`[逻辑] ELECTRIC_LOCK_OUT_INDEX (CH10) 已变化. 闭合: ${isClosed}`);
              enqueue.sendParent({
                type: isClosed ? 'authorize_request' : 'refuse_request',
                priority: EventPriority.P2
              });
            }

            // 3. 处理柜门状态逻辑 (CH2 - CABINET_DOOR_INDEX)
            if (context.aggregator.hasIndexChanged(config.CABINET_DOOR_INDEX, combinedUpdate)) {
              const isDoorOpen = combinedUpdate.combinedState[config.CABINET_DOOR_INDEX]; // true = high = 开门
              log.info(`[逻辑] CH2 (柜门) 已变化. 开门: ${isDoorOpen}`);
              enqueue.sendParent({
                type: 'cabinet_lock_changed',
                priority: EventPriority.P2,
                isClosed: !isDoorOpen  // 反转：true = 关门, false = 开门
              });
            }

            // 4. 处理报警取消按钮逻辑 (ALARM_STATUS_INDEX)
            // 硬件假设：ALARM_STATUS_INDEX 是一个 toggle 按钮，硬件层已提供防抖
            // 如果硬件没有防抖，机械开关抖动会产生多次边沿变化（0→1→0→1）
            // 软件层会检测到每次变化并触发事件，这是符合预期的
            if (context.aggregator.hasIndexChanged(config.ALARM_STATUS_INDEX, combinedUpdate)) {
              log.info(`[逻辑] ALARM_STATUS_INDEX (CH${config.ALARM_STATUS_INDEX + 1}) 已变化`);
              enqueue.sendParent({
                type: 'alarm_cancel_toggled',
                priority: EventPriority.P2
              });
            }

            if (combinedUpdate.changeDescriptions.length > 0) {
              log.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
            }
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
        START: 'waiting',
        TICK: 'polling'
      }
    },
    waiting: {
      on: {
        STOP: 'idle',
        TICK: 'polling'
      }
    },
    polling: {
      invoke: {
        src: 'queryRelayStatus',
        input: ({ context }) => ({ hardware: context.hardware }),
        onDone: 'waiting',
        onError: 'error'
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
