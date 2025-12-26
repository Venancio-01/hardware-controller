/**
 * 配置导入/导出服务类
 *
 * 提供配置文件的导入和导出功能
 */

import { readFile, writeFile, rename, copyFile } from 'fs/promises';
import { join } from 'path';
import { configSchema, type Config } from 'shared';
import { createSimpleLogger } from 'shared';

const logger = createSimpleLogger();

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

      // 保存验证后的配置(会自动创建备份)
      await this.saveConfig(result.data, true);

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
   * @param createBackup 是否在保存前创建备份 (默认: true)
   * @private
   */
  private async saveConfig(config: Config, createBackup: boolean = true): Promise<void> {
    try {
      // 首先验证数据
      const result = configSchema.safeParse(config);
      if (!result.success) {
        logger.error({ errors: result.error.issues }, '保存配置验证失败');
        const errorMessages = result.error.issues.map(issue => issue.message).join(', ');
        throw new Error(`配置验证失败: ${errorMessages}`);
      }

      // 如果配置文件存在且需要备份,创建备份
      if (createBackup) {
        await this.createBackup();
      }

      // 原子写入 (Write Temp -> Rename)
      const tempPath = this.configPath + '.tmp';
      const content = JSON.stringify(config, null, 2);

      logger.info({ path: this.configPath }, '开始写入新配置');
      await writeFile(tempPath, content, 'utf-8');
      await this.atomicRename(tempPath, this.configPath);
      logger.info('配置保存成功');
    } catch (error: any) {
      logger.error({ error: error.message }, '配置保存失败');
      throw new Error(`配置保存失败: ${error.message}`);
    }
  }

  /**
   * 创建配置文件备份
   * @throws {Error} 当备份创建失败时抛出错误
   * @private
   */
  private async createBackup(): Promise<void> {
    try {
      const backupPath = this.configPath + '.backup';
      await copyFile(this.configPath, backupPath);
      logger.info({ backupPath }, '配置备份创建成功');
    } catch (error: any) {
      // 如果原文件不存在(ENOENT),不视为错误
      if (error.code === 'ENOENT') {
        logger.info('配置文件不存在,跳过备份');
        return;
      }
      logger.error({ error: error.message }, '配置备份创建失败');
      throw new Error(`配置备份创建失败: ${error.message}`);
    }
  }

  /**
   * 原子性重命名文件
   * 使用 fs.rename() 保证原子操作,符合 POSIX 标准的原子重命名
   * @param oldPath 原文件路径
   * @param newPath 新文件路径
   * @private
   */
  private async atomicRename(oldPath: string, newPath: string): Promise<void> {
    try {
      await rename(oldPath, newPath);
      logger.debug({ from: oldPath, to: newPath }, '原子重命名成功');
    } catch (error: any) {
      logger.error({ error: error.message, oldPath, newPath }, '原子重命名失败');
      throw new Error(`原子重命名失败: ${error.message}`);
    }
  }
}