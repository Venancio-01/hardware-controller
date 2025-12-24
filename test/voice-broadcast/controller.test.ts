import { VoiceBroadcastController } from "../../src/voice-broadcast/index.js";
import iconv from 'iconv-lite';

describe("VoiceBroadcastController", () => {
  let mockHardwareManager: any;

  beforeEach(() => {
    // Reset instance before each test
    VoiceBroadcastController.destroy();
    
    // Create a mock HardwareCommunicationManager
    mockHardwareManager = {
      sendCommand: vi.fn((protocol, data, params, clientId) => Promise.resolve({
        [clientId || 'voice-broadcast']: { success: true, data: "OK", timestamp: Date.now() }
      })),
      log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
    };
  });

  it("should initialize as a singleton", () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { 
      clients: [{ id: 'voice-broadcast', host: '127.0.0.1', port: 50000 }] 
    });
    const instance1 = VoiceBroadcastController.getInstance();
    const instance2 = VoiceBroadcastController.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should broadcast simple text", async () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { 
      clients: [{ id: 'voice-broadcast', host: '127.0.0.1', port: 50000 }],
      defaultClientId: 'voice-broadcast'
    });
    const controller = VoiceBroadcastController.getInstance();
    
    const result = await controller.broadcast("你好");
    
    expect(result).toBe(true);
    expect(mockHardwareManager.sendCommand).toHaveBeenCalled();
    
    const [protocol, encodedCommand, params, clientId] = mockHardwareManager.sendCommand.mock.calls[0];
    expect(protocol).toBe('tcp');
    expect(clientId).toBe('voice-broadcast');
    
    // Text "#你好" in GB2312
    const decoded = iconv.decode(encodedCommand, 'gb2312');
    expect(decoded).toBe('#你好');
  });

  it("should use client-specific default configuration", async () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { 
      clients: [
        { id: 'cabinet', host: '127.0.0.1', port: 50000, volume: 8, speed: 3 },
        { id: 'control', host: '127.0.0.2', port: 50000, volume: 6, speed: 7 }
      ],
      defaultClientId: 'cabinet'
    });
    const controller = VoiceBroadcastController.getInstance();

    // Test Cabinet Default
    await controller.broadcast("CabinetMsg", {}, 'cabinet');
    const cabinetCall = mockHardwareManager.sendCommand.mock.calls.find((call: any[]) => call[3] === 'cabinet');
    const cabinetDecoded = iconv.decode(cabinetCall[1], 'gb2312');
    // Expect defaults [v8][s3]
    expect(cabinetDecoded).toContain('[v8][s3]CabinetMsg');

    // Test Control Default
    await controller.broadcast("ControlMsg", {}, 'control');
    const controlCall = mockHardwareManager.sendCommand.mock.calls.find((call: any[]) => call[3] === 'control');
    const controlDecoded = iconv.decode(controlCall[1], 'gb2312');
    // Expect defaults [v6][s7]
    expect(controlDecoded).toContain('[v6][s7]ControlMsg');
  });

  it("should allow overriding defaults per broadcast", async () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { 
      clients: [
        { id: 'cabinet', host: '127.0.0.1', port: 50000, volume: 8, speed: 3 }
      ],
      defaultClientId: 'cabinet'
    });
    const controller = VoiceBroadcastController.getInstance();

    // Override volume to 2, speed to 9
    await controller.broadcast("OverrideMsg", { volume: 2, speed: 9 }, 'cabinet');
    
    const call = mockHardwareManager.sendCommand.mock.calls[0];
    const decoded = iconv.decode(call[1], 'gb2312');
    
    // Expect overrides [v2][s9]
    expect(decoded).toContain('[v2][s9]OverrideMsg');
    // Should NOT contain defaults
    expect(decoded).not.toContain('[v8]');
    expect(decoded).not.toContain('[s3]');
  });

  it("should merge partial overrides with defaults", async () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { 
      clients: [
        { id: 'cabinet', host: '127.0.0.1', port: 50000, volume: 8, speed: 3 }
      ],
      defaultClientId: 'cabinet'
    });
    const controller = VoiceBroadcastController.getInstance();

    // Override only volume
    await controller.broadcast("PartialMsg", { volume: 5 }, 'cabinet');
    
    const call = mockHardwareManager.sendCommand.mock.calls[0];
    const decoded = iconv.decode(call[1], 'gb2312');
    
    // Expect volume 5 (override) and speed 3 (default)
    expect(decoded).toContain('[v5][s3]PartialMsg');
  });
});