import { setup, createActor, sendTo } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { monitorMachine } from './monitor-machine.js';
import { alarmMachine } from './alarm-machine.js';
import { applyAmmoMachine } from './apply-ammo-machine.js';
import { SystemEvent } from '../types/state-machine.js';

export const mainMachine = setup({
  types: {
    context: {} as { hardware: HardwareCommunicationManager; logger: StructuredLogger },
    events: {} as SystemEvent,
    input: {} as { hardware: HardwareCommunicationManager; logger: StructuredLogger }
  },
  actors: {
    monitor: monitorMachine,
    alarm: alarmMachine,
    applyAmmo: applyAmmoMachine
  }
}).createMachine({
  id: 'main',
  context: ({ input }) => ({
    hardware: input.hardware,
    logger: input.logger
  }),
  initial: 'idle',
  invoke: {
    src: 'monitor',
    id: 'monitor',
    input: ({ context }) => ({ hardware: context.hardware })
  },
  on: {
    key_detected: '.alarm',
    vibration_detected: '.alarm',
    monitor_anomaly: '.alarm',
    monitor_tick: {
      actions: sendTo('monitor', { type: 'TICK' })
    }
  },
  states: {
    idle: {
      on: {
        apply_request: {
          target: 'normal',
          actions: ({ context }) => context.logger.info('[MainMachine] 在空闲状态收到 apply_request，正在切换到 normal 状态')
        }
      }
    },
    normal: {
      invoke: {
        src: 'applyAmmo',
        id: 'applyAmmo',
        input: ({ context }) => ({
          logger: context.logger,
          manager: context.hardware
        })
      },
      entry: [
        ({ context }) => context.logger.info('[MainMachine] 进入 normal 状态，触发 applyAmmo 的 APPLY 事件'),
        sendTo('applyAmmo', { type: 'APPLY' })
      ],
      on: {
        operation_complete: 'idle',
        apply_request: {
          actions: [
            ({ context }) => context.logger.info('[MainMachine] 在 normal 状态收到 apply_request，正在转发给 applyAmmo'),
            sendTo('applyAmmo', { type: 'APPLY' })
          ]
        },
        authorize_request: {
          actions: sendTo('applyAmmo', { type: 'AUTHORIZED' })
        },
        refuse_request: {
          actions: sendTo('applyAmmo', { type: 'REFUSE' })
        },
        finish_request: {
          actions: sendTo('applyAmmo', { type: 'FINISHED' })
        },
        cabinet_lock_changed: {
          actions: sendTo('applyAmmo', ({ event }) => {
            if (event.type === 'cabinet_lock_changed') {
              return event.isClosed ? { type: 'DOOR_CLOSE' } : { type: 'DOOR_OPEN' };
            }
            return { type: 'UNKNOWN' };
          })
        }
      }
    },
    alarm: {
      invoke: {
        src: 'alarm',
        id: 'alarm'
      },
      on: {
        alarm_cancelled: 'idle'
      }
    },
    error: {}
  }
});

export function createMainActor(hardware: HardwareCommunicationManager, logger: StructuredLogger) {
  return createActor(mainMachine, { input: { hardware, logger } });
}
