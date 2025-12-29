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
  | { type: 'FINISHED' }
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
    // 点亮申请灯
    applyLightOn: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过点亮申请灯');
        return;
      }

      // 配置索引是 0-based (0-7)，继电器通道是 1-based (1-8)，需要 +1 转换
      const command = RelayCommandBuilder.close((config.APPLY_LIGHT_INDEX + 1) as RelayChannel);
      // context.logger.info('正在点亮申请灯...', { command, clientId: 'cabinet' });

      context.manager.sendCommand('tcp', command, 'cabinet', false)
        .then(() => {
          context.logger.info('点亮申请灯指令发送成功');
        })
        .catch((err) => {
          context.logger.error('点亮申请灯指令发送失败', err as Error);
        });
    },
    // 熄灭申请灯
    applyLightOff: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过熄灭申请灯');
        return;
      }

      // 配置索引是 0-based (0-7)，继电器通道是 1-based (1-8)，需要 +1 转换
      const command = RelayCommandBuilder.open((config.APPLY_LIGHT_INDEX + 1) as RelayChannel);
      // context.logger.info('正在熄灭申请灯...', { command, clientId: 'cabinet' });

      context.manager.sendCommand('tcp', command, 'cabinet', false)
        .then(() => {
          context.logger.info('熄灭申请灯指令发送成功');
        })
        .catch((err) => {
          context.logger.error('熄灭申请灯指令发送失败', err as Error);
        });
    },
    broadcastApply: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过申请供弹播报');
        return;
      }

      context.logger.info('正在申请供弹...');
      void VoiceBroadcast.getInstance().cabinet.broadcast('已申请，请等待授权');
    },
    broadcastAuthorized: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过授权通过播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('授权通过，已开锁请打开柜门');
    },
    broadcastFinished: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过供弹完毕播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('供弹[=dan4]完毕');
    },
    broadcastCancelled: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过供弹结束播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('供弹[=dan4]结束');
    },
    broadcastRefused: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过授权未通过播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('授权未通过，请取消供弹[=dan4]');
    },
    broadcastDoorOpen: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过开门播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门，并复位按键');
    },
    broadcastDoorClosed: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过关门播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('供弹[=dan4]完毕');
    },
    broadcastDoorTimeout: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过柜门超时播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('柜门超时未关');
    },
    broadcastAlarmCancelled: ({ context }) => {
      if (!VoiceBroadcast.isInitialized()) {
        context.logger.warn('语音播报未初始化，跳过取消报警播报');
        return;
      }

      void VoiceBroadcast.getInstance().cabinet.broadcast('取消报警');
    },
    resetLock: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过闭锁操作');
        return;
      }

      // 配置索引是 0-based (0-7)，继电器通道是 1-based (1-8)，需要 +1 转换
      const command = RelayCommandBuilder.open((config.RELAY_LOCK_INDEX + 1) as RelayChannel);
      context.logger.info('正在发送闭锁指令...', { command, clientId: 'control' });

      context.manager.sendCommand('serial', command, 'control', false)
        .then(() => {
          context.logger.info('闭锁指令发送成功');
        })
        .catch((err) => {
          context.logger.error('闭锁指令发送失败', err as Error);
        });
    },
    alarmOn: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过报警指令');
        return;
      }

      context.logger.info('柜门超时未关，正在开启报警...');

      // 柜体端报警灯 和 控制端报警灯
      // 配置索引是 0-based，继电器通道是 1-based，使用 % 8 + 1 确保在 1-8 范围内
      const cabinetCommand8 = RelayCommandBuilder.close((config.RELAY_CABINET_ALARM_INDEX % 8 + 1) as RelayChannel);
      const controlCommand1 = RelayCommandBuilder.close((config.RELAY_CONTROL_ALARM_INDEX + 1) as RelayChannel);

      void context.manager.sendCommand('serial', cabinetCommand8, 'cabinet', false);
      void context.manager.sendCommand('serial', controlCommand1, 'control', false);
    },
    alarmOff: ({ context }) => {
      if (!context.manager) {
        context.logger.warn('硬件管理器未提供，跳过停止报警指令');
        return;
      }

      context.logger.info('正在停止报警...');

      // 柜体端报警灯 和 控制端报警灯
      // 配置索引是 0-based，继电器通道是 1-based，使用 % 8 + 1 确保在 1-8 范围内
      const cabinetCommand8 = RelayCommandBuilder.open((config.RELAY_CABINET_ALARM_INDEX % 8 + 1) as RelayChannel);
      const controlCommand1 = RelayCommandBuilder.open((config.RELAY_CONTROL_ALARM_INDEX + 1) as RelayChannel);

      void context.manager.sendCommand('serial', cabinetCommand8, 'cabinet', false);
      void context.manager.sendCommand('serial', controlCommand1, 'control', false);
    }
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
        APPLY: { target: 'applying', actions: ['applyLightOn', 'broadcastApply'] },
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastFinished', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    applying: {
      on: {
        AUTHORIZED: { target: 'authorized', actions: 'broadcastAuthorized' },
        REFUSE: { target: 'refused', actions: 'broadcastRefused' },
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    authorized: {
      on: {
        DOOR_OPEN: { target: 'door_open', actions: 'broadcastDoorOpen' },
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    door_open: {
      after: {
        [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
      },
      on: {
        DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    door_open_timeout: {
      entry: 'alarmOn',
      exit: 'alarmOff',
      on: {
        DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
        ALARM_CANCEL: {
          target: 'door_open_alarm_cancelled',
          actions: 'broadcastAlarmCancelled'
          // exit 钩子会自动执行 alarmOff，无需在 actions 中重复
        }
      }
    },
    door_open_alarm_cancelled: {
      // 报警已取消，等待柜门关闭或再次超时
      // 如果柜门已关闭，DOOR_CLOSE 事件会将状态转换到 door_closed
      // 如果超时，会再次进入 door_open_timeout 状态
      after: {
        [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
      },
      on: {
        DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    },
    door_closed: {
      // 自复位按钮适配：柜门关闭后自动进入结束状态，不再等待 FINISHED 事件
      always: {
        target: 'idle',
        actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })]
      }
    },
    refused: {
      on: {
        FINISHED: { target: 'idle', actions: ['applyLightOff', 'broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
      }
    }
  }
});

export function createApplyAmmoActor(logger: StructuredLogger, manager?: HardwareCommunicationManager) {
  return createActor(applyAmmoMachine, { input: { logger, manager } });
}
