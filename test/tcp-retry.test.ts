import { TCPClient } from "../src/tcp/client";
import * as net from "node:net";

// Mock node:net
vi.mock("node:net", () => ({
  connect: vi.fn()
}));

describe("TCPClient Retry Logic", () => {
  const config = { host: '127.0.0.1', port: 8888, timeout: 100, retries: 3, reconnectDelay: 10 };

  it("should retry connection on failure", async () => {
    const { connect } = await import("node:net");
    const mockConnect = connect as any;
    
    // Simulate 2 failures then 1 success
    let callCount = 0;
    mockConnect.mockImplementation(() => {
        callCount++;
        const socket = new (require("events").EventEmitter)();
        (socket as any).setTimeout = vi.fn();
        (socket as any).destroy = vi.fn();
        (socket as any).setKeepAlive = vi.fn();
        (socket as any).setNoDelay = vi.fn();
        
        process.nextTick(() => {
            if (callCount <= 2) {
                socket.emit('error', new Error('Connection refused'));
            } else {
                socket.emit('connect');
            }
        });
        return socket;
    });

    const client = new TCPClient(config);
    try {
        await client.connect();
    } catch (e) {
        // Expected initial failure
    }
    
    // Wait for retries
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(callCount).toBe(3);
  });
});