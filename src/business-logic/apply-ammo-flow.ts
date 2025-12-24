import { type StructuredLogger } from '../logger/index.js';
import { createApplyAmmoActor } from '../state-machines/apply-ammo-machine.js';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { config } from '../config/index.js';

export class ApplyAmmoFlow {
  private actor: ReturnType<typeof createApplyAmmoActor>;

  constructor(logger: StructuredLogger, manager?: HardwareCommunicationManager) {
    this.actor = createApplyAmmoActor(logger, manager);
  }

  start(): void {
    this.actor.start();
  }

  stop(): void {
    this.actor.stop();
  }

  handleCombinedChange(previousCombined: boolean[] | null, currentCombined: boolean[]) {
    const { 
      APPLY_INDEX, 
      ELECTRIC_LOCK_OUT_INDEX, 
      AUTH_CANCEL_INDEX, 
      CABINET_DOOR_INDEX 
    } = config;

    if (!previousCombined || previousCombined.length <= ELECTRIC_LOCK_OUT_INDEX || currentCombined.length <= ELECTRIC_LOCK_OUT_INDEX) {
      return;
    }

    const applyPrev = previousCombined[APPLY_INDEX];
    const applyCurrent = currentCombined[APPLY_INDEX];
    const electricLockOutPrev = previousCombined[ELECTRIC_LOCK_OUT_INDEX];
    const electricLockOutCurrent = currentCombined[ELECTRIC_LOCK_OUT_INDEX];
    const authCancelPrev = previousCombined[AUTH_CANCEL_INDEX];
    const authCancelCurrent = currentCombined[AUTH_CANCEL_INDEX];
    const doorPrev = previousCombined[CABINET_DOOR_INDEX];
    const doorCurrent = currentCombined[CABINET_DOOR_INDEX];

    if (applyCurrent && !applyPrev) {
      this.actor.send({ type: 'APPLY' });
      return;
    }

    if (!applyCurrent && applyPrev) {
      this.actor.send({ type: 'FINISHED' });
      return;
    }

    if (applyCurrent && applyPrev) {
      // 授权/拒绝逻辑
      if (electricLockOutPrev !== electricLockOutCurrent) {
        this.actor.send({ type: 'AUTHORIZED' });
      } else if (authCancelPrev !== authCancelCurrent) {
        this.actor.send({ type: 'REFUSE' });
      }

      // 柜门逻辑 (仅在 applyCurrent 为 true 时有效，且由状态机控制是否接受)
      if (!doorPrev && doorCurrent) {
        this.actor.send({ type: 'DOOR_OPEN' });
      } else if (doorPrev && !doorCurrent) {
        this.actor.send({ type: 'DOOR_CLOSE' });
      }
    }
  }
}
