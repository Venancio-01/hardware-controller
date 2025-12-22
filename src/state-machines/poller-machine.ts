import { setup, createActor } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { RelayCommandBuilder } from '../relay/controller.js';

type PollerContext = {
  hardware: HardwareCommunicationManager;
};

type PollerEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'TICK' };

export const pollerMachine = setup({
  types: {
    context: {} as PollerContext,
    events: {} as PollerEvent,
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
  id: 'poller',
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

export function createPollerActor(hardware: HardwareCommunicationManager) {
  return createActor(pollerMachine, { input: { hardware } });
}
