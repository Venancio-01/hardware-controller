import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/app.ts',
    'src/relay/index.ts',
    'src/business-logic/index.ts',
    'src/config/index.ts',
    'src/logger/index.ts',
    'src/hardware/index.ts',
    'src/voice-broadcast/index.ts',
    'src/state-machines/index.ts',
    'src/tcp/index.ts',
    'src/udp/index.ts',
    'src/types/index.ts',
  ],
  format: ['esm'], // 只构建 ESM 格式 to support import.meta
  dts: false, // 先禁用，我们手动处理类型声明
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'node22',
  external: ['xstate', 'pino', 'pino-pretty', 'iconv-lite', 'dotenv', 'zod'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
