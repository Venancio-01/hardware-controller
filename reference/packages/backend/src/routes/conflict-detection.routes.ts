/**
 * 冲突检测路由
 *
 * 处理配置冲突检测相关的 API 端点
 */

import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { conflictDetectionRequestSchema } from 'shared';
import { conflictDetectionService } from '../services/conflict-detection.service.js';

const router: Router = Router();

/**
 * POST /api/config/check-conflict
 * 检测配置冲突
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const validatedRequest = conflictDetectionRequestSchema.parse(req.body);

    // 执行冲突检测
    const result = await conflictDetectionService.checkConflict(validatedRequest);

    // 返回检测结果
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '请求数据验证失败',
        validationErrors: error.flatten().fieldErrors,
      });
      return;
    }

    // 将其他错误传递给错误处理中间件
    next(error);
  }
});

export default router;
