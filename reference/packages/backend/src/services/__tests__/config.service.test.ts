/**
 * ConfigService 单元测试
 *
 * 测试配置服务的文件读取、JSON 解析和验证功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFile, writeFile, copyFile, rename } from 'fs/promises';
import { ZodError } from 'zod';
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
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(validConfig));

      // Act: 调用 getConfig
      const result = await configService.getConfig();

      // Assert: 验证结果
      expect(result).toMatchObject(validConfig);
      expect(readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('应该在文件不存在时返回默认配置', async () => {
      // Arrange: 模拟文件不存在错误
      const fileNotFoundError: any = new Error('File not found');
      fileNotFoundError.code = 'ENOENT';
      vi.mocked(readFile).mockRejectedValue(fileNotFoundError);

      // Act
      const result = await configService.getConfig();

      // Assert
      expect(result.deviceId).toBe('device-001');
      expect(result.timeout).toBe(5000);
      expect(result.retryCount).toBe(3);
      expect(result.pollingInterval).toBe(5000);
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
      await expect(configService.getConfig()).rejects.toThrow(ZodError);
    });

    it('应该使用默认路径（如果未指定）', () => {
      // Arrange: 不传递路径参数
      const serviceWithDefaultPath = new ConfigService();

      // Assert: 验证使用默认路径
      // 注意：这里我们只验证服务可以正常创建
      expect(serviceWithDefaultPath).toBeDefined();
    });

    it('应该在缺少必需字段时补全默认值', async () => {
      // Arrange: 准备缺少字段的配置
      const incompleteConfig = {
        deviceId: 'device-001',
        // 缺少 timeout, retryCount, pollingInterval
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(incompleteConfig));

      // Act
      const result = await configService.getConfig();

      // Assert
      expect(result.timeout).toBe(5000);
      expect(result.retryCount).toBe(3);
      expect(result.pollingInterval).toBe(5000);
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
      await expect(configService.getConfig()).rejects.toThrow(ZodError);
    });
  });

  describe('updateConfig', () => {
    const newConfig = {
      deviceId: 'device-001',
      timeout: 6000,
      retryCount: 5,
      pollingInterval: 10000,
      ipAddress: '192.168.1.100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      port: 8080
    };

    it('应该在写入前创建备份', async () => {
      // Arrange
      // 模拟配置文件存在
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(newConfig)); // existing file content mock

      // Act
      await configService.updateConfig(newConfig);

      // Assert
      // 验证 copyFile 被调用 (备份)
      // 注意：mockConfigPath 是 /test/path/config.json
      // 备份路径应该是 /test/path/config.backup.json
      const backupPath = mockConfigPath.replace('.json', '.backup.json');
      expect(copyFile).toHaveBeenCalledWith(mockConfigPath, backupPath);
    });

    it('应该使用原子写入模式', async () => {
      // Arrange
      // 模拟文件读取（为了备份检查）
      vi.mocked(readFile).mockResolvedValue('{}');

      // Act
      await (configService as any).updateConfig(newConfig);

      // Assert
      // 1. 验证写入临时文件
      const tempPath = mockConfigPath + '.tmp';
      expect(writeFile).toHaveBeenCalledWith(tempPath, expect.any(String), 'utf-8');

      // 2. 验证临时文件内容是格式化的 JSON
      const writeCall = vi.mocked(writeFile).mock.calls.find((call: any[]) => call[0] === tempPath);
      expect(writeCall).toBeDefined();
      const savedConfig = JSON.parse(writeCall![1] as string);
      expect(savedConfig).toMatchObject(newConfig);

      // 3. 验证重命名
      expect(rename).toHaveBeenCalledWith(tempPath, mockConfigPath);
    });

    it('应该在配置验证失败时抛出错误', async () => {
      // Arrange
      const invalidConfig = {
        deviceId: '', // Invalid
        timeout: -1,
        retryCount: 3,
        pollingInterval: 5000,
      } as any;

      // Act & Assert
      await expect((configService as any).updateConfig(invalidConfig)).rejects.toThrow(ZodError);

      // 验证没有执行写入操作
      expect(writeFile).not.toHaveBeenCalled();
    });
  });
});
