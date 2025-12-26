import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    alias: {
      '@node-switch/core': './src/index.ts',
      '@node-switch/core/*': './src/*.ts',
    },
  },
});