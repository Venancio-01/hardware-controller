/**
 * Shared 包 Node.js 专用导出
 *
 * 这个入口点包含仅在 Node.js 环境中可用的功能，
 * 例如使用 node:fs 模块的 ConfigReader。
 *
 * 使用方式：
 * import { createConfigReader, ConfigReader } from 'shared/node';
 */

export {
  createConfigReader,
  ConfigReader,
  findProjectRoot,
} from './config/reader.js';
