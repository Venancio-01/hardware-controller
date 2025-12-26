import { Router } from 'express';
import { StatusService } from '../services/status.service.js';
import { createSimpleLogger } from 'shared';

const logger = createSimpleLogger();

const router: Router = Router();
const statusService = new StatusService();

router.get('/', async (req, res) => {
  try {
    const status = await statusService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error({ err: error }, '获取状态失败');
    res.status(500).json({
      success: false,
      error: '获取状态失败',
    });
  }
});

export default router;
