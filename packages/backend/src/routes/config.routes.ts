/**
 * Config 路由
 *
 * 处理配置相关的 API 端点
 */

import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../services/config.service.js';

const router: express.Router = Router();
const configService = new ConfigService();

/**
 * GET /api/config
 * 获取当前配置
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configService.getConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    if (error.message === '配置文件不存在') {
      return res.status(404).json({
        success: false,
        error: '配置文件不存在',
      });
    }
    if (error.message === '配置文件格式无效') {
      return res.status(400).json({
        success: false,
        error: '配置文件格式无效',
      });
    }
    // 将其他错误传递给错误处理中间件
    next(error);
  }
});

export default router;
