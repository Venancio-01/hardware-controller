import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      TanStackRouterVite({
        routeFileIgnorePattern: '(__tests__|.*\\.test\\.tsx?)$',
      }),
      react(),
      tailwindcss(),
    ],
    build: {
      outDir: 'dist',
      // 生产构建禁用 sourcemap 以保护源码
      sourcemap: !isProduction,
      // 使用 terser 进行更强的压缩（默认是 esbuild）
      minify: isProduction ? 'terser' : 'esbuild',
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true, // 移除 console.log
              drop_debugger: true, // 移除 debugger
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
              toplevel: true, // 混淆顶级作用域变量名
            },
            format: {
              comments: false, // 移除所有注释
            },
          }
        : undefined,
      // 优化 chunk 分割
      rollupOptions: {
        output: {
          // 生产环境使用哈希化文件名
          entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
          chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction
            ? 'assets/[hash].[ext]'
            : 'assets/[name].[ext]',
        },
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        shared: path.resolve(__dirname, '../shared/src/index.ts'),
      },
    },
  };
});
