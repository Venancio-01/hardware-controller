import { setup, createActor } from 'xstate';
import { VoiceBroadcastController } from '../voice-broadcast/index.js';
import { type StructuredLogger } from '../logger/index.js';

type ApplyAmmoEvent =
  | { type: 'APPLY' }
  | { type: 'AUTHORIZED' }
  | { type: 'FINISHED' };

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
        void voiceController.broadcast('供蛋完毕');
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
          AUTHORIZED: { target: 'idle', actions: 'broadcastAuthorized' },
          FINISHED: { target: 'idle', actions: 'broadcastFinished' }
        }
      }
    }
  });

  return createActor(machine);
}
