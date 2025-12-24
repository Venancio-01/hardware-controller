import { setup, createActor } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { monitorMachine } from './monitor-machine.js';
import { alarmMachine } from './alarm-machine.js';
import { SystemEvent } from '../types/state-machine.js';

export const mainMachine = setup({
  types: {
    context: {} as { hardware: HardwareCommunicationManager },
    events: {} as SystemEvent,
    input: {} as { hardware: HardwareCommunicationManager }
  },
  actors: {
    monitor: monitorMachine,
    alarm: alarmMachine
  }
}).createMachine({
  id: 'main',
  context: ({ input }) => ({
    hardware: input.hardware
  }),
  initial: 'idle',
  invoke: {
    src: 'monitor',
    id: 'monitor',
    input: ({ context }) => ({ hardware: context.hardware })
  },
  states: {
    idle: {
      on: {
        apply_request: 'normal',
        key_detected: 'alarm',
        vibration_detected: 'alarm',
        monitor_anomaly: 'alarm'
      }
    },
    normal: {
      on: {
        operation_complete: 'idle',
        key_detected: 'alarm',
        vibration_detected: 'alarm',
        monitor_anomaly: 'alarm'
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

export function createMainActor(hardware: HardwareCommunicationManager) {
  return createActor(mainMachine, { input: { hardware } });
}