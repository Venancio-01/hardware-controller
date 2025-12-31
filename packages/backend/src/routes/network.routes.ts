/**
 * 网络配置路由
 *
 * 提供网络配置相关的 API 端点
 * - GET /api/network/config - 获取当前网络配置
 * - POST /api/network/apply - 应用网络配置
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { NetworkService, type NetworkConfig } from '../services/network.service.js';
import { createModuleLogger } from 'shared';

const router: Router = Router();
const networkService = new NetworkService();
const logger = createModuleLogger('NetworkRoutes');

/**
 * GET /api/network/config
 * 获取当前网络配置
 */
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await networkService.getNetworkConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('获取网络配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || '获取网络配置失败',
    });
  }
});

/**
 * POST /api/network/apply
 * 应用网络配置
 *
 * 请求体:
 * {
 *   ipAddress: string,
 *   subnetMask: string,
 *   gateway: string
 * }
 */
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config: NetworkConfig = req.body;

    // 验证请求数据
    if (!config.ipAddress || !config.subnetMask || !config.gateway) {
      res.status(400).json({
        success: false,
        error: '缺少必要的网络配置参数',
      });
      return;
    }

    // 验证配置格式
    const validation = networkService.validateConfig(config);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: '网络配置参数无效',
        errors: validation.errors,
      });
      return;
    }

    logger.info('收到网络配置应用请求', { config });

    // 应用网络配置
    await networkService.applyNetworkConfig(config);

    res.json({
      success: true,
      message: '网络配置已应用',
    });
  } catch (error: any) {
    logger.error('应用网络配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || '应用网络配置失败',
    });
  }
});

export default router;
