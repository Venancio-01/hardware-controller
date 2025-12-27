/**
 * Core Status Routes - Core 进程状态 API
 * @module routes/core-status.routes
 */
import { Router, Request, Response } from 'express';
import { createModuleLogger } from 'shared';
import type { CoreStatusResponse, ApiSuccessResponse } from 'shared';
import { CoreStatusService } from '../services/core-status.service.js';

const logger = createModuleLogger('CoreStatusRoutes');

const router: Router = Router();

/**
 * GET /api/system/core/status
 * 获取 Core 进程状态
 *
 * 需要认证（通过 /api 下的 authMiddleware）
 *
 * @returns {ApiSuccessResponse<CoreStatusResponse>} Core 状态响应
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const state = CoreStatusService.getState();

    const response: ApiSuccessResponse<CoreStatusResponse> = {
      success: true,
      data: {
        status: state.status,
        uptime: CoreStatusService.getUptime(),
        lastError: state.lastError,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('获取 Core 状态失败', { error });
    res.status(500).json({
      success: false,
      error: '获取 Core 状态失败',
    });
  }
});

export default router;
