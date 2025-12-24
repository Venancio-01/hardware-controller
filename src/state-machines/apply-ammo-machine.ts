import { setup, createActor } from 'xstate';
import { VoiceBroadcastController } from '../voice-broadcast/index.js';
import { type StructuredLogger } from '../logger/index.js';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder, type RelayChannel } from '../relay/controller.js';
import { config } from '../config/index.js';

type ApplyAmmoEvent =
  | { type: 'APPLY' }
  | { type: 'AUTHORIZED' }
  | { type: 'REFUSE' }
  | { type: 'FINISHED' }
  | { type: 'DOOR_OPEN' }
  | { type: 'DOOR_CLOSE' };

export function createApplyAmmoActor(logger: StructuredLogger, manager?: HardwareCommunicationManager) {
  const machine = setup({
    types: {} as {
      events: ApplyAmmoEvent;
    },
    actions: {
      broadcastApply: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过申请供弹播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('已申请，请等待授权');
      },
      broadcastAuthorized: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过授权通过播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('授权通过，已开锁请打开柜门');
      },
      broadcastFinished: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过供弹完毕播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('供弹[=dan4]完毕');
      },
      broadcastCancelled: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过供弹结束播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('供弹[=dan4]结束');
      },
      broadcastRefused: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过授权未通过播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('授权未通过，请取消供弹[=dan4]');
      },
      broadcastDoorOpen: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过开门播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门，并复位按键');
      },
      broadcastDoorClosed: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过关门播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('柜门已关闭');
      },
      broadcastDoorTimeout: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过柜门超时播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('柜门超时未关');
      },
      resetLock: () => {
        if (!manager) {
          logger.warn('硬件管理器未提供，跳过闭锁操作');
          return;
        }

        const command = RelayCommandBuilder.open(config.RELAY_LOCK_INDEX as RelayChannel);
        logger.info('正在发送闭锁指令...', { command, clientId: 'control' });

        manager.sendCommand('udp', command, {}, 'control', false)
          .then(() => {
            logger.info('闭锁指令发送成功');
          })
          .catch((err) => {
            logger.error('闭锁指令发送失败', err as Error);
          });
      },
      alarmOn: () => {
        if (!manager) {
          logger.warn('硬件管理器未提供，跳过报警指令');
          return;
        }

        logger.info('柜门超时未关，正在开启报警...');

        // 柜体端报警灯 和 控制端报警灯
        const cabinetCommand8 = RelayCommandBuilder.close(config.RELAY_CABINET_ALARM_INDEX as RelayChannel);
        const controlCommand1 = RelayCommandBuilder.close(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);

        void manager.sendCommand('udp', cabinetCommand8, {}, 'cabinet', false);
        void manager.sendCommand('udp', controlCommand1, {}, 'control', false);
      },
      alarmOff: () => {
        if (!manager) {
          logger.warn('硬件管理器未提供，跳过停止报警指令');
          return;
        }

        logger.info('正在停止报警...');

        // 柜体端报警灯 和 控制端报警灯
        const cabinetCommand8 = RelayCommandBuilder.open(config.RELAY_CABINET_ALARM_INDEX as RelayChannel);
        const controlCommand1 = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);

        void manager.sendCommand('udp', cabinetCommand8, {}, 'cabinet', false);
        void manager.sendCommand('udp', controlCommand1, {}, 'control', false);
      }
    }
  }).createMachine({
    id: 'apply-ammo',
    initial: 'idle',
    states: {
      idle: {
        on: {
          APPLY: { target: 'applying', actions: 'broadcastApply' },
          FINISHED: { target: 'idle', actions: 'broadcastFinished' }
        }
      },
      applying: {
        on: {
          AUTHORIZED: { target: 'authorized', actions: 'broadcastAuthorized' },
          REFUSE: { target: 'refused', actions: 'broadcastRefused' },
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
        }
      },
      authorized: {
        on: {
          DOOR_OPEN: { target: 'door_open', actions: 'broadcastDoorOpen' },
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
        }
      },
      door_open: {
        after: {
          [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
        },
        on: {
          DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
        }
      },
      door_open_timeout: {
        entry: 'alarmOn',
        exit: 'alarmOff',
        on: {
          DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] }
        }
      },
      door_closed: {
        on: {
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
        }
      },
      refused: {
        on: {
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
        }
      }
    }
  });

  return createActor(machine);
}
