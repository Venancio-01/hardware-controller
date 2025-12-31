import { Router } from 'express';
import { RestartService } from '../services/restart.service.js';
import { CoreProcessManager } from '../services/core-process-manager.js';
import { createModuleLogger } from 'shared';

const logger = createModuleLogger('SystemRoutes');

const router: Router = Router();

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
    logger.error('Failed to process restart request', error as Error);
    res.status(500).json({
      success: false,
      message: '启动系统重启失败'
    });
  }
});

const coreProcessManager = CoreProcessManager.getInstance();

/**
 * GET /api/system/core/restart
 * 重启 Core 进程
 */
router.post('/core/restart', async (req, res) => {
  try {
    await coreProcessManager.restart();

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

/**
 * GET /api/system/serial-ports
 * 获取可用串口列表
 */
router.get('/serial-ports', async (req, res) => {
  try {
    // 动态导入 serialport 以避免在非 Node 环境下（虽然这里是后端，但为了安全起见或保持习惯）或在不需要时加载
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();

    const formattedPorts = ports
      .filter(port => port.pnpId)
      .map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        productId: port.productId,
        vendorId: port.vendorId,
      }));

    res.status(200).json({
      success: true,
      data: formattedPorts,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to list serial ports: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: '获取串口列表失败',
      message: errorMessage,
    });
  }
});

export default router;
