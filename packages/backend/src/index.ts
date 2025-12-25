/**
 * 后端服务入口点
 *
 * 初始化并启动 Express 服务器，配置优雅关闭处理
 */

import express from 'express';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000');

// 创建并启动服务器
const app: express.Application = createServer();

const server = app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
  logger.info(`📦 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📝 日志级别: ${process.env.LOG_LEVEL || 'info'}`);
});

// 优雅关闭处理
function gracefulShutdown(signal: string) {
  logger.info(`${signal} 信号接收，正在优雅关闭...`);
  server.close(() => {
    logger.info('✅ HTTP 服务器已关闭');
    process.exit(0);
  });

  // 如果 10 秒后还未关闭，强制退出
  setTimeout(() => {
    logger.error('⚠️ 强制退出：优雅关闭超时');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, logger };
