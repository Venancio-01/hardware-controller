import { describe, it, expect } from "bun:test";
import { MockTCPSocket } from "./tcp.mock";

describe("MockTCPSocket", () => {
  it("should simulate connection", (done) => {
    const socket = new MockTCPSocket();
    socket.on("connect", () => {
        // success
        done();
    });
    socket.simulateConnect();
  });

  it("should write data and capture it", (done) => {
    const socket = new MockTCPSocket();
    socket.write("hello", () => {
        expect(socket.sentData.length).toBe(1);
        expect(socket.sentData[0].toString()).toBe("hello");
        done();
    });
  });

  it("should simulate incoming data", (done) => {
    const socket = new MockTCPSocket();
    socket.on("data", (data) => {
        expect(data.toString()).toBe("incoming");
        done();
    });
    socket.simulateData(Buffer.from("incoming"));
  });

  it("should destroy and emit close", (done) => {
      const socket = new MockTCPSocket();
      socket.on("close", () => {
          expect(socket.destroyed).toBe(true);
          done();
      });
      socket.destroy();
  });
});
