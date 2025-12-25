# Story 1.3: 开发后端 API 骨架 (Backend Skeleton)

Status: review

## Story

As a 系统管理员,
I want 后端服务能够读取当前的 `config.json` 文件并提供 API,
So that 前端可以获取并显示当前的配置信息。

## Acceptance Criteria

**Given** `packages/backend` 已初始化且 `config.json` 存在
**When** 我启动后端服务并请求 `GET /api/config`
**Then** 应返回 HTTP 200 和正确的 JSON 配置数据
**And** 如果 `config.json` 不存在或格式错误,应返回适当的错误代码
**And** 后端应集成 Pino 日志记录请求
**And** 应实现 `ConfigService` 类来封装文件读取逻辑

## Tasks / Subtasks

- [x] 创建 Backend 包基础结构 (AC: #1)
  - [x] 创建 `packages/backend/src/` 目录结构
  - [x] 配置 `packages/backend/package.json` 依赖项
  - [x] 配置 `packages/backend/tsconfig.json` 继承根配置
  - [x] 配置 tsup 构建配置输出到 `dist/`

- [x] 实现 ConfigService 服务层 (AC: #4)
  - [x] 创建 `src/services/config.service.ts`
  - [x] 实现 `getConfig()` 方法读取 config.json
  - [x] 实现 Zod schema 验证 (使用 shared package)
  - [x] 实现错误处理 (文件不存在、JSON 解析失败、验证失败)
  - [x] 添加 JSDoc 注释和类型定义

- [x] 创建 Express HTTP 服务器 (AC: #1, #2)
  - [x] 安装 Express 和相关类型定义
  - [x] 创建 `src/server.ts` 初始化 Express 应用
  - [x] 配置 JSON body parser 中间件
  - [x] 配置 CORS (开发环境允许 localhost:5173)
  - [x] 配置错误处理中间件

- [x] 实现 GET /api/config 端点 (AC: #2)
  - [x] 创建 `src/routes/config.routes.ts`
  - [x] 实现 GET /api/config 路由处理器
  - [x] 调用 ConfigService.getConfig() 获取配置
  - [x] 返回标准 API 响应格式 (使用 shared schema)
  - [x] 处理异常情况并返回适当的 HTTP 状态码

- [x] 集成 Pino 日志系统 (AC: #3)
  - [x] 创建 `src/utils/logger.ts` 配置 Pino
  - [x] 使用 pino-http 中间件记录 HTTP 请求
  - [x] 在 ConfigService 中记录文件操作日志
  - [x] 配置开发环境使用 pino-pretty 格式化输出
  - [x] 配置生产环境使用 JSON 格式

- [x] 编写单元测试和集成测试
  - [x] 测试 ConfigService.getConfig() 成功读取配置 (7 个测试用例)
  - [x] 测试文件不存在时的错误处理
  - [x] 测试 JSON 格式错误时的错误处理
  - [x] 测试 Zod 验证失败时的错误处理
  - [x] 测试 GET /api/config 端点返回正确数据 (4 个集成测试)
  - [x] 测试 API 错误响应格式

- [x] 配置应用启动入口
  - [x] 创建 `src/index.ts` 作为应用入口
  - [x] 初始化日志系统
  - [x] 启动 HTTP 服务器
  - [x] 配置优雅关闭处理 (SIGINT, SIGTERM)
  - [x] 添加启动日志和配置摘要

## Dev Notes

### 项目上下文要点 (来自 project-context.md)

1. **TypeScript 配置**:
   - 使用严格模式,启用所有严格类型检查标志
   - 目标 ES2022,使用 ESNext 模块系统
   - 在导入中使用显式 `.js` 扩展名以兼容 Node.js
   - 对仅类型导入使用 `import type`

2. **错误处理模式**:
   - 使用 Zod 进行配置验证,采用快速失败原则
   - 为异步操作实现 try-catch 块和适当的错误日志记录
   - 为不同场景使用适当的日志级别 (error, warn, info)
   - 通过日志模块集中错误处理模式

3. **Pino 日志记录**:
   - 使用 Pino v10.1.0 进行结构化 JSON 日志记录
   - 开发时使用 pino-pretty 格式化
   - 记录所有 HTTP 请求和响应
   - 记录配置文件操作

4. **优雅关闭**:
   - 为 SIGINT 和 SIGTERM 信号实现优雅关闭处理程序
   - 在关闭期间正确关闭 HTTP 服务器
   - 记录关闭事件

### 架构合规性 (来自 architecture.md)

#### Express 服务器配置

根据架构决策,后端使用 **Express 5.x** (或最新稳定版本):

**依赖项**:
```json
{
  "dependencies": {
    "express": "^5.0.1",
    "pino": "^10.1.0",
    "pino-http": "^10.3.0",
    "zod": "^4.2.1",
    "shared": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "latest",
    "pino-pretty": "^13.0.0",
    "tsx": "latest",
    "tsup": "latest",
    "typescript": "5.9.3",
    "vitest": "latest"
  }
}
```

#### API 响应格式标准

根据架构文档 [API Design: REST + JSON](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L435-L520):

**成功响应**:
```typescript
{
  "success": true,
  "data": {
    "ipAddress": "192.168.1.100",
    "subnetMask": "255.255.255.0",
    "gateway": "192.168.1.1",
    "port": 8080,
    "deviceId": "device-001"
  }
}
```

**错误响应 (验证失败)**:
```typescript
{
  "success": false,
  "error": "配置验证失败",
  "validationErrors": {
    "ipAddress": "IP 地址格式无效"
  }
}
```

**错误响应 (服务器错误)**:
```typescript
{
  "success": false,
  "error": "服务器错误,请稍后重试"
}
```

#### ConfigService 设计模式

根据架构文档 [Data Access Pattern](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L394-L404):

```typescript
/**
 * 配置服务类 - 封装所有配置文件操作
 */
export class ConfigService {
  /**
   * 读取并解析 config.json 文件
   * @returns 验证后的配置对象
   * @throws {Error} 文件不存在、解析失败或验证失败时抛出错误
   */
  async getConfig(): Promise<Config> {
    // 1. 读取文件
    // 2. 解析 JSON
    // 3. 使用 Zod schema 验证
    // 4. 返回类型化的配置对象
  }

  /**
   * 验证配置数据 (不保存)
   * @param data 要验证的配置数据
   * @returns 验证结果
   */
  validateConfig(data: unknown): ValidationResult {
    // 使用 configSchema.safeParse() 进行验证
  }
}
```

#### 文件结构要求

根据架构文档 [Backend Package Structure](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L1394-L1420):

```
packages/backend/
├── src/
│   ├── services/
│   │   └── config.service.ts      # 配置服务层
│   ├── routes/
│   │   └── config.routes.ts       # 配置 API 路由
│   ├── utils/
│   │   └── logger.ts              # Pino 日志配置
│   ├── server.ts                  # Express 服务器初始化
│   └── index.ts                   # 应用入口点
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

#### HTTP 状态码标准

根据架构文档 [Error Handling Standards](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L499-L519):

- **200 OK**: 成功获取配置
- **400 Bad Request**: 配置验证失败
- **404 Not Found**: config.json 文件不存在
- **500 Internal Server Error**: 服务器内部错误 (文件读取失败、JSON 解析失败等)

### 前一个故事的经验 (Story 1.2)

从 Story 1.2 (Shared Validation) 中学到的关键经验:

1. **TDD 方法有效**: 先编写测试再实现功能,确保代码质量
2. **Shared Package 已就绪**: 可以直接导入 `configSchema` 等验证规则
3. **Workspace 引用**: 使用 `"shared": "workspace:*"` 依赖已验证可行
4. **测试覆盖重要**: Story 1.2 实现了 49 个测试,全部通过,为我们提供了可靠的验证基础

**可复用的模式**:
```typescript
// 从 shared 包导入 schema 和类型
import { configSchema, type Config } from 'shared';

// 使用 safeParse 进行验证
const result = configSchema.safeParse(data);
if (!result.success) {
  // 处理验证错误
}
```

### Git 历史分析

最近的提交显示:
- `fa38867`: 添加了手动取消报警功能
- `4cea33b`: 更新项目结构,删除过期档案并集成 BMM 框架
- `fd47493`: 优化继电器状态检测逻辑

这表明项目已经有成熟的硬件通信和状态管理代码,我们需要确保新的 HTTP API 层不会干扰现有的 XState 状态机和硬件通信模块。

### 技术实现要点

#### 1. Config.json 文件位置

根据项目惯例,配置文件应该在项目根目录:
```
/home/qingshan/workspace/front-end/node-switch/config.json
```

如果文件不存在,可以创建一个示例配置文件用于测试。

#### 2. Pino Logger 配置

```typescript
// src/utils/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});
```

#### 3. Express 服务器初始化

```typescript
// src/server.ts
import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import configRoutes from './routes/config.routes.js';

export function createServer() {
  const app = express();

  // 中间件
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  // 开发环境 CORS 配置
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  // 路由
  app.use('/api/config', configRoutes);

  // 错误处理
  app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).json({
      success: false,
      error: '服务器错误,请稍后重试'
    });
  });

  return app;
}
```

#### 4. ConfigService 实现示例

```typescript
// src/services/config.service.ts
import { readFile } from 'fs/promises';
import { join } from 'path';
import { configSchema, type Config } from 'shared';
import { logger } from '../utils/logger.js';

export class ConfigService {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'config.json');
  }

  /**
   * 读取并验证配置文件
   */
  async getConfig(): Promise<Config> {
    try {
      // 读取文件
      const fileContent = await readFile(this.configPath, 'utf-8');
      logger.info({ path: this.configPath }, '读取配置文件');

      // 解析 JSON
      const rawData = JSON.parse(fileContent);

      // Zod 验证
      const result = configSchema.safeParse(rawData);
      if (!result.success) {
        logger.error({ errors: result.error.issues }, '配置验证失败');
        throw new Error('配置文件格式无效');
      }

      logger.info('配置文件验证通过');
      return result.data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.error({ path: this.configPath }, '配置文件不存在');
        throw new Error('配置文件不存在');
      }
      throw error;
    }
  }
}
```

#### 5. 路由处理器实现

```typescript
// src/routes/config.routes.ts
import { Router } from 'express';
import { ConfigService } from '../services/config.service.js';

const router = Router();
const configService = new ConfigService();

router.get('/', async (req, res, next) => {
  try {
    const config = await configService.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    if (error.message === '配置文件不存在') {
      return res.status(404).json({
        success: false,
        error: '配置文件不存在'
      });
    }
    if (error.message === '配置文件格式无效') {
      return res.status(400).json({
        success: false,
        error: '配置文件格式无效'
      });
    }
    next(error);
  }
});

export default router;
```

### 测试策略

根据项目上下文,使用 **vitest** 编写测试:

**单元测试** (`src/services/__tests__/config.service.test.ts`):
- 测试成功读取有效配置文件
- 测试文件不存在时抛出错误
- 测试 JSON 格式错误时抛出错误
- 测试配置验证失败时抛出错误

**集成测试** (`src/routes/__tests__/config.routes.test.ts`):
- 测试 GET /api/config 返回 200 和正确数据
- 测试文件不存在时返回 404
- 测试验证失败时返回 400
- 测试服务器错误时返回 500

**Mock 策略**:
- Mock `fs/promises` 模拟文件系统操作
- 使用 vitest 的 `vi.mock()` 创建 mock
- 为不同测试场景准备不同的 mock 数据

### 构建和运行

**开发模式**:
```bash
# 在 packages/backend 目录
pnpm dev  # 使用 tsx watch 运行,支持热重载
```

**构建**:
```bash
pnpm build  # 使用 tsup 构建到 dist/
```

**运行生产版本**:
```bash
pnpm start  # 运行 dist/index.js
```

### 成功标准

- ✅ ConfigService 能够成功读取 config.json
- ✅ ConfigService 使用 Zod schema 验证配置
- ✅ GET /api/config 返回正确的 JSON 响应
- ✅ 错误情况返回适当的 HTTP 状态码
- ✅ Pino 日志记录所有请求和操作
- ✅ 所有单元测试和集成测试通过
- ✅ 构建成功生成 dist/ 输出

### 参考资料

- [Architecture: API Design](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L435-L520) - API 端点和响应格式
- [Architecture: Data Access Pattern](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L394-L404) - ConfigService 设计模式
- [Architecture: Backend Package Structure](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L1394-L1420) - 文件组织结构
- [Project Context: Error Handling](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/00-project-knowledge/project-context.md#L43-L47) - 错误处理模式
- [Story 1.2: Shared Validation](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/04-implementation/1-2-shared-validation.md) - 共享验证 schema 的使用

### Project Structure Notes

此故事将创建以下文件结构:

```
packages/backend/
├── src/
│   ├── services/
│   │   ├── config.service.ts
│   │   └── __tests__/
│   │       └── config.service.test.ts
│   ├── routes/
│   │   ├── config.routes.ts
│   │   └── __tests__/
│   │       └── config.routes.test.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── server.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

这与架构文档中定义的结构完全一致,遵循了项目上下文中的文件组织规则。

### 前置依赖

⚠️ **重要**: 此故事依赖于:
1. **Story 1.1 (Monorepo Setup)**: pnpm workspace 已配置
2. **Story 1.2 (Shared Validation)**: shared package 已构建并可用

如果前置故事未完成,需要先完成它们。

### 后续故事

此故事完成后,将为以下故事奠定基础:
- **Story 1.4 (Frontend Dashboard)**: 前端可以调用 GET /api/config 获取配置
- **Story 2.2 (Config Update API)**: 在同一个 Express 服务器上添加 PUT /api/config 端点

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash Experimental (gemini-2.0-flash-thinking-exp-1219)

### Debug Log References

N/A - 所有测试通过，未遇到需要调试的阻塞问题

### Completion Notes List

#### 实现概要

✅ **成功实现后端 API 骨架**，所有验收标准已满足：

- ConfigService 类已实现，封装配置文件读取和 Zod 验证
- Express 服务器配置完成，包含 Pino 日志、CORS 和错误处理中间件
- GET /api/config 端点正常工作，返回正确的 JSON 响应
- 单元测试和集成测试全部通过 (11/11 测试)
- 优雅关闭处理已实现

#### 测试结果

- **ConfigService 单元测试**: 7/7 通过
- **路由集成测试**: 4/4 通过
- **手动 API 测试**: ✅ 成功
  - `GET /health` 返回 200 OK
  - `GET /api/config` (文件不存在) 返回 404
  - `GET /api/config` (文件存在) 返回 200 和正确配置

#### 技术实现细节

1. **TDD 方法**: 严格遵循红-绿-重构循环
2. **模块化设计**: 分离关注点 (services, routes, utils)
3. **类型安全**: 使用 TypeScript 严格模式和 Zod 验证
4. **日志系统**: Pino 结构化日志，开发环境美化输出
5. **错误处理**: 适当的 HTTP 状态码和错误消息

#### 已知问题与解决方案

**问题**: tsx 开发模式下 shared 包模块解析失败

**原因**: tsx 在运行时无法正确解析 workspace 依赖的导出

**解决方案**: 使用构建后的代码运行 (`pnpm build && node dist/index.js`)

**影响**: 仅影响开发热重载，不影响测试和生产构建

#### 架构合规性

✅ 完全符合架构文档要求：
- API 响应格式标准 (success/error 结构)
- HTTP 状态码规范 (200, 400, 404, 500)
- 文件结构符合规划
- ConfigService 设计模式正确

### File List

#### 新建文件

- `packages/backend/src/services/config.service.ts` - 配置服务核心逻辑
- `packages/backend/src/services/__tests__/config.service.test.ts` - ConfigService 单元测试
- `packages/backend/src/routes/config.routes.ts` - Config API 路由
- `packages/backend/src/routes/__tests__/config.routes.test.ts` - 路由集成测试
- `packages/backend/src/utils/logger.ts` - Pino 日志配置
- `packages/backend/src/server.ts` - Express 服务器配置
- `packages/backend/tsup.config.ts` - tsup 构建配置
- `packages/backend/vitest.config.ts` - vitest 测试配置
- `config.json` - 示例配置文件

#### 修改文件

- `packages/backend/package.json` - 添加 pino-http 依赖
- `packages/backend/src/index.ts` - 重构为使用模块化服务器和日志
- `packages/backend/tsconfig.json` - 更新 shared 包路径解析
- `packages/shared/package.json` - 添加 src 子路径导出
- `_bmad-output/04-implementation/sprint-status.yaml` - 更新故事状态为 in-progress

### Change Log

- **2025-12-25**: 完成后端 API 骨架实现
  - 实现 ConfigService 和 GET /api/config 端点
  - 集成 Pino 日志系统
  - 编写 11 个测试用例，全部通过
  - 验证 API 端点正常工作
