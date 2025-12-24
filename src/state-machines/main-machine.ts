import { setup, createActor } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from '../logger/index.js';
import { monitorMachine } from './monitor-machine.js';
import { alarmMachine } from './alarm-machine.js';
import { applyAmmoMachine } from './apply-ammo-machine.js';
import { SystemEvent } from '../types/state-machine.js';

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
  on: {
    key_detected: '.alarm',
    vibration_detected: '.alarm',
    monitor_anomaly: '.alarm'
  },
  states: {
    idle: {
      on: {
        apply_request: 'normal'
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
      on: {
        operation_complete: 'idle'
      }
    },
    alarm: {
      invoke: {
        src: 'alarm',
        id: 'alarm'
      },
      on: {
        alarm_cancelled: 'idle'
      }
    },
    error: {}
  }
});

export function createMainActor(hardware: HardwareCommunicationManager, logger: StructuredLogger) {
  return createActor(mainMachine, { input: { hardware, logger } });
}