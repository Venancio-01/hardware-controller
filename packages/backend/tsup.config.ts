import { defineConfig } from 'tsup';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  // 生产构建禁用 sourcemap 以保护源码
  sourcemap: !isProduction,
  splitting: false,
  shims: true,
  minify: isProduction,
  target: 'es2022',
});
