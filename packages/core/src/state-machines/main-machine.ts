import { setup, createActor, sendTo } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from 'shared';
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
  // 注意：报警事件在各个状态中分别处理
  // idle 和 normal 状态会切换到 alarm 状态
  // alarm 状态会转发给已有的 alarm actor
  states: {
    idle: {
      on: {
        apply_request: {
          target: 'normal',
          actions: ({ context }) => context.logger.info('[MainMachine] 在空闲状态收到 apply_request，正在切换到 normal 状态')
        },
        key_detected: 'alarm',
        vibration_detected: 'alarm',
        monitor_anomaly: 'alarm'
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
        },
        alarm_cancel_toggled: {
          actions: sendTo('applyAmmo', { type: 'ALARM_CANCEL' })
        },
        key_detected: 'alarm',
        vibration_detected: 'alarm',
        monitor_anomaly: 'alarm'
      }
    },
    alarm: {
      invoke: {
        src: 'alarm',
        id: 'alarm',
        input: ({ context, event }) => ({
          hardware: context.hardware,
          logger: context.logger,
          trigger: event.type === 'monitor_anomaly' ? 'MONITOR_DETECTED'
            : event.type === 'vibration_detected' ? 'VIBRATION_DETECTED'
              : event.type === 'key_detected' ? 'KEY_DETECTED'
                : undefined,
          monitorReason: event.type === 'monitor_anomaly' ? (event as any).reason : undefined
        })
      },
      on: {
        alarm_cancelled: 'idle',
        alarm_cancel_toggled: {
          actions: sendTo('alarm', { type: 'ALARM_CANCEL' })
        },
        key_reset: {
          actions: sendTo('alarm', { type: 'KEY_RESET' })
        },
        key_detected: {
          actions: sendTo('alarm', { type: 'KEY_DETECTED' })
        },
        vibration_detected: {
          actions: sendTo('alarm', { type: 'VIBRATION_DETECTED' })
        },
        monitor_anomaly: {
          actions: sendTo('alarm', ({ event }) => ({
            type: 'MONITOR_DETECTED',
            reason: (event as any).reason
          }))
        },
        monitor_recover: {
          actions: sendTo('alarm', { type: 'RECOVER' })
        }
      }
    },
    error: {}
  }
});

export function createMainActor(hardware: HardwareCommunicationManager, logger: StructuredLogger) {
  return createActor(mainMachine, { input: { hardware, logger } });
}
