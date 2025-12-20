import { describe, it, expect } from "bun:test";
import { RelayCommandBuilder } from "../../src/relay/controller";

describe("RelayCommandBuilder", () => {
  describe("close (ON)", () => {
    it("should build simple ON command for channel 1", () => {
      expect(RelayCommandBuilder.close(1)).toBe("doon01");
    });

    it("should build ON command with delay", () => {
      expect(RelayCommandBuilder.close(1, { delaySeconds: 10 })).toBe("doon01t10");
    });

    it("should build ON command for all channels", () => {
        expect(RelayCommandBuilder.close('all')).toBe("doon99");
    });

    it("should throw error for delay on all channels", () => {
        expect(() => RelayCommandBuilder.close('all', { delaySeconds: 10 })).toThrow();
    });
  });

  describe("open (OFF)", () => {
    it("should build simple OFF command", () => {
      expect(RelayCommandBuilder.open(1)).toBe("dooff01");
    });

    it("should build OFF command for all channels", () => {
        expect(RelayCommandBuilder.open('all')).toBe("dooff99");
    });
  });

  describe("queryStatus", () => {
      it("should return correct relay status query command", () => {
          expect(RelayCommandBuilder.queryRelayStatus()).toBe("dostatus");
      });

      it("should return correct input status query command", () => {
          expect(RelayCommandBuilder.queryInputStatus()).toBe("distatus");
      });
  });
});
