import { UDPClient } from "../src/udp/client";

const mockSend = vi.fn();

// Mock node:dgram
vi.mock("node:dgram", () => ({
  createSocket: vi.fn((type: string) => {
      const socket = new (require("events").EventEmitter)();
      Object.assign(socket, {
          bind: vi.fn(function(port: number) {
              process.nextTick(() => socket.emit('listening'));
          }),
          send: mockSend,
          address: vi.fn(() => ({ address: '127.0.0.1', port: 1234 })),
          close: vi.fn((cb: any) => process.nextTick(cb))
      });
      return socket;
  })
}));

describe("UDPClient Retry Logic", () => {
  it("should retry send on failure", async () => {
    let sendCalls = 0;
    mockSend.mockImplementation((msg: any, port: any, host: any, cb: any) => {
        sendCalls++;
        if (sendCalls <= 2) {
            cb(new Error("Send failed"));
        } else {
            cb(null);
        }
    });

    const client = new UDPClient({ retries: 3 });
    await client.start(8000);
    
    await client.send(Buffer.from("test"), "127.0.0.1", 8000);
    
    expect(sendCalls).toBe(3);
  });
});
