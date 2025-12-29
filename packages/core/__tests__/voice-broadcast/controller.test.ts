import { VoiceBroadcastController, VoiceBroadcast } from "../../src/voice-broadcast/index.js";
import iconv from 'iconv-lite';

describe("VoiceBroadcastController", () => {
  let mockHardwareManager: any;

  beforeEach(() => {
    // Reset instance before each test
    VoiceBroadcast.destroy();

    // Create a mock HardwareCommunicationManager
    mockHardwareManager = {
      sendCommand: vi.fn((protocol, data, clientId, waitResponse) => Promise.resolve({
        [clientId || 'voice-broadcast']: { success: true, data: "OK", timestamp: Date.now() }
      })),
      log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
    };
  });

  it("should initialize as a singleton", () => {
    VoiceBroadcast.initialize(mockHardwareManager as any, {
      clients: [{ id: 'voice-broadcast-cabinet', targetClientId: 'cabinet', protocol: 'tcp' }]
    });
    const instance1 = VoiceBroadcast.getInstance();
    const instance2 = VoiceBroadcast.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should broadcast simple text via cabinet accessor", async () => {
    VoiceBroadcast.initialize(mockHardwareManager as any, {
      clients: [{ id: 'voice-broadcast-cabinet', targetClientId: 'cabinet', protocol: 'tcp' as const }],
      defaultClientId: 'voice-broadcast-cabinet'
    });
    const instance = VoiceBroadcast.getInstance();

    const result = await instance.cabinet.broadcast("你好");

    expect(result).toBe(true);
    expect(mockHardwareManager.sendCommand).toHaveBeenCalled();

    const [protocol, encodedCommand, clientId, waitResponse] = mockHardwareManager.sendCommand.mock.calls[0];
    expect(protocol).toBe('tcp');
    expect(clientId).toBe('cabinet');

    // Text "#你好" in GB2312
    const decoded = iconv.decode(encodedCommand, 'gb2312');
    expect(decoded).toBe('#你好');
  });

  it("should use client-specific default configuration", async () => {
    VoiceBroadcast.initialize(mockHardwareManager as any, {
      clients: [
        { id: 'voice-broadcast-cabinet', targetClientId: 'cabinet', protocol: 'tcp' as const, volume: 8, speed: 3 },
        { id: 'voice-broadcast-control', targetClientId: 'control', protocol: 'serial' as const, volume: 6, speed: 7 }
      ],
      defaultClientId: 'voice-broadcast-cabinet'
    });
    const instance = VoiceBroadcast.getInstance();

    // Test Cabinet Default
    await instance.cabinet.broadcast("CabinetMsg");
    const cabinetCall = mockHardwareManager.sendCommand.mock.calls.find((call: any[]) => call[2] === 'cabinet');
    expect(cabinetCall).toBeDefined();
    const cabinetDecoded = iconv.decode(cabinetCall[1], 'gb2312');
    // Expect defaults [v8][s3]
    expect(cabinetDecoded).toContain('[v8][s3]CabinetMsg');

    // Test Control Default
    await instance.control.broadcast("ControlMsg");
    const controlCall = mockHardwareManager.sendCommand.mock.calls.find((call: any[]) => call[2] === 'control');
    expect(controlCall).toBeDefined();
    const controlDecoded = iconv.decode(controlCall[1], 'gb2312');
    // Expect defaults [v6][s7]
    expect(controlDecoded).toContain('[v6][s7]ControlMsg');
  });

  it("should allow overriding defaults per broadcast", async () => {
    VoiceBroadcast.initialize(mockHardwareManager as any, {
      clients: [
        { id: 'voice-broadcast-cabinet', targetClientId: 'cabinet', protocol: 'tcp' as const, volume: 8, speed: 3 }
      ],
      defaultClientId: 'voice-broadcast-cabinet'
    });
    const instance = VoiceBroadcast.getInstance();

    // Override volume to 2, speed to 9
    await instance.cabinet.broadcast("OverrideMsg", { volume: 2, speed: 9 });

    const call = mockHardwareManager.sendCommand.mock.calls[0];
    const decoded = iconv.decode(call[1], 'gb2312');

    // Expect overrides [v2][s9]
    expect(decoded).toContain('[v2][s9]OverrideMsg');
    // Should NOT contain defaults
    expect(decoded).not.toContain('[v8]');
    expect(decoded).not.toContain('[s3]');
  });

  it("should merge partial overrides with defaults", async () => {
    VoiceBroadcast.initialize(mockHardwareManager as any, {
      clients: [
        { id: 'voice-broadcast-cabinet', targetClientId: 'cabinet', protocol: 'tcp' as const, volume: 8, speed: 3 }
      ],
      defaultClientId: 'voice-broadcast-cabinet'
    });
    const instance = VoiceBroadcast.getInstance();

    // Override only volume
    await instance.cabinet.broadcast("PartialMsg", { volume: 5 });

    const call = mockHardwareManager.sendCommand.mock.calls[0];
    const decoded = iconv.decode(call[1], 'gb2312');

    // Expect volume 5 (override) and speed 3 (default)
    expect(decoded).toContain('[v5][s3]PartialMsg');
  });

  // Backward compatibility test
  it("should export VoiceBroadcastController as alias", () => {
    expect(VoiceBroadcastController).toBe(VoiceBroadcast);
  });
});
