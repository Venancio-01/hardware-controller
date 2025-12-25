/**
 * ConfigImportExportService 单元测试
 *
 * 测试配置导入/导出服务的导出和导入功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFile, writeFile } from 'fs/promises';
import { ZodError } from 'zod';
import { ConfigImportExportService } from '../config-import-export.service.js';

// Mock fs/promises 模块
vi.mock('fs/promises');

describe('ConfigImportExportService', () => {
  let exportService: ConfigImportExportService;
  const mockConfigPath = '/test/path/config.json';

  beforeEach(() => {
    exportService = new ConfigImportExportService(mockConfigPath);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportConfig', () => {
    it('应该成功导出配置为 JSON 字符串', async () => {
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

      // Act: 调用 exportConfig
      const result = await exportService.exportConfig();

      // Assert: 验证结果
      expect(result).toEqual(JSON.stringify(validConfig, null, 2));
      expect(readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('应该在配置文件不存在时抛出错误', async () => {
      // Arrange: 模拟文件不存在错误
      const fileNotFoundError: any = new Error('File not found');
      fileNotFoundError.code = 'ENOENT';
      vi.mocked(readFile).mockRejectedValue(fileNotFoundError);

      // Act & Assert: 验证抛出特定错误
      await expect(exportService.exportConfig()).rejects.toThrow('配置文件不存在');
    });

    it('应该在配置验证失败时抛出错误', async () => {
      // Arrange: 准备不符合 schema 的配置
      const invalidConfig = {
        deviceId: '', // 无效：设备 ID 不能为空
        timeout: -1000, // 无效：超时必须为正数
        retryCount: 3,
        pollingInterval: 5000,
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
        dns: ['8.8.8.8']
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      // Act & Assert: 验证抛出验证错误
      await expect(exportService.exportConfig()).rejects.toThrow(ZodError);
    });
  });

  describe('importConfig', () => {
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

    it('应该成功导入 JSON 字符串配置并保存', async () => {
      // Arrange: 准备有效的配置 JSON 字符串
      const configJson = JSON.stringify(validConfig);

      // Act: 调用 importConfig
      const result = await exportService.importConfig(configJson);

      // Assert: 验证结果和保存操作
      expect(result).toEqual(validConfig);
      // 验证写入了临时文件（原子写入）
      expect(writeFile).toHaveBeenCalledWith(
        mockConfigPath + '.tmp',
        JSON.stringify(validConfig, null, 2),
        'utf-8'
      );
    });

    it('应该成功导入配置对象并保存', async () => {
      // Act: 调用 importConfig 传入配置对象
      const result = await exportService.importConfig(validConfig);

      // Assert: 验证结果和保存操作
      expect(result).toEqual(validConfig);
      // 验证写入了临时文件（原子写入）
      expect(writeFile).toHaveBeenCalledWith(
        mockConfigPath + '.tmp',
        JSON.stringify(validConfig, null, 2),
        'utf-8'
      );
    });

    it('应该在配置验证失败时抛出错误', async () => {
      // Arrange: 准备不符合 schema 的配置
      const invalidConfig = {
        deviceId: '', // 无效：设备 ID 不能为空
        timeout: -1000, // 无效：超时必须为正数
        retryCount: 3,
        pollingInterval: 5000,
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080
      };

      // Act & Assert: 验证抛出验证错误
      await expect(exportService.importConfig(invalidConfig)).rejects.toThrow(ZodError);
    });

    it('应该在 JSON 格式错误时抛出错误', async () => {
      // Arrange: 准备无效的 JSON 字符串
      const invalidJson = '{ invalid json }';

      // Act & Assert: 验证抛出 JSON 解析错误
      await expect(exportService.importConfig(invalidJson)).rejects.toThrow('配置文件格式无效，无法解析 JSON');
    });

    it('应该在缺少必需字段时抛出验证错误', async () => {
      // Arrange: 准备缺少字段的配置
      const incompleteConfig = {
        deviceId: 'device-001',
        timeout: 5000,
        retryCount: 3,
        pollingInterval: 5000,
        // 缺少网络配置字段
      };

      // Act & Assert: 验证抛出验证错误
      await expect(exportService.importConfig(incompleteConfig)).rejects.toThrow(ZodError);
    });

    it('应该在字段类型错误时抛出验证错误', async () => {
      // Arrange: 准备字段类型错误的配置
      const wrongTypeConfig = {
        deviceId: 'device-001',
        timeout: 'not-a-number', // 错误：应该是 number
        retryCount: 3,
        pollingInterval: 5000,
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080
      };

      // Act & Assert: 验证抛出验证错误
      await expect(exportService.importConfig(wrongTypeConfig)).rejects.toThrow(ZodError);
    });

    it('应该在文件写入失败时抛出错误', async () => {
      // Arrange: 准备有效的配置，但模拟文件写入失败
      const writeFileError: any = new Error('Write error');
      vi.mocked(writeFile).mockRejectedValue(writeFileError);

      // Act & Assert: 验证抛出写入错误
      await expect(exportService.importConfig(validConfig)).rejects.toThrow('配置保存失败');
    });
  });

  describe('integration', () => {
    it('应该能够导出然后导入配置', async () => {
      // Arrange: 设置初始配置
      const originalConfig = {
        deviceId: 'original-device',
        timeout: 3000,
        retryCount: 2,
        pollingInterval: 2000,
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        port: 8080,
        dns: ['8.8.8.8']
      };
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(originalConfig));

      // Act 1: 导出配置
      const exportedConfig = await exportService.exportConfig();

      // 设置文件写入模拟，以便导入可以工作
      let savedConfig: string | null = null;
      vi.mocked(writeFile).mockImplementation(async (path: any, data: any) => {
        savedConfig = data;
        return Promise.resolve();
      });

      // Act 2: 导入之前导出的配置
      const importedConfig = await exportService.importConfig(JSON.parse(exportedConfig));

      // Assert: 验证导入的配置与原始配置相同
      expect(importedConfig).toEqual(originalConfig);
      expect(JSON.parse(savedConfig!)).toEqual(originalConfig);
    });
  });
});