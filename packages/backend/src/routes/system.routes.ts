import { Router } from 'express';
import { connectionTestService } from '../services/connection-test.service.js';
import { RestartService } from '../services/restart.service.js';
import { logger } from '../utils/logger.js';
import { testConnectionRequestSchema } from 'shared';

const router: Router = Router();

// 测试连接端点
router.post('/test-connection', async (req, res) => {
  try {
    // 验证请求体
    const validationResult = testConnectionRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validationResult.error.issues,
      });
    }

    const testRequest = validationResult.data;

    logger.info(`Received connection test request for ${testRequest.ipAddress}:${testRequest.port}`);

    const result = await connectionTestService.testConnection(testRequest);

    logger.info(`Connection test completed for ${testRequest.ipAddress}:${testRequest.port}, success: ${result.success}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error }, '连接测试失败');
    res.status(500).json({
      success: false,
      error: '连接测试失败',
    });
  }
});

const restartService = RestartService.getInstance();

/**
 * POST /api/system/restart
 * 重启系统
 */
router.post('/restart', async (req, res) => {
  try {
    logger.info('Received restart request');

    const success = await restartService.restartSystem();

    if (success) {
      // 返回成功响应，但实际重启会在稍后发生
      res.status(200).json({
        success: true,
        message: 'Restart initiated successfully'
      });
    } else {
      res.status(409).json({
        success: false,
        message: 'Restart already in progress'
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to process restart request');
    res.status(500).json({
      success: false,
      message: 'Failed to initiate restart'
    });
  }
});

export default router;