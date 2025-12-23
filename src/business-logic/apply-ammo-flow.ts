import { type StructuredLogger } from '../logger/index.js';
import { createApplyAmmoActor } from '../state-machines/apply-ammo-machine.js';
import { type HardwareCommunicationManager } from '../hardware/manager.js';

// ============================================
// 供弹申请流程索引常量定义
// ============================================
// 索引 0: 供弹申请 - 触发申请/完成流程
export const APPLY_INDEX = 0;
// 索引 1: 柜门状态
export const CABINET_DOOR_INDEX = 1;
// 索引 2: 电锁状态（in）
export const ELECTRIC_LOCK_IN_INDEX = 2;
// 索引 3: 机械锁状态
export const MECHANICAL_LOCK_INDEX = 3;
// 索引 4: 震动报警
export const VIBRATION_ALARM_INDEX = 4;
// 索引 5: 开关06
export const SWITCH_06_INDEX = 5;
// 索引 6: 设备状态
export const DEVICE_STATUS_INDEX = 6;
// 索引 7: 报警灯（柜体端）
export const CABINET_ALARM_LIGHT_INDEX = 7;
// 索引 8: 报警灯（控制端）
export const CONTROL_ALARM_LIGHT_INDEX = 8;
// 索引 9: 电锁状态（out）- 状态变化触发授权
export const ELECTRIC_LOCK_OUT_INDEX = 9;
// 索引 10: 报警状态
export const ALARM_STATUS_INDEX = 10;
// 索引 11: 授权标识
export const AUTH_INDEX = 11;
// 索引 12: 授权取消标识 - 状态变化触发拒绝
export const AUTH_CANCEL_INDEX = 12;
// 索引 13: 开关26
export const SWITCH_26_INDEX = 13;
// 索引 14: 开关27
export const SWITCH_27_INDEX = 14;
// 索引 15: 开关28
export const SWITCH_28_INDEX = 15;

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