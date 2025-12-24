import { resetAllRelays } from '../../src/relay/reset.js';

describe('Relay Reset', () => {
  let mockManager: any;
  let mockLogger: any;

  beforeEach(() => {
    mockManager = {
      sendCommand: vi.fn(() => Promise.resolve({}))
    };
    mockLogger = {
      info: vi.fn(() => {}),
      warn: vi.fn(() => {}),
      error: vi.fn(() => {})
    };
  });

  it('should send open all command to cabinet and control', async () => {
    await resetAllRelays(mockManager as any, mockLogger as any);
    
    expect(mockManager.sendCommand).toHaveBeenCalledTimes(2);
    const calls = mockManager.sendCommand.mock.calls;
    const targets = calls.map((c: any[]) => c[3]);
    expect(targets).toContain('cabinet');
    expect(targets).toContain('control');
    
    const commands = calls.map((c: any[]) => c[1]);
    expect(commands[0]).toBe('dooff99'); // RelayCommandBuilder.open('all') -> dooff99
  });
});
