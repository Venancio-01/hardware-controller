/**
 * JavaScript Obfuscator 配置文件
 *
 * 用于前端代码的深度混淆，在 Vite 的 terser 压缩之后应用
 * 仅在 Docker 构建阶段使用
 *
 * 配置参考: https://github.com/javascript-obfuscator/javascript-obfuscator
 */
module.exports = {
  // 基本压缩
  compact: true,

  // 控制流平坦化 - 使代码逻辑难以跟踪
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,

  // 死代码注入 - 增加虚假代码
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,

  // 字符串数组 - 将字符串提取到数组并编码
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,

  // 标识符重命名
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // 不重命名全局变量以避免破坏外部依赖

  // 不推荐的选项（性能影响太大）
  // selfDefending: true,  // 会显著增加代码体积和执行时间
  // debugProtection: true, // 阻止 DevTools 调试

  // 保持兼容性
  unicodeEscapeSequence: false, // 避免 Unicode 转义增加大小
  splitStrings: false, // 避免字符串分割增加开销

  // 目标环境
  target: 'browser',

  // 排除某些代码（如需要）
  // reservedNames: ['someGlobalFunction'],
  // reservedStrings: ['some-important-string'],
};
