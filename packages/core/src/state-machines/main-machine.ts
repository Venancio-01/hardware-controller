import { setup, createActor, sendTo } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from 'shared';
import { monitorMachine } from './monitor-machine.js';
import { alarmMachine } from './alarm-machine.js';
import { applyAmmoMachine } from './apply-ammo-machine.js';
import { SystemEvent } from '../types/state-machine.js';
import { sendStatus } from '../ipc/status-reporter.js';

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
        monitor_anomaly: 'alarm',
        monitor_connection_update: {
          actions: ({ event }) => {
            // 保持当前状态 update，只发送 IPC 消息
            sendStatus('Running', undefined, (event as any).connections);
          }
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
            const e = event as SystemEvent & { isClosed: boolean };
            if (e.type === 'cabinet_lock_changed') {
              return e.isClosed ? { type: 'DOOR_CLOSE' } : { type: 'DOOR_OPEN' };
            }
            return { type: 'UNKNOWN' };
          })
        },
        door_lock_switch_changed: {
          actions: sendTo('applyAmmo', ({ event }) => {
            const e = event as SystemEvent & { isOpen: boolean };
            if (e.type === 'door_lock_switch_changed') {
              return e.isOpen ? { type: 'DOOR_LOCK_OPEN' } : { type: 'DOOR_LOCK_CLOSE' };
            }
            return { type: 'UNKNOWN' };
          })
        },
        alarm_cancel_toggled: {
          actions: sendTo('applyAmmo', { type: 'ALARM_CANCEL' })
        },
        //  normal 状态（申请供弹流程中）不响应钥匙和振动报警
        monitor_anomaly: 'alarm',
        monitor_connection_update: {
          actions: ({ event }) => {
            sendStatus('Running', undefined, (event as any).connections);
          }
        }
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
        },
        monitor_connection_update: {
          actions: ({ event }) => {
            // Alarm 状态下也更新连接状态
            // 注意：Alarm 状态下 CoreStatus 可能是 Running 也可能是 Error (如果 monitor_anomaly 导致)
            // 但这里我们简单发送 Running 或者保持不变?
            // sendStatus 需要 CoreStatus。
            // 暂时发送 'Running'，或者我们需要从某处获取当前状态?
            // 实际上 status-reporter 不存储当前状态，只发送。
            // 如果在 alarm 状态，通常意味着 Anomalous or Normal Alarm.
            // 发送 Running 是安全的，因为 status-reporter 只是向 backend 报告。
            sendStatus('Running', undefined, (event as any).connections);
          }
        }
      }
    },
    error: {}
  }
});

export function createMainActor(hardware: HardwareCommunicationManager, logger: StructuredLogger) {
  return createActor(mainMachine, { input: { hardware, logger } });
}
