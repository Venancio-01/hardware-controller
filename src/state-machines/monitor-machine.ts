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
      log.info('MonitorMachine entry: setting up hardware subscription');
      context.hardware.onIncomingData = (protocol, clientId, data) => {
        log.debug(`Hardware data received: ${clientId} ${data.toString()}`);
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
        log.info(`Processing RELAY_DATA_RECEIVED from ${clientId}: ${rawStr}`);
        if (!rawStr.startsWith('dostatus')) return;

        try {
          const status = parseStatusResponse(rawStr, 'dostatus');
          const combinedUpdate = context.aggregator.update(clientId as RelayClientId, status);

          if (combinedUpdate && combinedUpdate.changed) {
            log.info(`Detected change in ${clientId}, total change count: ${combinedUpdate.changeDescriptions.length}`);
            // 1. 处理申请逻辑 (CH1)
            if (context.aggregator.hasIndexChanged(config.APPLY_INDEX, combinedUpdate)) {
              const isClosed = combinedUpdate.combinedState[config.APPLY_INDEX];
              log.info(`[Logic] CH1 (Apply) changed. Closed: ${isClosed}`);
              enqueue.sendParent({
                type: isClosed ? 'apply_request' : 'finish_request',
                priority: EventPriority.P2
              });
            }

            // 2. 处理授权逻辑 (CH13)
            if (context.aggregator.hasIndexChanged(config.AUTH_INDEX, combinedUpdate)) {
              const isClosed = combinedUpdate.combinedState[config.AUTH_INDEX];
              log.info(`[Logic] AUTH_INDEX changed. Closed: ${isClosed}`);
              enqueue.sendParent({
                type: isClosed ? 'authorize_request' : 'refuse_request',
                priority: EventPriority.P2
              });
            }

            // 3. 处理门锁逻辑 (CH2)
            if (context.aggregator.hasIndexChanged(config.ELECTRIC_LOCK_OUT_INDEX, combinedUpdate)) {
              const isClosed = combinedUpdate.combinedState[config.ELECTRIC_LOCK_OUT_INDEX];
              log.info(`[Logic] CH2 (Lock) changed. Closed: ${isClosed}`);
              enqueue.sendParent({
                type: 'cabinet_lock_changed',
                priority: EventPriority.P2,
                isClosed
              });
            }

            if (combinedUpdate.changeDescriptions.length > 0) {
              log.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
            }
          } else if (combinedUpdate) {
            log.info(`No semantic change detected for ${clientId}`);
          }
        } catch (err) {
          log.error('Failed to parse relay status in MonitorMachine', err as Error);
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
