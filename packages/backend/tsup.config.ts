import { defineConfig } from 'tsup';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: !process.env.NO_DTS,
  clean: true,
  outDir: 'dist',
  // 生产构建禁用 sourcemap 以保护源码
  sourcemap: !isProduction,
  splitting: false,
  shims: true,
  minify: isProduction,
  target: 'es2022',

  // 依赖打包策略：打包大部分纯 JS 依赖以减少 node_modules 体积
  // 排除原生模块和需要运行时灵活性的模块
  noExternal: [
    // Express 生态
    'express',
    'express-rate-limit',

    // 日志
    'pino',
    'pino-http',
    'pino-pretty',

    // 工具库
    'jsonwebtoken',
    'zod',
    'json5',
    'dotenv',
  ],

  // 不打包的模块（保留在 node_modules 中）
  external: [
    'serialport', // 原生二进制模块，必须保留
    'socket.io', // 保持运行时灵活性
    'shared', // workspace 依赖
  ],
});
