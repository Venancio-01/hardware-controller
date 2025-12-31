import { MockUDPSocket } from "./udp.mock";
import { describe, it, expect } from 'vitest';

describe("MockUDPSocket", () => {
  it("should bind and emit listening", () => new Promise<void>(done => {
    const socket = new MockUDPSocket();
    socket.on("listening", () => {
      expect(socket.address().port).toBe(1234);
      done();
    });
    socket.bind(1234);
  }));

  it("should send message and capture it", () => new Promise<void>(done => {
    const socket = new MockUDPSocket();
    const msg = Buffer.from("hello");
    socket.send(msg, 1234, "localhost", (err, bytes) => {
      expect(err).toBeNull();
      expect(bytes).toBe(5);
      expect(socket.sentMessages.length).toBe(1);
      expect(socket.sentMessages[0].msg.toString()).toBe("hello");
      done();
    });
  }));

  it("should simulate incoming message", () => new Promise<void>(done => {
    const socket = new MockUDPSocket();
    const msg = Buffer.from("incoming");
    const rinfo = { address: "1.2.3.4", port: 5678, family: "IPv4", size: 8 };
    
    socket.on("message", (data, remote) => {
      expect(data.toString()).toBe("incoming");
      expect(remote.port).toBe(5678);
      done();
    });
    
    socket.simulateMessage(msg, rinfo);
  }));

  it("should close and emit close event", () => new Promise<void>(done => {
      const socket = new MockUDPSocket();
      socket.on("close", () => {
          expect(socket.isClosed).toBe(true);
          done();
      });
      socket.close();
  }));
});