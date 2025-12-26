# Story 1.2: 建立共享验证架构 (Shared Validation)

Status: review

## Story

As a 开发人员,
I want 定义共享的 Zod 验证 schemas,
So that 前端表单和后端 API 可以使用同一套规则验证配置数据,保证数据一致性。

## Acceptance Criteria

**Given** 已初始化的 `packages/shared` 目录
**When** 我在 `src/schemas/config.schema.ts` 中定义 Zod schema
**Then** Schema 应包含 IP 地址、子网掩码、网关、端口等字段的验证规则
**And** 应该导出 TypeScript 类型定义 `Config`
**And** 前端和后端包都应该能够导入并使用这些 schemas
**And** 单元测试应验证 schema 能正确识别有效和无效数据

## Tasks / Subtasks

- [x] 创建 packages/shared 包结构 (AC: #1)
  - [x] 创建 `packages/shared/package.json` 配置文件
  - [x] 创建 `packages/shared/tsconfig.json` TypeScript 配置
  - [x] 创建 `packages/shared/src/` 源代码目录
  - [x] 配置 tsup 构建工具输出 ESM 格式到 `dist/`

- [x] 定义配置验证 schemas (AC: #1, #2)
  - [x] 在 `src/schemas/config.schema.ts` 中定义完整配置 schema
  - [x] 在 `src/schemas/network.schema.ts` 中定义网络配置 schema (IP、子网掩码、网关、DNS)
  - [x] 在 `src/schemas/device.schema.ts` 中定义设备状态 schema
  - [x] 在 `src/schemas/api-response.schema.ts` 中定义 API 响应包装 schema
  - [x] 使用 Zod 的 refine() 添加自定义验证规则 (网关子网一致性验证)

- [x] 导出 TypeScript 类型定义 (AC: #2)
  - [x] 在 `src/types/config.types.ts` 中使用 `z.infer<>` 导出 `Config` 类型
  - [x] 在 `src/types/api.types.ts` 中导出 API 相关类型
  - [x] 在 `src/types/device.types.ts` 中导出设备状态类型
  - [x] 在 `src/types/network.types.ts` 中导出网络配置类型
  - [x] 在 `src/index.ts` 中重导出所有 schemas 和类型

- [x] 编写单元测试 (AC: #4)
  - [x] 创建 `src/schemas/__tests__/config.schema.test.ts` (7个测试)
  - [x] 创建 `src/schemas/__tests__/network.schema.test.ts` (14个测试)
  - [x] 创建 `src/schemas/__tests__/device.schema.test.ts` (11个测试)
  - [x] 创建 `src/schemas/__tests__/api-response.schema.test.ts` (10个测试)
  - [x] 测试有效配置数据通过验证
  - [x] 测试无效 IP 地址格式被拒绝
  - [x] 测试端口号范围验证 (1-65535)
  - [x] 测试网关与子网一致性验证
  - [x] 测试必填字段缺失时的错误处理
  - [x] 所有测试通过 (49个测试全部通过)

- [x] 配置跨包引用 (AC: #3)
  - [x] 构建 shared 包: `pnpm --filter shared build` (成功输出 dist/index.mjs, dist/index.js, dist/index.d.ts)
  - [x] 在 backend 的 package.json 中添加依赖: `"shared": "workspace:*"` (已存在)
  - [x] 在 frontend 的 package.json 中添加依赖: `"shared": "workspace:*"` (已存在)
  - [x] 验证 backend 可以导入: `import { configSchema } from 'shared'` (✅ 验证通过)
  - [x] 验证 frontend 可以导入: `import { configSchema } from 'shared'` (✅ 验证通过)

- [x] Review Follow-ups (AI)
  - [x] [AI-Review][CRITICAL] `configSchema` 整合失败：`appConfigSchema.intersection` 报错不是函数。应改用 `.merge()`。 [packages/shared/src/schemas/config.schema.ts:54]
  - [x] [AI-Review][CRITICAL] `deviceStatusSchema` 验证失败：代码中新增了必填项 `uptime` 但测试数据中未包含。 [packages/shared/src/schemas/device.schema.ts]
  - [x] [AI-Review][MEDIUM] 更新 `device.schema.test.ts` 以在所有测试用例中包含 `uptime` 字段。 [packages/shared/src/schemas/__tests__/device.schema.test.ts]
  - [x] [AI-Review][MEDIUM] 调查 `pnpm-lock.yaml` 中的 Zod 版本不一致问题（3.25.76 vs 4.2.1）。 [pnpm-lock.yaml] - 已识别问题：zod-form-data 依赖的版本冲突，项目中所有package.json都指定了^4.2.1版本，但依赖冲突导致多个版本

## Dev Notes

### 项目上下文要点 (来自 project-context.md)

1. **TypeScript 配置**:
   - 使用严格模式,启用所有严格类型检查标志
   - 目标 ES2022,使用 ESNext 模块系统
   - 在导入中使用显式 `.js` 扩展名以兼容 Node.js
   - 对仅类型导入使用 `import type`

2. **Zod 验证模式**:
   - 使用 Zod v4.2.1 进行配置验证
   - 采用快速失败原则 (验证失败时抛出错误)
   - 使用 `.parse()` 方法进行严格验证
   - 使用 `.safeParse()` 方法进行错误捕获验证

3. **文件结构**:
   - 按基于功能的目录组织代码
   - 使用 index.ts 文件控制模块导出
   - 在专用文件中分离验证逻辑

4. **测试规则**:
   - 使用 vitest 作为测试框架
   - 为测试文件使用 .test.ts 或 .spec.ts 扩展名
   - 使用描述性测试名称,清楚表明测试内容

### 架构合规性 (来自 architecture.md)

#### Monorepo 结构要求

根据架构决策,monorepo 使用 **pnpm workspaces**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

#### Shared Package 结构

```
packages/shared/
├── src/
│   ├── schemas/            # Zod 验证模式
│   │   ├── config.schema.ts
│   │   ├── network.schema.ts
│   │   ├── device.schema.ts
│   │   └── api-response.schema.ts
│   ├── types/              # TypeScript 类型
│   │   ├── config.types.ts
│   │   ├── api.types.ts
│   │   └── device.types.ts
│   └── index.ts            # 重导出
├── package.json
└── tsconfig.json
```

#### 命名约定

**Zod Schema 命名**: PascalCase 与 `Schema` 后缀
```typescript
export const configSchema = z.object({...});
export const networkConfigSchema = z.object({...});
export const deviceStatusSchema = z.object({...});
```

**文件命名**: kebab-case
- ✅ `config.schema.ts`, `network.schema.ts`
- ❌ `configSchema.ts`, `Config_Schema.ts`

#### 验证字段详细规范

根据架构文档和 PRD/UX 需求,配置 schema 必须包含以下字段:

**网络配置字段** (`network.schema.ts`):
- `ipAddress`: IPv4 格式验证 (使用正则或 Zod IP validator)
- `subnetMask`: 子网掩码验证 (如 255.255.255.0)
- `gateway`: 网关地址验证,必须在子网范围内 (使用 refine)
- `dns`: DNS 服务器数组,每个元素是有效 IP 地址
- `port`: 端口号 1-65535 范围验证 (使用 `z.number().int().min(1).max(65535)`)

**应用程序配置字段** (`config.schema.ts`):
- `deviceId`: 设备 ID 字符串
- `timeout`: 超时时间 (毫秒),正整数
- `retryCount`: 重试次数,非负整数
- `pollingInterval`: 轮询间隔 (默认 5000ms)
- 其他应用级设置根据现有 config.json 结构定义

**设备状态字段** (`device.schema.ts`):
- `online`: 布尔值,表示设备在线状态
- `ipAddress`: 当前 IP 地址
- `port`: 当前端口号
- `protocol`: 协议类型 ('UDP' | 'TCP')

**API 响应包装** (`api-response.schema.ts`):
```typescript
const apiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),  // 具体类型由调用方指定
  message: z.string().optional()
});

const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  errorCode: z.string().optional(),
  validationErrors: z.record(z.string()).optional()
});
```

### 技术实现要点

#### IPv4 地址验证

```typescript
// 使用 Zod 的 IP 验证或自定义正则
const ipv4Schema = z.string().ip({ version: 'v4' });
// 或者
const ipv4Schema = z.string().regex(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  { message: 'IP 地址格式无效,请输入如 192.168.1.100 的格式' }
);
```

#### 网关子网一致性验证

```typescript
export const networkConfigSchema = z.object({
  ipAddress: ipv4Schema,
  subnetMask: ipv4Schema,
  gateway: ipv4Schema,
  dns: z.array(ipv4Schema).optional()
}).refine(
  (data) => {
    // 检查网关是否在子网内的逻辑
    // 可以使用 ip-cidr 库或自定义函数
    return isGatewayInSubnet(data.gateway, data.ipAddress, data.subnetMask);
  },
  {
    message: '网关地址不在配置的子网范围内',
    path: ['gateway']
  }
);
```

#### TypeScript 类型导出

```typescript
// src/types/config.types.ts
import { z } from 'zod';
import { configSchema, networkConfigSchema } from '../schemas/config.schema';

export type Config = z.infer<typeof configSchema>;
export type NetworkConfig = z.infer<typeof networkConfigSchema>;
```

#### 构建配置 (tsup)

在 `packages/shared/package.json` 中:
```json
{
  "name": "@node-switch/shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "tsup": "latest",
    "typescript": "5.9.3",
    "vitest": "latest"
  }
}
```

### 参考资料

- [Zod 官方文档](https://zod.dev/) - 验证库文档
- [Architecture: Data Validation Strategy](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/architecture.md#L370-L392) - 双层验证策略
- [Architecture: Shared Package Structure](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/architecture.md#L1407-L1420) - 共享包目录结构
- [Architecture: Naming Patterns](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/architecture.md#L764-L869) - 命名约定
- [Project Context: Zod Validation](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/project-context.md#L44-L47) - 验证模式规则

### 前置依赖

⚠️ **重要**: 此故事依赖于故事 1.1 (Monorepo Setup) 的完成。在开始此故事之前,请确保:
1. pnpm workspace 已正确配置 (`pnpm-workspace.yaml` 存在)
2. `packages/backend` 和 `packages/frontend` 目录已创建
3. 根目录 `tsconfig.json` 已配置

如果故事 1.1 尚未完成,需要先完成 monorepo 初始化,或者在此故事中包含基础 workspace 设置。

### 测试策略

1. **Schema 验证测试**: 验证有效和无效数据
2. **类型导出测试**: 确保类型正确推断
3. **跨包导入测试**: 验证 backend 和 frontend 可以导入
4. **边界情况测试**: 测试边界值 (端口 1, 65535, 65536)

### 成功标准

- ✅ 所有 schemas 定义完整且可导出
- ✅ TypeScript 类型正确推断
- ✅ 单元测试通过率 100%
- ✅ Backend 可以成功导入并使用 schema
- ✅ Frontend 可以成功导入并使用 schema
- ✅ 构建输出到 `dist/` 目录，包含 `.js` 和 `.d.ts` 文件

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash Experimental

### Debug Log References

(待填写)

### Completion Notes List

已完成所有任务:

1. **Schema 实现** (使用 TDD 方法):
   - 创建了 4 个 schema 文件: `config.schema.ts`, `network.schema.ts`, `device.schema.ts`, `api-response.schema.ts`
   - 实现了 IP 地址格式验证 (IPv4 正则)
   - 实现了端口号范围验证 (1-65535)
   - 实现了网关子网一致性验证 (使用 Zod refine)
   - 实现了 API 响应包装 schema (成功/错误响应)

2. **类型定义**:
   - 创建了 4 个类型文件,使用 `z.infer<>` 从 schema 推断类型
   - 在 `src/index.ts` 中重新导出所有 schemas 和类型

3. **单元测试** (TDD RED-GREEN-REFACTOR):
   - 遵循 TDD 原则,先编写测试(RED)
   - 实现 schema 使测试通过(GREEN)
   - 重构优化代码
   - 总计 49 个测试全部通过 ✅

4. **包构建与跨包引用**:
   - 使用 tsup 构建 ESM + CJS 格式
   - 生成类型声明文件 (.d.ts)
   - Backend 和 Frontend 成功导入并验证 shared 包

5. **验收标准达成**:
   - ✅ AC#1: Schema 包含 IP、子网掩码、网关、端口等验证规则
   - ✅ AC#2: TypeScript 类型定义已导出
   - ✅ AC#3: 前端和后端都能导入并使用 schemas
   - ✅ AC#4: 单元测试验证有效和无效数据

### File List

**新增文件:**
- `packages/shared/src/schemas/config.schema.ts`
- `packages/shared/src/schemas/network.schema.ts`
- `packages/shared/src/schemas/device.schema.ts`
- `packages/shared/src/schemas/api-response.schema.ts`
- `packages/shared/src/schemas/auth.schema.ts` - 认证相关 schema
- `packages/shared/src/schemas/test-connection.schema.ts` - 连接测试 schema
- `packages/shared/src/schemas/conflict-detection.schema.ts` - 冲突检测 schema
- `packages/shared/src/types/config.types.ts`
- `packages/shared/src/types/network.types.ts`
- `packages/shared/src/types/device.types.ts`
- `packages/shared/src/types/api.types.ts`
- `packages/shared/src/types/conflict-detection.types.ts` - 冲突检测类型定义
- `packages/shared/src/utils/ip-utils.ts` - IP 地址子网验证工具
- `packages/shared/src/schemas/__tests__/config.schema.test.ts`
- `packages/shared/src/schemas/__tests__/network.schema.test.ts`
- `packages/shared/src/schemas/__tests__/device.schema.test.ts`
- `packages/shared/src/schemas/__tests__/api-response.schema.test.ts`
- `packages/shared/src/schemas/__tests__/auth.schema.test.ts` - 认证 schema 测试
- `packages/shared/src/schemas/__tests__/test-connection.schema.test.ts` - 连接测试 schema 测试
- `packages/shared/src/schemas/__tests__/conflict-detection.schema.test.ts` - 冲突检测 schema 测试
- `packages/shared/src/utils/__tests__/ip-utils.test.ts` - IP 工具测试
- `packages/backend/src/test-shared-import.ts` (验证导入)
- `packages/frontend/src/test-shared-import.ts` (验证导入)

**修改文件:**
- `packages/shared/package.json` - 添加 `type: "module"` 和修复 `exports.types` 字段
- `packages/shared/src/index.ts` (重新导出所有 schemas 和类型)
- `packages/shared/src/schemas/network.schema.ts` - 修复子网掩码验证（重用 ipv4Schema）
- `packages/shared/src/schemas/api-response.schema.ts` - 将 `z.any()` 改为 `z.unknown()`
- `packages/shared/src/utils/ip-utils.ts` - 增强错误处理（空字符串、前导零等）
- `_bmad-output/1-2-shared-validation.md` - 更新 File List 和状态
