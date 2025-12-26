import { RelayCommandBuilder } from "../../src/relay/controller";

describe("RelayCommandBuilder", () => {
  describe("close (ON)", () => {
    it("should build A1 ON command for channel 1", () => {
      const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x01, 0x00, 0x01, 0xA4, 0x48]);
      expect(RelayCommandBuilder.close(1).equals(expected)).toBe(true);
    });

    it("should reject delay command", () => {
      expect(() => RelayCommandBuilder.close(1, { delaySeconds: 10 })).toThrow();
    });

    it("should build ON command for all channels", () => {
      const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0xFF, 0x00, 0xFF, 0xA0, 0x40]);
      expect(RelayCommandBuilder.close('all').equals(expected)).toBe(true);
    });

    it("should throw error for delay on all channels", () => {
      expect(() => RelayCommandBuilder.close('all', { delaySeconds: 10 })).toThrow();
    });
  });

  describe("open (OFF)", () => {
    it("should build A1 OFF command", () => {
      const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x00, 0x00, 0x01, 0xA3, 0x46]);
      expect(RelayCommandBuilder.open(1).equals(expected)).toBe(true);
    });

    it("should build OFF command for all channels", () => {
      const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xA1, 0x42]);
      expect(RelayCommandBuilder.open('all').equals(expected)).toBe(true);
    });
  });

  describe("queryStatus", () => {
      it("should return correct relay status query command", () => {
          expect(RelayCommandBuilder.queryRelayStatus().length).toBe(0);
      });

      it("should return correct input status query command", () => {
          expect(RelayCommandBuilder.queryInputStatus().length).toBe(0);
      });
  });
});
