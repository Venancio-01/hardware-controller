import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { TCPClient } from "../src/tcp/client";
import * as net from "node:net";

// Mock node:net
mock.module("node:net", () => ({
  connect: mock()
}));

describe("TCPClient Retry Logic", () => {
  const config = { host: '127.0.0.1', port: 8888, timeout: 100, retries: 3 };

  it("should retry connection on failure", async () => {
    const { connect } = await import("node:net");
    const mockConnect = connect as any;
    
    // Simulate 2 failures then 1 success
    let callCount = 0;
    mockConnect.mockImplementation(() => {
        callCount++;
        const socket = new (require("events").EventEmitter)();
        (socket as any).setTimeout = mock();
        (socket as any).destroy = mock();
        
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
    // Note: The current TCPClient doesn't have retry logic in connect().
    // We expect this to fail if we want it to retry.
    await client.connect();
    expect(callCount).toBe(3);
  });
});
