/**
 * 后端服务入口点
 *
 * 初始化并启动 Express 服务器和 Core 应用程序，配置优雅关闭处理
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// ES Module __dirname polyfill compatible with CJS
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

import express from 'express';
import { createServer } from './server.js';
import { logger } from 'shared';
import * as path from 'path';
import { CoreProcessManager } from './services/core-process-manager.js';
import { WebSocketService } from './services/websocket.service.js';
import { shutdownManager } from './utils/shutdown-manager.js';

const PORT = parseInt(process.env.PORT || '3000');

// 创建并启动服务器
const app: express.Application = createServer();

const server = app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
  logger.info(`📦 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📝 日志级别: ${process.env.LOG_LEVEL || 'info'}`);

  // 初始化 WebSocket 服务
  WebSocketService.initialize(server);
  logger.info('🔌 WebSocket 服务已初始化');
});

// 启动 Core Process Manager
const coreProcessManager = CoreProcessManager.getInstance();
const isDev = process.env.NODE_ENV === 'development';

// 确定 Core 脚本路径
const scriptPath = isDev
  ? path.resolve(_dirname, '../../core/src/app.ts')
  : path.resolve(_dirname, '../../core/dist/app.cjs');

// 启动选项
const startOptions = isDev
  ? { execArgv: ['-r', 'dotenv/config', '--import', 'tsx'] } // 使用 tsx 加载器运行 TS 文件
  : { execArgv: ['-r', 'dotenv/config'] };

logger.info(`正在启动 Core 进程: ${scriptPath}`);
coreProcessManager.start(scriptPath, startOptions);

// 注册 Core 关闭处理器
shutdownManager.registerHandler('core-process', async () => {
  await coreProcessManager.stop();
});

// 注册 HTTP 服务器关闭处理器
shutdownManager.registerHandler('http-server', async () => {
  return new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('✅ HTTP 服务器已关闭');
      resolve();
    });
  });
});

// 注册 WebSocket 服务关闭处理器
shutdownManager.registerHandler('websocket', async () => {
  await WebSocketService.close();
});

// 优雅关闭处理
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} 信号接收，正在优雅关闭...`);

  // 执行所有注册的关闭处理器
  await shutdownManager.executeShutdown();

  logger.info('✅ 优雅关闭完成');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, logger };
