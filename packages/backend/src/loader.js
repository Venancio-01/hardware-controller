/**
 * V8 字节码加载器
 *
 * 这是生产环境的入口文件，用于加载编译后的 V8 字节码 (.jsc)
 * 此文件是部署包中唯一保留为明文的 JavaScript 文件
 *
 * 工作原理:
 * 1. bytenode 注册 .jsc 文件的加载器
 * 2. require('./index.jsc') 加载编译后的字节码
 * 3. V8 引擎直接执行字节码，无需解析源码
 */

try {
  // 注册 bytenode 加载器
  require('bytenode');

  // 加载编译后的主入口点
  require('./index.jsc');
} catch (error) {
  console.error('[FATAL] Failed to load backend application bytecode');
  console.error('Error details:', error);
  console.error('Possible causes:');
  console.error('1. Node.js version mismatch between build and runtime');
  console.error('2. Corrupted .jsc file');
  console.error('3. Missing dependencies');
  process.exit(1);
}
