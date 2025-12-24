import { setup, createActor } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder } from '../relay/controller.js';

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
  actions: {
    queryRelayStatus: async ({ context }) => {
      const cmd = RelayCommandBuilder.queryRelayStatus();
      try {
        await Promise.all([
          context.hardware.sendCommand('udp', cmd, undefined, 'cabinet', false),
          context.hardware.sendCommand('udp', cmd, undefined, 'control', false)
        ]);
      } catch (error) {

      }
    }
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
        START: 'waiting'
      }
    },
    waiting: {
      on: {
        STOP: 'idle',
        TICK: 'polling'
      }
    },
    polling: {
      entry: 'queryRelayStatus',
      always: 'waiting'
    }
  }
});

export function createMonitorActor(hardware: HardwareCommunicationManager) {
  return createActor(monitorMachine, { input: { hardware } });
}