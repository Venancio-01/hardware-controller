/**
 * 配置服务类
 *
 * 封装所有配置文件操作，包括读取、解析和验证 config.json
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { configSchema, type Config } from 'shared';

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
    this.configPath = configPath || join(process.cwd(), 'config.json');
  }

  /**
   * 读取并解析 config.json 文件
   * @returns 验证后的配置对象
   * @throws {Error} 文件不存在、解析失败或验证失败时抛出错误
   */
  async getConfig(): Promise<Config> {
    try {
      // 1. 读取文件
      const fileContent = await readFile(this.configPath, 'utf-8');

      // 2. 解析 JSON
      const rawData = JSON.parse(fileContent);

      // 3. 使用 Zod schema 验证
      const result = configSchema.safeParse(rawData);
      if (!result.success) {
        throw new Error('配置文件格式无效');
      }

      // 4. 返回类型化的配置对象
      return result.data;
    } catch (error: any) {
      // 处理文件不存在错误
      if (error.code === 'ENOENT') {
        throw new Error('配置文件不存在');
      }

      // 重新抛出其他错误
      throw error;
    }
  }
}
