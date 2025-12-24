import { setup, createActor } from 'xstate';

export type AlarmEvent = 
  | { type: 'ALARM_DETECTED' }
  | { type: 'ACKNOWLEDGE' }
  | { type: 'RESOLVE' };

export const alarmMachine = setup({
  types: {
    context: {},
    events: {} as AlarmEvent
  }
}).createMachine({
  id: 'alarm',
  initial: 'idle',
  states: {
    idle: {
      on: {
        ALARM_DETECTED: 'active'
      }
    },
    active: {
      on: {
        ACKNOWLEDGE: 'acknowledged',
        RESOLVE: 'idle'
      }
    },
    acknowledged: {
      on: {
        RESOLVE: 'idle'
      }
    }
  }
});

export function createAlarmActor() {
  return createActor(alarmMachine);
}
