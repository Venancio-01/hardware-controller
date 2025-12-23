import { setup, createActor } from 'xstate';
import { VoiceBroadcastController } from '../voice-broadcast/index.js';
import { type StructuredLogger } from '../logger/index.js';

type ApplyAmmoEvent =
  | { type: 'APPLY' }
  | { type: 'AUTHORIZED' }
  | { type: 'REFUSE' }
  | { type: 'FINISHED' }
  | { type: 'DOOR_OPEN' }
  | { type: 'DOOR_CLOSE' };

export function createApplyAmmoActor(logger: StructuredLogger) {
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
        void voiceController.broadcast('已开门，请取弹，取弹后关闭柜门，并复位按键');
      },
      broadcastDoorClosed: () => {
        if (!VoiceBroadcastController.isInitialized()) {
          logger.warn('语音播报未初始化，跳过关门播报');
          return;
        }

        const voiceController = VoiceBroadcastController.getInstance();
        void voiceController.broadcast('柜门已关闭');
      },
      resetLock: () => {
        // Implementation will be added in Phase 2
        logger.info('执行闭锁操作 (Placeholder)');
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
        on: {
          DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
          FINISHED: { target: 'idle', actions: 'broadcastCancelled' }
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
