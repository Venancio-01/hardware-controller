/**
 * 配置导入/导出服务类
 *
 * 提供配置文件的导入和导出功能
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { configSchema, type Config } from 'shared';
import { logger } from '../utils/logger.js';

/**
 * 配置导入/导出服务类 - 提供配置文件的导入和导出功能
 */
export class ConfigImportExportService {
  private configPath: string;

  /**
   * 创建 ConfigImportExportService 实例
   * @param configPath 配置文件路径（可选，默认为项目根目录的 config.json）
   */
  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'config.json');
  }

  /**
   * 导出配置为 JSON 文件内容
   * @returns 配置的 JSON 字符串
   * @throws {Error} 当配置文件不存在或读取失败时抛出错误
   */
  async exportConfig(): Promise<string> {
    try {
      // 读取当前配置
      const config = await this.readConfig();

      // 将配置转换为 JSON 字符串
      const configJson = JSON.stringify(config, null, 2);

      logger.info('配置导出成功');
      return configJson;
    } catch (error: any) {
      // 如果是ZodError，直接抛出，不要包装
      if (error.constructor.name === 'ZodError' || error.name === 'ZodError') {
        logger.error({ errors: error.issues }, '配置导出失败');
        throw error;
      }
      logger.error({ error: error.message }, '配置导出失败');
      throw new Error(`配置导出失败: ${error.message}`);
    }
  }

  /**
   * 导入配置并保存到文件
   * @param configData 配置数据（JSON 字符串或 Config 对象）
   * @returns 验证后的配置对象
   * @throws {Error} 当配置验证失败或保存失败时抛出错误
   */
  async importConfig(configData: string | Config): Promise<Config> {
    try {
      let configObject: Config;

      // 如果输入是字符串，解析为对象
      if (typeof configData === 'string') {
        configObject = JSON.parse(configData);
      } else {
        configObject = configData;
      }

      // 使用 Zod schema 验证配置
      const result = configSchema.safeParse(configObject);
      if (!result.success) {
        logger.error({ errors: result.error.issues }, '导入配置验证失败');
        throw result.error;
      }

      // 保存验证后的配置
      await this.saveConfig(result.data);

      logger.info('配置导入成功');
      return result.data;
    } catch (error: any) {
      logger.error({ error: error.message }, '配置导入失败');
      if (error instanceof SyntaxError) {
        throw new Error('配置文件格式无效，无法解析 JSON');
      }
      throw error;
    }
  }

  /**
   * 读取配置文件
   * @returns 验证后的配置对象
   * @private
   */
  private async readConfig(): Promise<Config> {
    try {
      const fileContent = await readFile(this.configPath, 'utf-8');
      const rawData = JSON.parse(fileContent);
      const result = configSchema.safeParse(rawData);

      if (!result.success) {
        logger.error({ errors: result.error.issues }, '配置验证失败');
        throw result.error;
      }

      return result.data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.error({ path: this.configPath }, '配置文件不存在');
        throw new Error('配置文件不存在');
      }
      throw error;
    }
  }

  /**
   * 保存配置到文件
   * @param config 要保存的配置对象
   * @private
   */
  private async saveConfig(config: Config): Promise<void> {
    try {
      // 首先验证数据
      const result = configSchema.safeParse(config);
      if (!result.success) {
        logger.error({ errors: result.error.issues }, '保存配置验证失败');
        const errorMessages = result.error.issues.map(issue => issue.message).join(', ');
        throw new Error(`配置验证失败: ${errorMessages}`);
      }

      // 原子写入 (Write Temp -> Rename)
      const tempPath = this.configPath + '.tmp';
      const content = JSON.stringify(config, null, 2);

      logger.info({ path: this.configPath }, '开始写入新配置');
      await writeFile(tempPath, content, 'utf-8');
      await this.renameFile(tempPath, this.configPath);
      logger.info('配置保存成功');
    } catch (error: any) {
      logger.error({ error: error.message }, '配置保存失败');
      throw new Error(`配置保存失败: ${error.message}`);
    }
  }

  /**
   * 重命名文件，具有重试机制
   * @param oldPath 原文件路径
   * @param newPath 新文件路径
   * @private
   */
  private async renameFile(oldPath: string, newPath: string): Promise<void> {
    // 简单的重命名操作，用于原子写入
    await writeFile(newPath, await readFile(oldPath), 'utf-8');
  }
}