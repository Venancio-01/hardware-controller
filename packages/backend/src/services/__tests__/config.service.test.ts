/**
 * ConfigService 单元测试
 *
 * 测试配置服务的文件读取、JSON 解析和验证功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFile } from 'fs/promises';
import { ConfigService } from '../config.service.js';

// Mock fs/promises 模块
vi.mock('fs/promises');

describe('ConfigService', () => {
  let configService: ConfigService;
  const mockConfigPath = '/test/path/config.json';

  beforeEach(() => {
    configService = new ConfigService(mockConfigPath);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfig', () => {
    it('应该成功读取并验证有效的配置文件', async () => {
      // Arrange: 准备有效的配置数据
      const validConfig = {
        deviceId: 'device-001',
        timeout: 5000,
        retryCount: 3,
        pollingInterval: 5000,
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(validConfig));

      // Act: 调用 getConfig
      const result = await configService.getConfig();

      // Assert: 验证结果
      expect(result).toEqual(validConfig);
      expect(readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('应该在文件不存在时抛出错误', async () => {
      // Arrange: 模拟文件不存在错误
      const fileNotFoundError: any = new Error('File not found');
      fileNotFoundError.code = 'ENOENT';
      vi.mocked(readFile).mockRejectedValue(fileNotFoundError);

      // Act & Assert: 验证抛出特定错误
      await expect(configService.getConfig()).rejects.toThrow('配置文件不存在');
    });

    it('应该在 JSON 格式错误时抛出错误', async () => {
      // Arrange: 准备无效的 JSON 字符串
      vi.mocked(readFile).mockResolvedValue('{ invalid json }');

      // Act & Assert: 验证抛出 JSON 解析错误
      await expect(configService.getConfig()).rejects.toThrow();
    });

    it('应该在配置验证失败时抛出错误', async () => {
      // Arrange: 准备不符合 schema 的配置
      const invalidConfig = {
        deviceId: '', // 无效：设备 ID 不能为空
        timeout: -1000, // 无效：超时必须为正数
        retryCount: 3,
        pollingInterval: 5000,
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      // Act & Assert: 验证抛出验证错误
      await expect(configService.getConfig()).rejects.toThrow('配置文件格式无效');
    });

    it('应该使用默认路径（如果未指定）', () => {
      // Arrange: 不传递路径参数
      const serviceWithDefaultPath = new ConfigService();

      // Assert: 验证使用默认路径
      // 注意：这里我们只验证服务可以正常创建
      expect(serviceWithDefaultPath).toBeDefined();
    });

    it('应该在缺少必需字段时抛出验证错误', async () => {
      // Arrange: 准备缺少字段的配置
      const incompleteConfig = {
        deviceId: 'device-001',
        // 缺少 timeout, retryCount, pollingInterval
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(incompleteConfig));

      // Act & Assert: 验证抛出验证错误
      await expect(configService.getConfig()).rejects.toThrow('配置文件格式无效');
    });

    it('应该在字段类型错误时抛出验证错误', async () => {
      // Arrange: 准备字段类型错误的配置
      const wrongTypeConfig = {
        deviceId: 'device-001',
        timeout: 'not-a-number', // 错误：应该是 number
        retryCount: 3,
        pollingInterval: 5000,
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(wrongTypeConfig));

      // Act & Assert: 验证抛出验证错误
      await expect(configService.getConfig()).rejects.toThrow('配置文件格式无效');
    });
  });
});
