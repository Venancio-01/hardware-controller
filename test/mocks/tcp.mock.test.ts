import { MockTCPSocket } from "./tcp.mock";
import { describe, it, expect } from 'vitest';

describe("MockTCPSocket", () => {
  it("should simulate connection", () => new Promise<void>(done => {
    const socket = new MockTCPSocket();
    socket.on("connect", () => {
        // success
        done();
    });
    socket.simulateConnect();
  }));

  it("should write data and capture it", () => new Promise<void>(done => {
    const socket = new MockTCPSocket();
    socket.write("hello", () => {
        expect(socket.sentData.length).toBe(1);
        expect(socket.sentData[0].toString()).toBe("hello");
        done();
    });
  }));

  it("should simulate incoming data", () => new Promise<void>(done => {
    const socket = new MockTCPSocket();
    socket.on("data", (data) => {
        expect(data.toString()).toBe("incoming");
        done();
    });
    socket.simulateData(Buffer.from("incoming"));
  }));

  it("should destroy and emit close", () => new Promise<void>(done => {
      const socket = new MockTCPSocket();
      socket.on("close", () => {
          expect(socket.destroyed).toBe(true);
          done();
      });
      socket.destroy();
  }));
});