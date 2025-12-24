import { EventPriority } from '../../src/types/state-machine.js';

describe('State Machine Types', () => {
  it('should have correct priorities defined', () => {
    expect(EventPriority.P0).toBe(0); // Critical
    expect(EventPriority.P1).toBe(1); // High
    expect(EventPriority.P2).toBe(2); // Normal
    expect(EventPriority.P3).toBe(3); // Low
  });
});
