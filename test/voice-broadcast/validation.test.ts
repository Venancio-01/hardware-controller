import { VoiceSchemas } from "../../src/voice-broadcast/validation";

describe("Voice Broadcast Validation", () => {
  describe("Options Validation", () => {
    it("should accept valid options", () => {
      const options = {
        volume: 5,
        speed: 5,
        voice: 3,
        repeat: 1
      } as const;
      expect(VoiceSchemas.BroadcastOptions.parse(options)).toEqual(options);
    });

    it("should accept partial options", () => {
        const options = { volume: 5 };
        expect(VoiceSchemas.BroadcastOptions.parse(options)).toEqual(options);
    });

    it("should reject invalid volume", () => {
      expect(() => VoiceSchemas.BroadcastOptions.parse({ volume: -1 })).toThrow();
      expect(() => VoiceSchemas.BroadcastOptions.parse({ volume: 11 })).toThrow();
    });

    it("should reject invalid speed", () => {
      expect(() => VoiceSchemas.BroadcastOptions.parse({ speed: -1 })).toThrow();
      expect(() => VoiceSchemas.BroadcastOptions.parse({ speed: 11 })).toThrow();
    });

    it("should reject invalid voice", () => {
      expect(() => VoiceSchemas.BroadcastOptions.parse({ voice: 1 })).toThrow();
      expect(VoiceSchemas.BroadcastOptions.parse({ voice: 3 })).toEqual({ voice: 3 });
      expect(VoiceSchemas.BroadcastOptions.parse({ voice: 51 })).toEqual({ voice: 51 });
    });
  });
});
