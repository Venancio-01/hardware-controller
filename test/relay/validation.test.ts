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

  describe("Delay Validation", () => {
    it("should accept valid delay", () => {
      expect(RelaySchemas.Delay.parse(1)).toBe(1);
      expect(RelaySchemas.Delay.parse(99)).toBe(99);
    });

    it("should reject invalid delay", () => {
      expect(() => RelaySchemas.Delay.parse(0)).toThrow();
      expect(() => RelaySchemas.Delay.parse(100)).toThrow();
      expect(() => RelaySchemas.Delay.parse(1.5)).toThrow();
    });
  });

  describe("Status Response Validation", () => {
    it("should parse valid status response", () => {
      const valid = "dostatus11000000";
      const result = RelaySchemas.StatusResponse.parse(valid);
      expect(result.raw).toBe(valid);
      expect(result.channels).toEqual([true, true, false, false, false, false, false, false]);
    });

    it("should reject invalid prefix", () => {
      expect(() => RelaySchemas.StatusResponse.parse("invalid11000000")).toThrow();
    });

    it("should reject invalid bits", () => {
      expect(() => RelaySchemas.StatusResponse.parse("dostatus11002000")).toThrow();
    });

    it("should reject too short payload", () => {
      expect(() => RelaySchemas.StatusResponse.parse("dostatus11")).toThrow();
    });
  });
});
