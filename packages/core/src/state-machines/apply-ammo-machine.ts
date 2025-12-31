import { setup, createActor, sendParent } from 'xstate';
import { VoiceBroadcast } from '../voice-broadcast/index.js';
import { type StructuredLogger } from 'shared';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder, type RelayChannel } from '../relay/index.js';
import { config } from '../config/index.js';
import { EventPriority } from '../types/state-machine.js';

export type ApplyAmmoEvent =
  | { type: 'APPLY' }
  | { type: 'AUTHORIZED' }
  | { type: 'REFUSE' }
  | { type: 'DOOR_LOCK_OPEN' }
  | { type: 'DOOR_LOCK_CLOSE' }
  | { type: 'DOOR_OPEN' }
  | { type: 'DOOR_CLOSE' }
  | { type: 'ALARM_CANCEL' };



export const applyAmmoMachine = setup({
  types: {} as {
    events: ApplyAmmoEvent;
    input: { logger: StructuredLogger; manager?: HardwareCommunicationManager };
    context: { logger: StructuredLogger; manager?: HardwareCommunicationManager };
  },
  actions: {
    broadcastApply: ({ context }) => {
      const command = RelayCommandBuilder.close(config.APPLY_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('serial', command, 'control', false)

      void VoiceBroadcast.getInstance().cabinet.broadcast('已申请，请等待授权');
      void VoiceBroadcast.getInstance().control.broadcast('申请供弹[=dan4]请授权');
    },
    broadcastRetry: ({ context }) => {
    // 授权等待超时重试语音
      void VoiceBroadcast.getInstance().cabinet.broadcast('已申请，请等待授权');
      void VoiceBroadcast.getInstance().control.broadcast('申请供弹[=dan4]请授权');
    },
    broadcastAuthorized: ({ context }) => {
      const unlockCommand = RelayCommandBuilder.close(config.DOOR_LOCK_SWITCH_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', unlockCommand, 'cabinet', false);

      VoiceBroadcast.getInstance().control.broadcast('授权通过，已开锁');
      VoiceBroadcast.getInstance().cabinet.broadcast('授权通过，已开锁请打开柜门');
    },
    broadcastLockOpen: ({ context }) => {
      const command = RelayCommandBuilder.close(config.DOOR_LOCK_SWITCH_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('serial', command, 'control', false);
    },
    broadcastLockClose: ({ context }) => {
      const command = RelayCommandBuilder.open(config.DOOR_LOCK_SWITCH_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('serial', command, 'control', false);
    },
    broadcastFinished: ({ context }) => {
      // 停止报警
      const cabinetCommand8 = RelayCommandBuilder.open(config.RELAY_CABINET_ALARM_INDEX as RelayChannel);
      const controlCommand1 = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', cabinetCommand8, 'cabinet', false);
      context.manager?.queueCommand('serial', controlCommand1, 'control', false);

      // 熄灯
      const command1 = RelayCommandBuilder.open(config.APPLY_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('serial', command1, 'control', false);

      // 落锁
      const command2 = RelayCommandBuilder.open(config.DOOR_LOCK_SWITCH_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', command2, 'cabinet', false);

      VoiceBroadcast.getInstance().cabinet.broadcast('供弹[=dan4]完毕');
      VoiceBroadcast.getInstance().control.broadcast('供弹[=dan4]完毕');
    },

    broadcastRefused: ({ context }) => {
      // 熄灯
      const command1 = RelayCommandBuilder.open(config.APPLY_LIGHT_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', command1, 'cabinet', false);

      VoiceBroadcast.getInstance().cabinet.broadcast('授权未通过，供弹[=dan4]结束');
      VoiceBroadcast.getInstance().control.broadcast('授权未通过，供弹[=dan4]结束');
    },
    broadcastDoorOpen: ({ context }) => {
      VoiceBroadcast.getInstance().cabinet.broadcast('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门');
      VoiceBroadcast.getInstance().control.broadcast('柜门已打开');
    },

    broadcastDoorTimeout: ({ context }) => {
      context.logger.info('柜门超时未关');

      // 开启报警
      const cabinetCommand8 = RelayCommandBuilder.close(config.RELAY_CABINET_ALARM_INDEX as RelayChannel);
      const controlCommand1 = RelayCommandBuilder.close(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', cabinetCommand8, 'cabinet', false);
      context.manager?.queueCommand('serial', controlCommand1, 'control', false);

      VoiceBroadcast.getInstance().cabinet.broadcast('柜门超时未关');
      VoiceBroadcast.getInstance().control.broadcast('柜门超时未关');
    },
    broadcastAlarmCancelled: ({ context }) => {
      // 停止报警
      const cabinetCommand8 = RelayCommandBuilder.open(config.RELAY_CABINET_ALARM_INDEX as RelayChannel);
      const controlCommand1 = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.manager?.queueCommand('tcp', cabinetCommand8, 'cabinet', false);
      context.manager?.queueCommand('serial', controlCommand1, 'control', false);

      VoiceBroadcast.getInstance().cabinet.broadcast('取消报警');
      VoiceBroadcast.getInstance().control.broadcast('取消报警');
    },
    resetLock: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过闭锁操作');
        return;
      }

      // 配置索引和继电器通道都是 0-based (0-7)
      const command = RelayCommandBuilder.open(config.DOOR_LOCK_SWITCH_LIGHT_INDEX as RelayChannel);

      context.manager.sendCommand('serial', command, 'control', false)
    },

  }
}).createMachine({
  id: 'apply-ammo',
  initial: 'idle',
  context: ({ input }) => ({
    logger: input.logger,
    manager: input.manager
  }),
  states: {
    idle: {
      on: {
        APPLY: { target: 'applying', actions: 'broadcastApply' }
      }
    },
    applying: {
      // 授权等待超时重试：每隔 AUTH_RETRY_INTERVAL_S 秒循环播报重试语音
      after: {
        [config.AUTH_RETRY_INTERVAL_S * 1000]: {
          target: 'applying',
          actions: 'broadcastRetry',
          reenter: true
        }
      },
      on: {
        AUTHORIZED: { target: 'authorized', actions: 'broadcastAuthorized' },
        REFUSE: { target: 'idle', actions: ['broadcastRefused', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    authorized: {
      on: {
        DOOR_LOCK_OPEN: { target: 'lock_open', actions: 'broadcastLockOpen' },
        DOOR_OPEN: { target: 'door_open', actions: 'broadcastDoorOpen' }
      }
    },
    lock_open: {
      on: {
        DOOR_LOCK_CLOSE: {
          target: 'authorized',
          actions: 'broadcastLockClose'
        },
        DOOR_OPEN: { target: 'door_open', actions: 'broadcastDoorOpen' }
      }
    },
    door_open: {
      after: {
        [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
      },
      on: {
        DOOR_CLOSE: { target: 'door_closed' }
      }
    },
    door_open_timeout: {
      on: {
        DOOR_CLOSE: { target: 'door_closed' },
        ALARM_CANCEL: {
          target: 'door_open_alarm_cancelled',
          actions: 'broadcastAlarmCancelled'
        }
      }
    },
    door_open_alarm_cancelled: {
      after: {
        [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
      },
      on: {
        DOOR_CLOSE: { target: 'door_closed' }
      }
    },
    door_closed: {
      always: {
        target: 'idle',
        actions: ['broadcastFinished', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })]
      }
    }

  }
});

export function createApplyAmmoActor(logger: StructuredLogger, manager?: HardwareCommunicationManager) {
  return createActor(applyAmmoMachine, { input: { logger, manager } });
}
