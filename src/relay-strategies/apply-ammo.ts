import { RelayStrategy, CombinedRelayState } from './index.js';
import { StructuredLogger } from '../logger/index.js';
import { VoiceBroadcastController } from '../voice-broadcast/index.js';

export class ApplyAmmoStrategy implements RelayStrategy {
  name = 'ApplyAmmoStrategy';

  match(state: CombinedRelayState): boolean {
    // Cabinet 1 (Index 0) is Closed (True)
    return state[0] === true;
  }

  async execute(
    state: CombinedRelayState, 
    logger: StructuredLogger, 
    previousState?: CombinedRelayState
  ): Promise<void> {
    const cabinet1Current = state[0];
    const control4Current = state[11]; // 8 + 3 = 11

    // Default previous state to all false if undefined
    const safePreviousState = previousState || new Array(16).fill(false);
    const cabinet1Prev = safePreviousState[0];
    const control4Prev = safePreviousState[11];

    try {
      const voiceController = VoiceBroadcastController.getInstance();

      // 1. Detect Rising Edge of Cabinet 1
      if (cabinet1Current && !cabinet1Prev) {
        logger.info('ApplyAmmoStrategy: Cabinet 1 Rising Edge -> Broadcasting Apply');
        await voiceController.broadcast('已申请，请等待授权');
        return; // Prioritize this event to avoid double talk if both happen (unlikely simultaneous but good practice)
      }

      // 2. Detect Change of Control 4 (while Cabinet 1 is High)
      // Note: match() ensures Cabinet 1 is High.
      // We only need to check if Control 4 changed.
      if (control4Current !== control4Prev) {
        logger.info(`ApplyAmmoStrategy: Control 4 Changed (${control4Prev} -> ${control4Current}) -> Broadcasting Authorized`);
        await voiceController.broadcast('授权通过，已开锁请打开柜门');
      }

    } catch (error) {
      logger.error('Error in ApplyAmmoStrategy execution', error as Error);
    }
  }
}
