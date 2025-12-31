import { setup, createActor } from 'xstate';

const RETRY_DELAY = 5000; // 5 seconds

const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'STOP' }
  },
  actions: {
    increment: ({ context }) => {
      context.count++;
      console.log(`[${new Date().toISOString()}] Action executed! Count: ${context.count}`);
    }
  }
}).createMachine({
  id: 'test',
  initial: 'looping',
  context: {
    count: 0
  },
  states: {
    looping: {
      after: {
        [RETRY_DELAY]: {
          target: 'looping',
          actions: 'increment'
        }
      },
      on: {
        STOP: 'done'
      }
    },
    done: {
      entry: ({ context }) => {
        console.log(`Final count: ${context.count}`);
      }
    }
  }
});

console.log('Starting test...');
console.log(`Expected: Action should execute every ${RETRY_DELAY}ms`);
console.log(`Will run for 20 seconds...\n`);

const actor = createActor(machine);
actor.start();

// Stop after 20 seconds
setTimeout(() => {
  console.log('\nStopping actor...');
  actor.send({ type: 'STOP' });
  process.exit(0);
}, 20000);
