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
    
    const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xA1, 0x42]);
    const commands = calls.map((c: any[]) => c[1]);
    commands.forEach((command: Buffer) => {
      expect(Buffer.isBuffer(command)).toBe(true);
      expect(command.equals(expected)).toBe(true);
    });
  });
});
