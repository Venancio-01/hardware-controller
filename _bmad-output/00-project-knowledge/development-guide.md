# 开发指南 - 根部分

## 前置条件
- **运行时**: Node.js (>=22.0.0) 或 Bun (最新版)
- **语言**: TypeScript (v5.9.3)

## 安装

```bash
# 使用 npm
npm install

# 使用 bun（推荐）
bun install
```

## 环境设置
配置从 `.env` 加载。详情请参见 `.env.example`。

## 开发命令

| 命令 | 描述 |
| :--- | :--- |
| `npm run dev` | 启动开发服务器并监听文件变化（`tsx watch src/index.ts`） |
| `npm run build` | 使用 `tsup` 构建生产版本（输出：`dist/`） |
| `npm start` | 运行构建的生产应用程序 |
| `npm test` | 通过 `vitest` 运行单元测试 |
| `npm run test:watch` | 在监听模式下运行测试 |
| `npm run typecheck` | 运行 TypeScript 类型检查（`tsc --noEmit`） |
| `npm run clean` | 清理分发文件夹（`rm -rf dist`） |

## 测试
项目使用 **Vitest** 进行测试。
- 测试文件应命名为 `*.test.ts`。
- 测试位于 `test/` 目录或与源文件同目录。

## 部署
- **构建**: 运行 `npm run build` 生成 ES 模块输出。
- **运行**: 执行 `node -r dotenv/config dist/index.js` 或使用 PM2 等进程管理器。