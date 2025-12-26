# Tech-Spec: 统一配置文件重构

**Created:** 2025-12-26
**Status:** Ready for Development

## Overview

### Problem Statement

项目当前存在两套互不兼容的配置系统：

1. **环境变量系统**（`packages/core/src/config/index.ts`）
   - 读取 `.env` / `.env.local` 文件
   - 包含 60+ 配置项（硬件通信、串口、语音播报、输入索引、继电器索引等）
   - 使用 `dotenv` 加载 + `zod` 验证
   - 被 core 包的 5 个模块导入使用

2. **JSON 文件系统**（`packages/backend/src/services/config.service.ts`）
   - 读取 `config.json` 文件
   - 仅包含 4 个字段（deviceId, timeout, retryCount, pollingInterval）
   - 使用 `shared` 包的 schema 验证
   - 仅 backend 包使用

**问题**：
- 配置分散，维护困难
- shared 包已定义 `envConfigSchema` 但 core 并未使用
- 存在两份重复的 `config.json`（根目录和 backend 目录）
- 环境变量需要重启才能生效

### Solution

将所有配置统一到**项目根目录的 `config.{env}.json` 文件**，支持多环境：

1. **多环境配置文件**：
   - `config.development.json` - 开发环境
   - `config.production.json` - 生产环境
2. **环境切换**：通过 `NODE_ENV` 环境变量决定加载哪个配置文件
3. Core 包**只读取**配置
4. Backend 包**读取并修改**配置
5. 使用 `shared` 包作为唯一的配置 schema 和类型来源

### Scope

**In Scope:**
- [x] 支持开发/生产多环境配置（`config.development.json` / `config.production.json`）
- [x] 统一 `shared/src/schemas/config.schema.ts` 为完整配置 schema
- [x] 创建 `shared/src/config/reader.ts` 供 core 包使用
- [x] 重构 `packages/core/src/config/index.ts` 使用 JSON 读取
- [x] 更新 `packages/backend/src/services/config.service.ts` 使用根目录配置
- [x] 创建完整的 `config.json` 示例文件
- [x] 删除过时的 `.env.example` 和重复的 `config.json`

**Out of Scope:**
- 配置热重载（运行时自动刷新）
- 配置加密
- Staging 环境支持（仅支持 development/production）

---

## Context for Development

### Codebase Patterns

- **Zod Schema**: 项目使用 `zod` 进行配置验证，所有 schema 定义在 `shared/src/schemas/`
- **文件操作**: 使用 Node.js `fs/promises` API（async/await）
- **测试**: 使用 `vitest`，mock 文件系统操作
- **导出**: 使用 ESM（`.js` 后缀导入）

### Files to Reference

| 文件 | 用途 |
|-----|------|
| [config.schema.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/shared/src/schemas/config.schema.ts) | 完整配置 schema（envConfigSchema + appConfigSchema） |
| [config.service.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/backend/src/services/config.service.ts) | Backend 配置服务（需更新路径） |
| [index.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/config/index.ts) | Core 配置（需完全重写） |
| [config.service.test.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/backend/src/services/__tests__/config.service.test.ts) | 现有测试参考 |

### Technical Decisions

1. **配置文件位置**: 项目根目录
   - `config.development.json` - 开发环境
   - `config.production.json` - 生产环境
2. **环境选择**: 通过 `NODE_ENV` 环境变量决定，默认 `development`
3. **Schema 复用**: `shared` 包提供唯一 schema，core 和 backend 都依赖它
4. **读写分离**: 创建只读的 `ConfigReader`（for core）和读写的 `ConfigService`（for backend）
5. **同步读取**: core 包使用 `fs.readFileSync`（启动时一次性加载），避免异步复杂性

---

## Implementation Plan

### Tasks

---

#### [MODIFY] [config.schema.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/shared/src/schemas/config.schema.ts)

- 保持现有 `envConfigSchema` 和 `appConfigSchema`
- 添加明确的 JSDoc 注释说明这是完整配置 schema
- 确保所有字段都有合理的默认值

---

#### [NEW] [reader.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/shared/src/config/reader.ts)

创建只读配置读取器供 core 包使用：

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { configSchema, type Config } from '../schemas/config.schema.js';

/**
 * 配置读取器 - 供 core 包使用
 * 同步读取配置文件，启动时一次性加载
 * 根据 NODE_ENV 环境变量选择配置文件
 */
export class ConfigReader {
  private config: Config;
  private configPath: string;

  constructor(configPath?: string) {
    if (configPath) {
      this.configPath = configPath;
    } else {
      // 根据 NODE_ENV 选择配置文件
      const env = process.env.NODE_ENV || 'development';
      this.configPath = join(process.cwd(), `config.${env}.json`);
    }
    this.config = this.loadSync(this.configPath);
  }

  private loadSync(path: string): Config {
    try {
      const content = readFileSync(path, 'utf-8');
      const data = JSON.parse(content);
      return configSchema.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`配置文件不存在: ${path}`);
      }
      throw error;
    }
  }

  /** 获取当前加载的配置文件路径 */
  getConfigPath(): string {
    return this.configPath;
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  getAll(): Config {
    return { ...this.config };
  }
}

// 导出单例供直接使用
export const configReader = new ConfigReader();
```

---

#### [MODIFY] [index.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/shared/src/index.ts)

- 添加导出 `ConfigReader` 和 `configReader`

---

#### [MODIFY] [index.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/config/index.ts)

完全重写，从环境变量迁移到 JSON 配置：

```typescript
import { configReader, type Config } from 'shared';

// 导出配置对象（保持向后兼容的 API）
export const config = configReader.getAll();

// 保留现有导出函数
export function isConfigLoaded(): boolean { ... }
export function getConfigSummary(): Record<string, unknown> { ... }
```

**关键变更**：
- 删除 `dotenv` 导入和 `.env` 加载逻辑
- 删除 `envSchema` 定义（使用 shared 包的）
- 删除 `validateEnv` 函数
- 保持 `config` 导出的结构不变，确保下游模块无需修改

---

#### [MODIFY] [config.service.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/backend/src/services/config.service.ts)

- 根据 `NODE_ENV` 选择配置文件路径
- 保持现有 API（getConfig, updateConfig）

```typescript
constructor(configPath?: string) {
  if (configPath) {
    this.configPath = configPath;
  } else {
    const env = process.env.NODE_ENV || 'development';
    // 从 packages/backend 向上两级到项目根目录
    this.configPath = join(process.cwd(), '..', '..', `config.${env}.json`);
  }
}
```

---

#### [NEW] 多环境配置文件

##### [config.development.json](file:///home/qingshan/workspace/front-end/node-switch/config.development.json)

开发环境配置：

```json
{
  "deviceId": "device-dev-001",
  "timeout": 5000,
  "retryCount": 3,
  "pollingInterval": 5000,

  "NODE_ENV": "development",
  "PORT": 3000,
  "HOST": "127.0.0.1",

  "LOG_LEVEL": "info",
  "LOG_PRETTY": true,

  "CABINET_HOST": "192.168.1.101",
  "CABINET_PORT": 50000,

  "CONTROL_SERIAL_PATH": "/dev/ttyUSB0",
  "CONTROL_SERIAL_BAUDRATE": 9600
  // ... 其他配置项
}
```

##### [config.production.json](file:///home/qingshan/workspace/front-end/node-switch/config.production.json)

生产环境配置（调整超时、重试次数、日志级别等）：

```json
{
  "deviceId": "device-prod-001",
  "timeout": 10000,
  "retryCount": 5,
  "pollingInterval": 3000,

  "NODE_ENV": "production",
  "PORT": 8080,
  "HOST": "0.0.0.0",

  "LOG_LEVEL": "warn",
  "LOG_PRETTY": false,

  "CABINET_HOST": "192.168.1.101",
  "CABINET_PORT": 50000,

  "CONTROL_SERIAL_PATH": "/dev/ttyUSB0",
  "CONTROL_SERIAL_BAUDRATE": 9600
  // ... 其他配置项
}
```

---

#### [DELETE] 清理文件

- `packages/backend/config.json` - 重复的配置文件
- `config.json`（根目录旧文件）- 替换为环境特定文件
- `.env.example` - 已迁移到 config.*.json
- `packages/core/.env.example` - 如果存在

---

### Acceptance Criteria

- [ ] AC 1: 设置 `NODE_ENV=development` 时，加载 `config.development.json`
- [ ] AC 2: 设置 `NODE_ENV=production` 时，加载 `config.production.json`
- [ ] AC 3: 未设置 `NODE_ENV` 时，默认加载 `config.development.json`
- [ ] AC 4: Core 包能正确读取对应环境配置
- [ ] AC 5: Backend 包能读取和修改对应环境配置
- [ ] AC 6: 所有现有测试通过（`pnpm test`）
- [ ] AC 7: 配置验证失败时提供清晰的错误信息

---

## Additional Context

### Dependencies

- `shared` 包需要先构建，core 和 backend 依赖它
- 需要更新 `packages/core/package.json` 添加对 `shared` 包的依赖

### Testing Strategy

#### 自动化测试

1. **运行现有测试**（验证不破坏现有功能）：
   ```bash
   pnpm test
   ```

2. **运行特定配置相关测试**：
   ```bash
   pnpm --filter shared test src/schemas/__tests__/config.schema.test.ts
   pnpm --filter backend test src/services/__tests__/config.service.test.ts
   pnpm --filter backend test src/routes/__tests__/config.routes.test.ts
   pnpm --filter core test __tests__/config-validation.test.ts
   ```

3. **新增测试**：
   - `packages/shared/src/config/__tests__/reader.test.ts` - 测试 ConfigReader

#### 手动验证

1. 启动 backend 服务验证配置读取：
   ```bash
   cd packages/backend && pnpm dev
   # 访问 http://localhost:3000/api/config 查看配置
   ```

2. 验证配置更新：
   ```bash
   curl -X PUT http://localhost:3000/api/config -d '{"timeout": 6000}'
   # 检查 config.json 是否更新
   ```

### Notes

- 迁移后 `config` 对象的属性命名保持不变（如 `CABINET_HOST` 而非 `cabinetHost`），以减少下游代码改动
- 如果后续需要热重载，可以考虑使用 `chokidar` 监听文件变化
