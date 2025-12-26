import { createAlarmActor } from '../../src/state-machines/alarm-machine.js';

describe('AlarmMachine', () => {
  it('should start in idle state', () => {
    const actor = createAlarmActor();
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to active when alarm is detected', () => {
    const actor = createAlarmActor();
    actor.start();
    actor.send({ type: 'ALARM_DETECTED' });
    expect(actor.getSnapshot().value).toBe('active');
  });

  it('should transition to acknowledged when acknowledged', () => {
    const actor = createAlarmActor();
    actor.start();
    actor.send({ type: 'ALARM_DETECTED' });
    expect(actor.getSnapshot().value).toBe('active');
    actor.send({ type: 'ACKNOWLEDGE' });
    expect(actor.getSnapshot().value).toBe('acknowledged');
  });

  it('should return to idle when resolved', () => {
    const actor = createAlarmActor();
    actor.start();
    actor.send({ type: 'ALARM_DETECTED' });
    actor.send({ type: 'ACKNOWLEDGE' });
    actor.send({ type: 'RESOLVE' });
    expect(actor.getSnapshot().value).toBe('idle');
  });
});
