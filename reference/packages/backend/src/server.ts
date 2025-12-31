/**
 * Express 服务器配置
 *
 * 初始化 Express 应用，配置中间件和路由
 */

import express from 'express';
import pinoHttp from 'pino-http';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { logger } from 'shared';
import configRoutes from './routes/config.routes.js';
import statusRoutes from './routes/status.routes.js';
import authRoutes from './routes/auth.routes.js';
import systemRoutes from './routes/system.routes.js';
import coreStatusRoutes from './routes/core-status.routes.js';
import conflictDetectionRoutes from './routes/conflict-detection.routes.js';
import networkRoutes from './routes/network.routes.js';
import { authMiddleware } from './middleware/auth.middleware.js';

// ES Module __dirname polyfill
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

/**
 * 创建并配置 Express 应用实例
 * @returns 配置好的 Express 应用
 */
export function createServer(): express.Application {
  const app = express();

  // Pino HTTP 日志中间件
  app.use(pinoHttp({ logger: logger.getRawLogger() }));

  // JSON body parser 中间件
  app.use(express.json());

  // 开发环境 CORS 配置
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }

  // 健康检查路由
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // API 路由
  app.use('/api/auth', authRoutes); // 公开路由

  // 受保护路由
  app.use('/api', authMiddleware); // 保护 /api 下的所有其他路由 (除了白名单)

  app.use('/api/config', configRoutes);
  app.use('/api/config/check-conflict', conflictDetectionRoutes); // 冲突检测作为config子路由
  app.use('/api/status', statusRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/system/core', coreStatusRoutes);
  app.use('/api/network', networkRoutes);

  // 生产环境静态文件服务
  if (process.env.NODE_ENV === 'production') {
    // 静态文件目录：生产环境中 public 目录位于 app 目录外层
    const publicPath = process.env.PUBLIC_PATH || path.resolve(_dirname, '../../public');
    app.use(express.static(publicPath));

    // SPA 回退路由：所有非 API 路由都返回 index.html
    app.get('*', (req, res) => {
      // 跳过 API 和健康检查路由
      if (req.path.startsWith('/api') || req.path === '/health') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.sendFile(path.join(publicPath, 'index.html'));
    });

    logger.info(`📂 静态文件服务: ${publicPath}`);
  }

  // 错误处理中间件
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试',
    });
  });

  return app;
}
