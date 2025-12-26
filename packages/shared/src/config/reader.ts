/**
 * 配置读取器
 *
 * 供 core 包使用的只读配置读取器，同步读取配置文件，启动时一次性加载。
 * 开发和生产环境都使用同一个 config.json 文件。
 */

import JSON5 from 'json5';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { configSchema } from '../schemas/config.schema.js';
import type { Config } from '../types/config.types.js';

/**
 * 查找项目根目录
 *
 * 从当前目录向上遍历，查找包含 pnpm-workspace.yaml 或 .git 目录的目录。
 * 这是 monorepo 项目根目录的标识。
 *
 * @returns 项目根目录路径
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const root = resolve('/');

  while (currentDir !== root) {
    // 检查是否是项目根目录（包含 pnpm-workspace.yaml 或 .git）
    if (
      existsSync(join(currentDir, 'pnpm-workspace.yaml')) ||
      (existsSync(join(currentDir, '.git')) && existsSync(join(currentDir, 'package.json')))
    ) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  // 如果找不到项目根目录，返回当前工作目录
  return process.cwd();
}

/**
 * 配置读取器类
 *
 * 供 core 包使用，提供只读访问配置的能力。
 * 在构造时同步读取配置文件。开发和生产环境都使用统一的 config.json。
 */
export class ConfigReader {
  private config: Config;
  private configPath: string;

  /**
   * 创建 ConfigReader 实例
   * @param configPath 可选的配置文件路径。如果不提供，将查找项目根目录的 config.json
   */
  constructor(configPath?: string) {
    if (configPath) {
      this.configPath = configPath;
    } else {
      // 在项目根目录查找 config.json
      const projectRoot = findProjectRoot();
      this.configPath = join(projectRoot, 'config.json5');
    }
    this.config = this.loadSync(this.configPath);
  }

  /**
   * 同步加载并验证配置文件
   * @param path 配置文件路径
   * @returns 验证后的配置对象
   * @throws {Error} 文件不存在或验证失败时抛出错误
   */
  private loadSync(path: string): Config {
    try {
      const content = readFileSync(path, 'utf-8');
      const data = JSON5.parse(content);
      return configSchema.parse(data);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`配置文件不存在: ${path}`);
      }
      throw error;
    }
  }

  /**
   * 获取当前加载的配置文件路径
   * @returns 配置文件绝对路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 获取指定配置项的值
   * @param key 配置项键名
   * @returns 配置项的值
   */
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * 获取所有配置
   * @returns 完整配置对象的副本
   */
  getAll(): Config {
    return { ...this.config };
  }
}

/**
 * 创建 ConfigReader 实例的工厂函数
 *
 * @param configPath 可选的配置文件路径
 * @returns ConfigReader 实例
 */
export function createConfigReader(configPath?: string): ConfigReader {
  return new ConfigReader(configPath);
}

/**
 * 导出项目根目录查找函数（供调试使用）
 */
export { findProjectRoot };

