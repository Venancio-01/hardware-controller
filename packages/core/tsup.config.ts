import { defineConfig } from 'tsup';

const isProduction = process.env.NODE_ENV === 'production';

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
  format: ['cjs'], // 构建 CJS 对接 bytenode
  dts: false, // 先禁用，我们手动处理类型声明
  clean: true,
  // 生产构建禁用 sourcemap 以保护源码
  sourcemap: !isProduction,
  splitting: false,
  shims: true,
  minify: isProduction,
  target: 'node22',
  external: ['xstate', 'pino', 'pino-pretty', 'iconv-lite', 'dotenv', 'zod'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
