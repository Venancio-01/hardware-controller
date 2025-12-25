import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const authConfigSchema = z.object({
  AUTH_ENABLED: z.string().transform(v => v === 'true').optional().default('false'),
  AUTH_USERNAME: z.string().default('admin'),
  AUTH_PASSWORD: z.string().default('admin123'), // 生产环境应覆盖此默认值
  AUTH_SECRET: z.string().default('default-dev-secret-key'),
  AUTH_TOKEN_EXPIRY: z.string().default('24h')
});

const envConfig = authConfigSchema.parse(process.env);

export const authConfig = {
  enabled: envConfig.AUTH_ENABLED,
  username: envConfig.AUTH_USERNAME,
  password: envConfig.AUTH_PASSWORD,
  jwtSecret: envConfig.AUTH_SECRET,
  tokenExpiry: envConfig.AUTH_TOKEN_EXPIRY
};
