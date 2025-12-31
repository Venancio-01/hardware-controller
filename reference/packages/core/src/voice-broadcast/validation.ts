import { z } from 'zod';

const BroadcastOptionsSchema = z.object({
  volume: z.number().int().min(0).max(10).optional(),
  speed: z.number().int().min(0).max(10).optional(),
  voice: z.union([z.literal(3), z.literal(51)]).optional(),
  sound: z.string().optional(),
  repeat: z.number().int().min(1).optional()
});

export const VoiceSchemas = {
  BroadcastOptions: BroadcastOptionsSchema
};
