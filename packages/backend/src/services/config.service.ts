/**
 * 配置服务类
 *
 * 封装所有配置文件操作，包括读取、解析和验证 config.json
 */

import { readFile, writeFile, copyFile, rename, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import JSON5 from 'json5';
import { configSchema, type Config, createModuleLogger } from 'shared';

const logger = createModuleLogger('ConfigService');

const createDefaultConfig = (): Config => configSchema.parse({
  deviceId: 'device-001',
  timeout: 5000,
  retryCount: 3,
  pollingInterval: 5000,
});

/**
 * 配置服务类 - 封装所有配置文件操作
 */
export class ConfigService {
  private configPath: string;

  /**
   * 创建 ConfigService 实例
   * @param configPath 配置文件路径（可选，默认为项目根目录的 config.json）
   */
  constructor(configPath?: string) {
    if (configPath) {
      this.configPath = configPath;
    } else if (process.env.CONFIG_PATH) {
      this.configPath = process.env.CONFIG_PATH;
    } else {
      // 默认假设运行在 packages/backend 或类似深度，尝试向上查找
      // 生产环境通常会设置 CONFIG_PATH 环境变量
      this.configPath = resolve(process.cwd(), '..', '..', 'config.json5');
    }
  }

  /**
   * 读取并解析 config.json 文件
   * @returns 验证后的配置对象
   * @throws {Error} 文件不存在、解析失败或验证失败时抛出错误
   */
  async getConfig(): Promise<Config> {
    const defaultConfig = createDefaultConfig();

    try {
      // 1. 读取文件
      const fileContent = await readFile(this.configPath, 'utf-8');
      logger.info('读取配置文件', { path: this.configPath });

      // 2. 解析 JSON
      const rawData = JSON5.parse(fileContent);

      // 3. 合并默认配置后使用 Zod schema 验证
      const mergedConfig = { ...defaultConfig, ...rawData };
      const result = configSchema.safeParse(mergedConfig);
      if (!result.success) {
        logger.error('配置验证失败', { errors: result.error.issues });
        throw result.error;
      }

      // 4. 返回类型化的配置对象
      return result.data;
    } catch (error: any) {
      // 处理文件不存在错误
      if (error.code === 'ENOENT') {
        logger.warn('配置文件不存在，使用默认配置', { path: this.configPath });
        return defaultConfig;
      }

      // 重新抛出其他错误
      throw error;
    }
  }

  /**
   * 更新配置文件
   * @param newConfig 新的配置对象
   * @throws {Error} 验证失败或写入失败时抛出错误
   */
  async updateConfig(newConfig: Config): Promise<void> {
    // 1. 验证数据
    const result = configSchema.safeParse(newConfig);
    if (!result.success) {
      logger.error('更新配置验证失败', { errors: result.error.issues });
      throw result.error;
    }

    const validatedConfig = result.data;
    const tempPath = this.configPath + '.tmp';

    try {
      // 2. 检查是否存在并备份
      await this.ensureBackup();

      // 3. 原子写入 (Write Temp -> Rename)
      const content = JSON.stringify(validatedConfig, null, 2);

      logger.info('开始写入新配置', { path: this.configPath });
      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, this.configPath);
      logger.info('配置更新成功');
    } catch (error: any) {
      logger.error('配置更新失败', { error: error.message });
      throw new Error(`配置更新失败: ${error.message}`);
    } finally {
      // 清理临时文件 (如果存在)
      try {
        await unlink(tempPath);
      } catch (error: any) {
        // 忽略文件不存在错误 (ENOENT)，说明 rename 成功或从未写入
        if (error.code !== 'ENOENT') {
          logger.warn('清理临时文件失败', { error: error.message, path: tempPath });
        }
      }
    }
  }

  /**
   * 如果配置文件存在，创建备份
   */
  private async ensureBackup(): Promise<void> {
    try {
      // 检查文件是否存在
      await readFile(this.configPath);

      // 创建备份
      const backupPath = this.configPath.replace('.json', '.backup.json');
      logger.info('创建配置备份', { from: this.configPath, to: backupPath });
      await copyFile(this.configPath, backupPath);
    } catch (error: any) {
      // 如果文件不存在 (ENOENT)，则不需要备份，直接返回
      if (error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}
