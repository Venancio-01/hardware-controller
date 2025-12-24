import { setup, createActor, fromPromise, sendParent } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder } from '../relay/controller.js';
import { EventPriority } from '../types/state-machine.js';

type MonitorContext = {
  hardware: HardwareCommunicationManager;
};

type MonitorEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'TICK' };

export const monitorMachine = setup({
  types: {
    context: {} as MonitorContext,
    events: {} as MonitorEvent,
    input: {} as { hardware: HardwareCommunicationManager }
  },
  actors: {
    queryRelayStatus: fromPromise(async ({ input }: { input: { hardware: HardwareCommunicationManager } }) => {
      const cmd = RelayCommandBuilder.queryRelayStatus();
      await Promise.all([
        input.hardware.sendCommand('udp', cmd, undefined, 'cabinet', false),
        input.hardware.sendCommand('udp', cmd, undefined, 'control', false)
      ]);
    })
  }
}).createMachine({
  id: 'monitor',
  initial: 'idle',
  context: ({ input }) => ({
    hardware: input.hardware
  }),
  states: {
    idle: {
      on: {
        START: 'waiting',
        TICK: 'polling'
      }
    },
    waiting: {
      on: {
        STOP: 'idle',
        TICK: 'polling'
      }
    },
    polling: {
      invoke: {
        src: 'queryRelayStatus',
        input: ({ context }) => ({ hardware: context.hardware }),
        onDone: 'waiting',
        onError: 'error'
      }
    },
    error: {
      entry: sendParent(({ event }) => ({
        type: 'monitor_anomaly',
        priority: EventPriority.P1,
        data: (event as any).data
      })),
      always: 'waiting'
    }
  }
});

export function createMonitorActor(hardware: HardwareCommunicationManager) {
  return createActor(monitorMachine, { input: { hardware } });
}
