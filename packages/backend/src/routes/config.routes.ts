/**
 * Config 路由
 *
 * 处理配置相关的 API 端点
 */

import express, { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ConfigService } from '../services/config.service.js';
import { ConfigImportExportService } from '../services/config-import-export.service.js';

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
      res.status(404).json({
        success: false,
        error: '配置文件不存在',
      });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '配置文件格式无效',
        validationErrors: error.flatten().fieldErrors,
      });
      return;
    }
    // 将其他错误传递给错误处理中间件
    next(error);
  }
});

/**
 * PUT /api/config
 * 更新配置
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = req.body;
    await configService.updateConfig(config);

    res.json({
      success: true,
      message: '配置已保存',
      needsRestart: true,
    });
  } catch (error: any) {
    // 处理验证错误
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '配置验证失败',
        validationErrors: error.flatten().fieldErrors,
      });
      return;
    }

    // 其他错误 (如文件系统错误) 传递给错误处理中间件
    next(error);
  }
});

/**
 * GET /api/config/export
 * 导出配置文件
 */
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportService = new ConfigImportExportService();
    const configJson = await exportService.exportConfig();

    // 设置响应头以触发文件下载
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="config.json"');

    res.send(configJson);
  } catch (error: any) {
    if (error.message === '配置文件不存在') {
      res.status(404).json({
        success: false,
        error: '配置文件不存在，无法导出',
      });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '配置文件格式无效',
        validationErrors: error.flatten().fieldErrors,
      });
      return;
    }
    // 将其他错误传递给错误处理中间件
    next(error);
  }
});

/**
 * POST /api/config/import
 * 导入配置文件
 */
router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportService = new ConfigImportExportService();
    const { config } = req.body;

    if (!config) {
      res.status(400).json({
        success: false,
        error: '缺少配置数据',
      });
      return;
    }

    const validatedConfig = await exportService.importConfig(config);

    res.json({
      success: true,
      data: validatedConfig,
      message: '配置导入成功',
      needsRestart: true,
    });
  } catch (error: any) {
    // 处理验证错误
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '配置验证失败',
        validationErrors: error.flatten().fieldErrors,
      });
      return;
    }

    if (error.message.includes('配置文件格式无效')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // 其他错误 (如文件系统错误) 传递给错误处理中间件
    next(error);
  }
});

export default router;
