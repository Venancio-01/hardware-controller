import { z } from 'zod';

const ChannelSchema = z.union([
  z.number().int().min(1).max(8),
  z.literal('all')
]);

const DelaySchema = z.number().int().min(1).max(99);

const StatusResponseSchema = z.string()
  .refine((val) => val.startsWith('dostatus') || val.startsWith('distatus'), {
    message: "Must start with 'dostatus' or 'distatus'"
  })
  .refine((val) => {
      const payload = val.startsWith('dostatus') ? val.slice(8) : val.slice(8);
      return payload.length >= 4;
  }, { message: "Payload too short" })
  .refine((val) => {
      const payload = val.startsWith('dostatus') ? val.slice(8) : val.slice(8);
      return /^[01]+$/.test(payload);
  }, { message: "Payload must contain only 0 and 1" })
  .transform((val) => {
      const prefix = val.startsWith('dostatus') ? 'dostatus' : 'distatus';
      const payload = val.slice(prefix.length);
      return {
          raw: val,
          channels: payload.split('').map(bit => bit === '1')
      };
  });

export const RelaySchemas = {
  Channel: ChannelSchema,
  Delay: DelaySchema,
  StatusResponse: StatusResponseSchema
};
