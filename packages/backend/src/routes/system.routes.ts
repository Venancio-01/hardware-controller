import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { connectionTestService } from '../services/connection-test.service.js';
import { RestartService } from '../services/restart.service.js';
import { CoreProcessManager } from '../services/core-process-manager.js';
import { createModuleLogger, testConnectionRequestSchema } from 'shared';

const logger = createModuleLogger('SystemRoutes');

const router: Router = Router();

// 连接测试速率限制 - 防止滥用和 DoS 攻击
const connectionTestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 每分钟最多 10 次请求
  message: {
    success: false,
    error: '连接测试请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 测试连接端点
router.post('/test-connection', connectionTestLimiter, async (req, res) => {
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
        message: '系统重启已启动'
      });
    } else {
      res.status(409).json({
        success: false,
        message: '系统重启已在进行中'
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to process restart request');
    res.status(500).json({
      success: false,
      message: '启动系统重启失败'
    });
  }
});

const coreProcessManager = CoreProcessManager.getInstance();

// Core 重启速率限制 - 防止频繁重启
const coreRestartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 3, // 每分钟最多 3 次请求
  message: {
    success: false,
    error: 'Core 重启请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/system/core/restart
 * 重启 Core 进程
 */
router.post('/core/restart', coreRestartLimiter, async (req, res) => {
  try {
    logger.info('Received Core restart request');

    await coreProcessManager.restart();

    logger.info('Core restart initiated successfully');

    res.status(200).json({
      success: true,
      message: 'Core 进程重启已启动',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to restart Core process: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: '重启 Core 进程失败',
      message: errorMessage,
    });
  }
});

export default router;
