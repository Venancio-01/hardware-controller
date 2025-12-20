import { describe, it, expect, mock, beforeEach } from "bun:test";
import { VoiceBroadcastController } from "../../src/voice-broadcast/index";
import { HardwareCommunicationManager } from "../../src/hardware/manager";
import iconv from 'iconv-lite';

describe("VoiceBroadcastController", () => {
  let mockHardwareManager: any;

  beforeEach(() => {
    // Reset instance before each test
    VoiceBroadcastController.destroy();
    
    // Create a mock HardwareCommunicationManager
    mockHardwareManager = {
      sendCommand: mock(() => Promise.resolve({
        'voice-broadcast': { success: true, data: "OK", timestamp: Date.now() }
      })),
      log: { info: mock(), error: mock(), warn: mock(), debug: mock() }
    };
  });

  it("should initialize as a singleton", () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { host: '127.0.0.1', port: 50000 });
    const instance1 = VoiceBroadcastController.getInstance();
    const instance2 = VoiceBroadcastController.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should broadcast simple text", async () => {
    VoiceBroadcastController.initialize(mockHardwareManager as any, { host: '127.0.0.1', port: 50000 });
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

  it("should handle broadcast options (volume, speed, voice)", async () => {
      VoiceBroadcastController.initialize(mockHardwareManager as any, { host: '127.0.0.1', port: 50000 });
      const controller = VoiceBroadcastController.getInstance();
      
      await controller.broadcast("测试", { volume: 5, speed: 8, voice: 3 });
      
      const encodedCommand = mockHardwareManager.sendCommand.mock.calls[0][1];
      const decoded = iconv.decode(encodedCommand, 'gb2312');
      
      expect(decoded).toContain('#[v5][s8][m3]测试');
  });

  it("should handle repeat option", async () => {
      VoiceBroadcastController.initialize(mockHardwareManager as any, { host: '127.0.0.1', port: 50000 });
      const controller = VoiceBroadcastController.getInstance();
      
      await controller.broadcast("测试", { repeat: 3 });
      
      const encodedCommand = mockHardwareManager.sendCommand.mock.calls[0][1];
      const decoded = iconv.decode(encodedCommand, 'gb2312');
      expect(decoded.startsWith('###测试')).toBe(true);
  });
});
