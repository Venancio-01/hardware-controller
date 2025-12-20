import { type StructuredLogger } from '../logger/index.js';
import { createApplyAmmoActor } from '../state-machines/apply-ammo-machine.js';

const CABINET1_INDEX = 0;
const CONTROL4_INDEX = 10;

export class ApplyAmmoFlow {
  private actor: ReturnType<typeof createApplyAmmoActor>;

  constructor(logger: StructuredLogger) {
    this.actor = createApplyAmmoActor(logger);
  }

  start(): void {
    this.actor.start();
  }

  stop(): void {
    this.actor.stop();
  }

  handleCombinedChange(previousCombined: boolean[] | null, currentCombined: boolean[]) {
    if (!previousCombined || previousCombined.length <= CONTROL4_INDEX || currentCombined.length <= CONTROL4_INDEX) {
      return;
    }

    const cabinet1Prev = previousCombined[CABINET1_INDEX];
    const cabinet1Current = currentCombined[CABINET1_INDEX];
    const control4Prev = previousCombined[CONTROL4_INDEX];
    const control4Current = currentCombined[CONTROL4_INDEX];

    if (cabinet1Current && !cabinet1Prev) {
      this.actor.send({ type: 'APPLY' });
      return;
    }

    if (!cabinet1Current && cabinet1Prev) {
      this.actor.send({ type: 'FINISHED' });
      return;
    }

    if (cabinet1Current && cabinet1Prev && control4Prev !== control4Current) {
      this.actor.send({ type: 'AUTHORIZED' });
    }
  }
}
