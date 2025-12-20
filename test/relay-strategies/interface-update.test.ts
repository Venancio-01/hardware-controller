import { describe, it, expect, vi } from 'vitest';
import { RelayContext, RelayStrategy, CombinedRelayState } from '../../src/relay-strategies/index.js';
import { StructuredLogger } from '../../src/logger/index.js';

describe('RelayStrategy Interface Update', () => {
  it('should pass previousState to strategy.execute', async () => {
    const loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
    } as unknown as StructuredLogger;

    const executeMock = vi.fn();
    
    // Define a strategy that expects previousState
    const mockStrategy: RelayStrategy = {
      name: 'MockStrategy',
      match: () => true,
      // @ts-ignore: Intentionally expecting 3 arguments before interface update
      execute: executeMock
    };

    const context = new RelayContext(loggerMock);
    context.registerStrategy(mockStrategy);

    // First update - previous state should be undefined or initial empty state
    await context.updateState('cabinet', new Array(8).fill(false));
    
    // Second update - change state
    const newCabinetState = new Array(8).fill(false);
    newCabinetState[0] = true;
    await context.updateState('cabinet', newCabinetState);

    // Verify execute was called with previous state in the second call
    // The second call's arguments should include the previous state
    expect(executeMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    const secondCallArgs = executeMock.mock.calls[1];
    // arg0: currentState, arg1: logger, arg2: previousState (expected)
    expect(secondCallArgs[2]).toBeDefined();
    expect(secondCallArgs[2]).toBeInstanceOf(Array); // Should be array of booleans
  });
});
