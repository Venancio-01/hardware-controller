/**
 * Config 路由集成测试
 *
 * 测试 GET /api/config 端点的各种场景
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import configRoutes from '../config.routes.js';
import { ConfigService } from '../../services/config.service.js';
import { ConfigImportExportService } from '../../services/config-import-export.service.js';

describe('GET /api/config/defaults', () => {
  let app: express.Application;
  let getDefaultConfigSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config', configRoutes);

    // Mock ConfigService.prototype.getDefaultConfig
    getDefaultConfigSpy = vi.spyOn(ConfigService.prototype, 'getDefaultConfig');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该返回 200 和默认配置数据', async () => {
    // Arrange: Mock 默认配置
    const mockDefaults = {
      deviceId: 'device-001',
      timeout: 5000,
    };
    getDefaultConfigSpy.mockReturnValue(mockDefaults);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config/defaults');

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: mockDefaults,
    });
    expect(getDefaultConfigSpy).toHaveBeenCalled();
  });

  it('应该在发生错误时返回 500', async () => {
    // Arrange: Mock 错误
    const error = new Error('Test Error');
    getDefaultConfigSpy.mockImplementation(() => { throw error; });

    // 需要错误处理中间件
    const appWithErr = express();
    appWithErr.use(express.json());
    appWithErr.use('/api/config', configRoutes);
    appWithErr.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ success: false, error: '服务器错误' });
    });

    // Act: 发送 GET 请求
    const response = await request(appWithErr).get('/api/config/defaults');

    // Assert: 验证响应
    expect(response.status).toBe(500);
  });
});

describe('GET /api/config', () => {
  let app: express.Application;
  let getConfigSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config', configRoutes);

    // Mock ConfigService.prototype.getConfig
    getConfigSpy = vi.spyOn(ConfigService.prototype, 'getConfig');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该返回 200 和正确的配置数据', async () => {
    // Arrange: Mock 成功的配置读取
    const mockConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
    };
    getConfigSpy.mockResolvedValue(mockConfig);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config');

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: mockConfig,
    });
  });

  it('应该在默认配置可用时返回 200', async () => {
    // Arrange: Mock 默认配置
    const defaultConfig = {
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '127.0.0.1',
      subnetMask: '255.255.255.0',
      gateway: '127.0.0.1',
      port: 80,
      dns: [],
    };
    getConfigSpy.mockResolvedValue(defaultConfig);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config');

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: defaultConfig,
    });
  });

  it('应该在验证失败时返回 400', async () => {
    // Arrange: Mock 验证失败错误
    const zodError = new ZodError([{
      code: 'custom',
      path: ['deviceId'],
      message: 'Invalid deviceId'
    }]);
    getConfigSpy.mockRejectedValue(zodError);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config');

    // Assert: 验证响应
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: '配置文件格式无效',
      validationErrors: { deviceId: ['Invalid deviceId'] }
    });
  });


  it('应该在其他错误时返回 500', async () => {
    // Arrange: Mock 未知错误
    const app2 = express();
    app2.use(express.json());
    app2.use('/api/config', configRoutes);
    // 添加错误处理中间件
    app2.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ success: false, error: '服务器错误' });
    });

    const unknownError = new Error('Unknown error');
    getConfigSpy.mockRejectedValue(unknownError);

    // Act: 发送 GET 请求
    const response = await request(app2).get('/api/config');

    // Assert: 验证响应（应该被错误处理中间件捕获）
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe('PUT /api/config', () => {
  let app: express.Application;
  let updateConfigSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config', configRoutes);

    // Mock ConfigService.prototype.updateConfig
    updateConfigSpy = vi.spyOn(ConfigService.prototype, 'updateConfig');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validConfig = {
    deviceId: 'device-001',
    timeout: 5000,
    retryCount: 3,
    pollingInterval: 5000,
  };

  it('应该成功更新配置并返回 200', async () => {
    // Arrange
    updateConfigSpy.mockResolvedValue(undefined);

    // Act
    const response = await request(app)
      .put('/api/config')
      .send(validConfig);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: '配置已保存',
      needsRestart: true,
    });
    expect(updateConfigSpy).toHaveBeenCalledWith(validConfig);
  });

  it('应该在 ConfigService 抛出验证错误时返回 400', async () => {
    // Arrange: Mock 验证错误
    const zodError = new ZodError([{
      code: 'custom',
      path: ['deviceId'],
      message: 'deviceId required'
    }]);
    updateConfigSpy.mockRejectedValue(zodError);

    // Act
    const response = await request(app)
      .put('/api/config')
      .send({}); // Empty body

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: '配置验证失败',
      validationErrors: { deviceId: ['deviceId required'] }
    });
  });

  it('应该在 ConfigService 抛出其他错误时返回 500', async () => {
    // Arrange: Mock 系统错误
    updateConfigSpy.mockRejectedValue(new Error('配置更新失败: EIO'));

    // 需要错误处理中间件
    const appWithErr = express();
    appWithErr.use(express.json());
    appWithErr.use('/api/config', configRoutes);
    appWithErr.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ success: false, error: '服务器错误' });
    });

    // Act
    const response = await request(appWithErr)
      .put('/api/config')
      .send(validConfig);

    // Assert
    expect(response.status).toBe(500);
  });
});

describe('GET /api/config/export', () => {
  let app: express.Application;
  let exportConfigSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config', configRoutes);

    // Mock ConfigImportExportService.prototype.exportConfig
    exportConfigSpy = vi.spyOn(ConfigImportExportService.prototype, 'exportConfig');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该导出配置并触发文件下载', async () => {
    // Arrange: Mock 成功的配置导出
    const mockConfigJson = JSON.stringify({
      deviceId: 'device-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080
    }, null, 2);
    exportConfigSpy.mockResolvedValue(mockConfigJson);

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config/export');

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['content-disposition']).toContain('attachment; filename="config.json"');
    expect(response.text).toEqual(mockConfigJson);
  });

  it('应该在配置文件不存在时返回 404', async () => {
    // Arrange: Mock 配置文件不存在错误
    exportConfigSpy.mockRejectedValue(new Error('配置文件不存在'));

    // Act: 发送 GET 请求
    const response = await request(app).get('/api/config/export');

    // Assert: 验证响应
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: '配置文件不存在，无法导出',
    });
  });
});

describe('POST /api/config/import', () => {
  let app: express.Application;
  let importConfigSpy: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/config', configRoutes);

    // Mock ConfigImportExportService.prototype.importConfig
    importConfigSpy = vi.spyOn(ConfigImportExportService.prototype, 'importConfig');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validConfig = {
    deviceId: 'device-001',
    timeout: 5000,
    retryCount: 3,
    pollingInterval: 5000,
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    port: 8080
  };

  it('应该导入配置并返回成功消息', async () => {
    // Arrange: Mock 成功的配置导入
    importConfigSpy.mockResolvedValue(validConfig);

    // Act: 发送 POST 请求
    const response = await request(app)
      .post('/api/config/import')
      .send({ config: validConfig });

    // Assert: 验证响应
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: validConfig,
      message: '配置导入成功',
      needsRestart: true
    });
    expect(importConfigSpy).toHaveBeenCalledWith(validConfig);
  });

  it('应该在缺少配置数据时返回 400', async () => {
    // Act: 发送没有配置数据的 POST 请求
    const response = await request(app)
      .post('/api/config/import')
      .send({});

    // Assert: 验证响应
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: '缺少配置数据'
    });
  });

  it('应该在配置验证失败时返回 400', async () => {
    // Arrange: Mock 验证错误
    const zodError = new ZodError([{
      code: 'custom',
      path: ['deviceId'],
      message: 'Invalid deviceId'
    }]);
    importConfigSpy.mockRejectedValue(zodError);

    // Act: 发送 POST 请求
    const response = await request(app)
      .post('/api/config/import')
      .send({ config: { deviceId: '' } });

    // Assert: 验证响应
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: '配置验证失败',
      validationErrors: { deviceId: ['Invalid deviceId'] }
    });
  });

  it('应该在配置格式无效时返回 400', async () => {
    // Arrange: Mock 格式错误
    importConfigSpy.mockRejectedValue(new Error('配置文件格式无效，无法解析 JSON'));

    // Act: 发送 POST 请求
    const response = await request(app)
      .post('/api/config/import')
      .send({ config: 'invalid json' });

    // Assert: 验证响应
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: '配置文件格式无效，无法解析 JSON'
    });
  });
});
