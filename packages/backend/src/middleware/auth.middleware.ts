import { Request, Response, NextFunction } from 'express';
import { authConfig } from '../config/auth.config.js';
import jwt from 'jsonwebtoken';

/**
 * 认证中间件
 * 验证请求头中的Token或Basic Auth凭证
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 公开路由白名单
  const publicPaths = ['/api/auth/login', '/api/status', '/health'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // 如果未启用认证，直接通过
  if (!authConfig.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: '未授权访问'
    });
    return;
  }

  // Bearer Token (JWT)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, authConfig.jwtSecret);
      return next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: '无效的Token'
      });
      return;
    }
  }

  // 简单处理 Basic Auth
  if (authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username === authConfig.username && password === authConfig.password) {
      return next();
    }
  }

  res.status(401).json({
    success: false,
    error: '认证失败'
  });
}
