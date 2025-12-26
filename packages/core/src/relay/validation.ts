import { z } from 'zod';

const ChannelSchema = z.union([
  z.number().int().min(1).max(8),
  z.literal('all')
]);

const ActiveReportFrameSchema = z.instanceof(Buffer)
  .refine((frame) => frame.length === 9, {
    message: 'Active report frame must be exactly 9 bytes'
  })
  .refine((frame) => frame[0] === 0xEE && frame[1] === 0xFF, {
    message: 'Active report frame header mismatch'
  })
  .refine((frame) => frame[2] === 0xC0, {
    message: 'Active report frame function code mismatch'
  });

export const RelaySchemas = {
  Channel: ChannelSchema,
  ActiveReportFrame: ActiveReportFrameSchema
};
