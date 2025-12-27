/**
 * V8 字节码加载器 (Core)
 *
 * 这是 Core 包生产环境的入口文件，用于加载编译后的 V8 字节码 (.jsc)
 * 此文件是部署包中唯一保留为明文的 JavaScript 文件
 */

try {
  // 注册 bytenode 加载器
  require('bytenode');

  // 加载编译后的 app.jsc
  require('./app.jsc');
} catch (error) {
  console.error('[FATAL] Failed to load core application bytecode');
  console.error('Error details:', error);
  console.error('Possible causes:');
  console.error('1. Node.js version mismatch between build and runtime');
  console.error('2. Corrupted .jsc file');
  process.exit(1);
}
