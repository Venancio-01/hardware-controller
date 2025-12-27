# Tech-Spec: 修复 Backend ES Module __dirname 问题

**创建日期:** 2025-12-27
**状态:** 待实施

## 概述

### 问题陈述

Backend 服务启动失败，报错 `ReferenceError: __dirname is not defined in ES module scope`。

这是因为项目配置为 ES Module 模式（`package.json` 中 `type: "module"`），而 `__dirname` 是 CommonJS 的全局变量，在 ES Module 中不可用。

### 解决方案

在 `packages/backend/src/index.ts` 中添加 ES Module 兼容的 `__dirname` polyfill：
- 使用 `import.meta.url` 获取当前模块的文件 URL
- 使用 `fileURLToPath` 转换为文件路径
- 使用 `path.dirname` 获取目录路径

### 范围

| 包含 | 不包含 |
|------|--------|
| 修复 `index.ts` 中的 `__dirname` 使用 | 其他模块（已确认无其他使用） |
| 验证开发模式启动 | 修改 ES Module 配置 |
| 验证生产模式构建 | - |

## 开发上下文

### 代码库模式

- **模块系统:** ES Module (`"type": "module"`)
- **TypeScript 配置:** target ES2022, module ESNext
- **路径解析:** 相对路径从 `packages/backend/src/` 开始
- **导入风格:** ES imports (`.js` 扩展名在 `import` 中必须)

### 需要引用的文件

```
packages/backend/src/index.ts       # 需要修改的文件
packages/backend/package.json       # 验证 type: "module" 配置
packages/core/src/app.ts            # 开发模式 Core 入口
packages/core/dist/app.js           # 生产模式 Core 入口（构建后）
```

### 技术决策

1. **为什么不用 CommonJS:** 项目已全面采用 ES Module，不应回退
2. **为什么添加 polyfill 而非硬编码路径:** 保持路径解析的灵活性
3. **为什么在文件顶部添加导入:** 确保在 `__dirname` 使用前完成 polyfill 定义

## 实施计划

### 任务

- [ ] **任务 1:** 添加 ES Module `__dirname` polyfill 导入
  - 在 `index.ts` 顶部添加 `fileURLToPath` 和 `dirname` 导入
  - 定义 `__filename` 和 `__dirname` 常量
- [ ] **任务 2:** 验证修复
  - 运行 `npm run dev` 确认开发模式正常启动
  - 运行 `npm run build && npm start` 确认生产模式正常启动

### 验收标准

- [ ] **AC1:** 开发模式下 `npm run dev` 成功启动，无 `__dirname` 错误
- [ ] **AC2:** 生产模式构建后 `npm start` 正常启动
- [ ] **AC3:** Core 进程能正确启动（日志显示 "正在启动 Core 进程" 路径正确）
- [ ] **AC4:** 代码通过 `npm run lint` 检查

## 附加上下文

### 依赖项

- Node.js >= 22.0.0
- tsx >= 4.21.0 (开发模式)
- 现有 `import * as path from 'path'` 已存在

### 测试策略

1. **手动测试:** 启动服务，观察日志中的 Core 进程路径是否正确
2. **集成测试:** 无需新增，现有测试应继续通过
3. **回归测试:** 确保 Core Process Manager 功能正常

### 实施代码参考

```typescript
// packages/backend/src/index.ts 顶部添加
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// ES Module __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 现有导入...
import express from 'express';
// ...
```

### 注意事项

- `node:` 前缀是 Node.js 内置模块推荐写法
- 确保 polyfill 定义在任何使用 `__dirname` 的代码之前
- 修改位置应在文件开头，所有其他导入之前或紧随其后
