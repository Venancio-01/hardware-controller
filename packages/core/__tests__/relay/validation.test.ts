import { RelaySchemas } from "../../src/relay/validation";

describe("Relay Protocol Validation", () => {
  describe("Channel Validation", () => {
    it("should accept valid channels", () => {
      expect(RelaySchemas.Channel.parse(1)).toBe(1);
      expect(RelaySchemas.Channel.parse(8)).toBe(8);
      expect(RelaySchemas.Channel.parse('all')).toBe('all');
    });

    it("should reject invalid channels", () => {
      expect(() => RelaySchemas.Channel.parse(0)).toThrow();
      expect(() => RelaySchemas.Channel.parse(9)).toThrow();
      expect(() => RelaySchemas.Channel.parse('invalid')).toThrow();
    });
  });

  describe("Active Report Validation", () => {
    it("should accept valid active report frame", () => {
      const frame = Buffer.from([0xEE, 0xFF, 0xC0, 0x01, 0x00, 0x11, 0x01, 0x00, 0xD3]);
      expect(RelaySchemas.ActiveReportFrame.parse(frame)).toBe(frame);
    });

    it("should reject invalid length", () => {
      const frame = Buffer.from([0xEE, 0xFF, 0xC0, 0x01, 0x00, 0x11, 0x01, 0x00]);
      expect(() => RelaySchemas.ActiveReportFrame.parse(frame)).toThrow();
    });

    it("should reject invalid header", () => {
      const frame = Buffer.from([0xEF, 0xFF, 0xC0, 0x01, 0x00, 0x11, 0x01, 0x00, 0xD3]);
      expect(() => RelaySchemas.ActiveReportFrame.parse(frame)).toThrow();
    });

    it("should reject invalid function code", () => {
      const frame = Buffer.from([0xEE, 0xFF, 0xCE, 0x01, 0x00, 0x11, 0x01, 0x00, 0xD3]);
      expect(() => RelaySchemas.ActiveReportFrame.parse(frame)).toThrow();
    });
  });
});
