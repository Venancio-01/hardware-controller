---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - prd.md
  - epics.md
  - project-context.md
  - architecture.md (扫描生成)
workflowType: 'architecture'
project_name: 'node-switch'
user_name: '青山'
date: '2025-12-26'
---

# Node Switch 架构决策文档

_本文档记录项目的关键架构决策，专注于防止 AI 代理实现冲突的决策点。_

---

## 1. 项目背景

**Node Switch** 是一个基于 Node.js + TypeScript 的硬件通信服务系统，用于继电器控制和语音播报。项目需要添加一个 Web 配置界面，用于管理系统配置和监控设备状态。

### 1.1 当前状态

- `src/` 目录包含核心硬件控制服务（XState 状态机 + UDP/TCP 通信）
- `packages/` 目录包含新添加的 Web 服务组件：
  - `packages/frontend/` - React 19 + Vite 前端
  - `packages/backend/` - Express API 后端
  - `packages/shared/` - 共享类型和 Zod 验证

### 1.2 待解决的架构问题

**核心问题：** 核心硬件服务（`src/`）与 Web 服务（`packages/backend/`）应该如何集成？

---

## 2. 架构决策记录 (ADR)

### ADR-001：采用单进程架构

**状态：** ✅ 已决定

**决策：** 核心硬件服务与 Web API 服务在同一 Node.js 进程中运行。

**背景：**
- 项目规模较小，不需要微服务架构的复杂性
- 硬件控制需要低延迟响应
- 部署环境为嵌入式设备，资源有限

**考虑的方案：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| **方案 A：单进程集成** | 简单、低延迟、部署方便 | 故障不隔离 |
| 方案 B：双进程分离 | 故障隔离、独立升级 | 增加 IPC 复杂性 |

**决策理由：**
1. **"无聊的技术"原则** - 单进程更简单、更可靠
2. **当前规模合适** - 应用不够复杂到需要微服务
3. **已有良好分层** - `packages/` 结构提供了逻辑分离
4. **保持架构弹性** - 将来如需分离进程，改动最小

**后果：**
- Web 服务崩溃会影响硬件控制（可接受风险）
- 升级 Web 界面需要重启整个系统（可接受）

---

### ADR-002：将 `src/` 迁移到 `packages/core/`

**状态：** ✅ 已决定

**决策：** 将现有的 `src/` 目录迁移到 `packages/core/` 作为独立的 npm 包。

**目标结构：**

```
node-switch/
├── packages/
│   ├── core/              # [新建] 从 src/ 迁移
│   │   ├── package.json   # @node-switch/core
│   │   └── src/
│   │       ├── hardware/
│   │       ├── state-machines/
│   │       ├── relay/
│   │       ├── voice-broadcast/
│   │       ├── udp/
│   │       ├── tcp/
│   │       └── ...
│   ├── backend/           # 依赖 @node-switch/core
│   ├── frontend/
│   └── shared/
```

**包依赖关系：**

```mermaid
graph TD
    Frontend[frontend] --> Shared[shared]
    Backend[backend] --> Shared
    Backend --> Core[core]
    Core --> Shared
```

**决策理由：**
1. **职责分离** - 硬件控制逻辑与 Web API 逻辑清晰分开
2. **可测试性** - 核心服务可独立测试，无需 mock Web 层
3. **未来扩展** - 如需分离进程，改动最小
4. **符合 monorepo 最佳实践** - 与现有 `packages/` 结构一致

---

### ADR-003：Backend 与 Core 集成模式

**状态：** ✅ 已决定

**决策：** `packages/backend/` 通过直接函数调用方式集成 `@node-switch/core`。

**集成代码示例：**

```typescript
// packages/backend/src/index.ts
import express from 'express';
import { HardwareCommunicationManager, createMainMachine } from '@node-switch/core';
import { loadConfig } from '@node-switch/shared';

const app = express();

// 初始化核心硬件服务
const config = loadConfig();
const hardwareManager = new HardwareCommunicationManager(config);
const mainMachine = createMainMachine(hardwareManager);

// 将核心服务注入到 Express 上下文
app.locals.hardwareManager = hardwareManager;
app.locals.mainMachine = mainMachine;

// API 路由可访问核心服务
app.get('/api/status', (req, res) => {
  const { mainMachine } = req.app.locals;
  const snapshot = mainMachine.getSnapshot();
  res.json({ state: snapshot.value });
});
```

**关键点：**
- 使用 `app.locals` 共享核心服务实例
- 服务在应用启动时初始化一次
- 路由处理器通过 `req.app.locals` 访问服务

---

## 3. 技术栈确认

### 3.1 核心技术

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **运行时** | Node.js | ≥22.0.0 | JavaScript 运行时 |
| **语言** | TypeScript | 5.9.3 | 类型安全 |
| **状态管理** | XState | 5.12.1 | 硬件控制状态机 |
| **验证** | Zod | 4.2.1 | 数据验证 |
| **日志** | Pino | 10.1.0 | 结构化日志 |

### 3.2 Web 服务技术

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | React | 19.0.0 | UI 框架 |
| **构建工具** | Vite | 5.2.0 | 开发/构建 |
| **路由** | TanStack Router | 1.31.15 | 客户端路由 |
| **数据获取** | TanStack Query | 5.28.9 | 服务端状态 |
| **样式** | Tailwind CSS | 3.4.17 | 工具类 CSS |
| **UI 组件** | shadcn/ui | - | 组件库 |
| **表单** | React Hook Form | 7.69.0 | 表单管理 |
| **后端框架** | Express | 4.21.2 | API 服务 |
| **认证** | JWT | 9.0.3 | 用户认证 |

---

## 4. 迁移计划

### 4.1 阶段一：创建 packages/core 包

```bash
# 1. 创建目录结构
mkdir -p packages/core/src

# 2. 移动源代码
mv src/* packages/core/src/

# 3. 创建 package.json
```

**packages/core/package.json:**

```json
{
  "name": "@node-switch/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest"
  },
  "dependencies": {
    "xstate": "^5.12.1",
    "pino": "^10.1.0"
  },
  "peerDependencies": {
    "@node-switch/shared": "workspace:*"
  }
}
```

### 4.2 阶段二：更新 Backend 依赖

**packages/backend/package.json 添加：**

```json
{
  "dependencies": {
    "@node-switch/core": "workspace:*",
    "@node-switch/shared": "workspace:*"
  }
}
```

### 4.3 阶段三：更新入口点

创建统一的应用入口，初始化核心服务并启动 Express 服务器。

### 4.4 阶段四：验证

- 运行所有现有测试
- 验证硬件通信功能
- 验证 Web API 功能

---

## 5. 验证计划

### 5.1 自动化测试

```bash
# 运行所有包的测试
pnpm test

# 单独测试核心包
pnpm --filter @node-switch/core test

# 单独测试后端包
pnpm --filter backend test
```

### 5.2 手动验证

1. 启动完整应用：`pnpm dev`
2. 访问 Web 界面，确认配置页面正常加载
3. 验证设备状态显示正确
4. 测试配置修改和保存功能

---

## 6. 用户审核项

> [!IMPORTANT]
> 请确认以下关键决策：

1. **单进程架构** - 核心服务与 Web 服务在同一进程运行，是否接受？
2. **src/ 迁移** - 将 `src/` 迁移到 `packages/core/` 作为独立包，是否同意？
3. **迁移优先级** - 是否应该在继续开发新功能前完成迁移？

---

---

## 7. 项目上下文分析

### 7.1 需求概览

**功能需求 (FR) 分析：**

| 类别 | FR 数量 | 架构影响 |
|------|---------|----------|
| **配置显示** | FR-001 | 需要 API 端点和前端组件 |
| **配置修改** | FR-002, FR-003 | 需要表单、验证、持久化 |
| **验证机制** | FR-004, FR-011, FR-018, FR-019 | 需要共享 Zod 验证层 |
| **保存机制** | FR-005, FR-007 | 需要备份策略、反馈机制 |
| **安全** | FR-006, FR-020 | 需要 JWT 认证、HTTPS |
| **生命周期** | FR-008, FR-012 | 导入/导出、连接测试 |

**非功能需求 (NFR) 分析：**

| NFR | 要求 | 架构决策 |
|-----|------|----------|
| NFR-001 | 加载时间 < 3 秒 | 优化前端包大小，使用代码分割 |
| NFR-002 | 验证准确性 100% | 双层 Zod 验证（前端 + 后端） |
| NFR-003 | 可用性 99.9% | 单进程架构，简化故障点 |
| NFR-005 | 技术栈兼容性 | Node.js ≥22, TypeScript 5.9.3, Zod 4.2.1 |
| NFR-008 | WCAG 2.1 AA | shadcn/ui 组件内置无障碍支持 |

### 7.2 规模与复杂度评估

| 指标 | 评估 | 说明 |
|------|------|------|
| **项目复杂度** | 中等 | 硬件集成 + Web 配置 |
| **主要技术领域** | 全栈 + 嵌入式 | 前端、后端、硬件通信 |
| **Epic 数量** | 5 | 核心界面、应用配置、网络配置、系统控制、增强功能 |
| **Story 数量** | ~15 | 按 Epic 分布 |
| **API 端点** | ~10 | 配置 CRUD、状态、系统控制 |
| **前端组件** | ~20 | 仪表盘、表单、状态指示器 |

### 7.3 技术约束与依赖

**硬约束：**

1. **运行时环境** - Node.js ≥22.0.0（嵌入式设备）
2. **现有代码** - 必须兼容 `src/` 下的 XState 状态机
3. **硬件通信** - UDP/TCP 协议，不可更改
4. **配置格式** - `config.json` 文件格式

**软约束：**

1. **用户界面** - 浏览器兼容性（Chrome，1920x1080 分辨率）
2. **安全级别** - 基础 JWT 认证即可（非公网暴露）
3. **部署方式** - Systemd 服务

### 7.4 跨领域关注点

| 关注点 | 影响范围 | 解决方案 |
|--------|----------|----------|
| **验证一致性** | 前端 + 后端 | `packages/shared` 共享 Zod schemas |
| **配置类型** | 全部包 | `@node-switch/shared` 导出类型 |
| **日志记录** | Core + Backend | Pino 日志，统一格式 |
| **错误处理** | 全部层 | 统一错误响应格式 |
| **优雅关闭** | Core + Backend | SIGTERM/SIGINT 处理 |

### 7.5 迁移对现有功能的影响

> [!WARNING]
> 迁移 `src/` 到 `packages/core/` 需要调整以下内容：

| 内容 | 当前位置 | 迁移后位置 | 影响 |
|------|----------|------------|------|
| 入口点 | `src/index.ts` | `packages/core/src/index.ts` | 需更新 `package.json` scripts |
| 配置加载 | `src/config/` | `packages/core/src/config/` | 无影响（相对路径保持） |
| 测试文件 | `test/` | `packages/core/__tests__/` | 需移动测试文件 |
| 构建产物 | `dist/` | `packages/core/dist/` | 需更新构建配置 |
| 根入口 | 直接运行 | 通过 backend 启动 | 需创建统一入口 |

---

## 8. 迁移实施计划

> [!NOTE]
> 由于这是已存在的项目（非新项目初始化），跳过 Starter Template 评估。以下是 `packages/core/` 迁移的详细实施计划。

### 8.1 阶段一：创建 packages/core 包结构

**目标：** 创建独立的 npm 包，无需移动代码

**步骤：**

```bash
# 1. 创建目录
mkdir -p packages/core/src

# 2. 创建 package.json
cat > packages/core/package.json << 'EOF'
{
  "name": "@node-switch/core",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest"
  },
  "dependencies": {
    "xstate": "^5.12.1",
    "pino": "^10.1.0",
    "pino-pretty": "^14.0.0"
  },
  "peerDependencies": {
    "@node-switch/shared": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^3.0.0",
    "typescript": "^5.9.3"
  }
}
EOF

# 3. 创建 tsconfig.json
cat > packages/core/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

**变更文件：**

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/core/package.json` | [NEW] | 包配置 |
| `packages/core/tsconfig.json` | [NEW] | TypeScript 配置 |
| `pnpm-workspace.yaml` | [VERIFY] | 确认已包含 `packages/*` |

---

### 8.2 阶段二：迁移源代码

**目标：** 将 `src/` 下的代码移动到 `packages/core/src/`

**步骤：**

```bash
# 1. 移动所有源文件
mv src/* packages/core/src/

# 2. 更新导入路径（如需要）
# 大部分内部导入使用相对路径，无需修改

# 3. 创建导出入口
cat > packages/core/src/index.ts << 'EOF'
// 导出硬件通信管理器
export { HardwareCommunicationManager } from './hardware/manager.js';
export { initializeHardware } from './hardware/initializer.js';

// 导出状态机
export { createMainMachine } from './state-machines/main-machine.js';
export { createApplyAmmoMachine } from './state-machines/apply-ammo-machine.js';
export { createMonitorMachine } from './state-machines/monitor-machine.js';
export { createAlarmMachine } from './state-machines/alarm-machine.js';

// 导出继电器控制
export { RelayController } from './relay/controller.js';
export { resetRelays } from './relay/reset.js';

// 导出语音播报
export { VoiceBroadcastController } from './voice-broadcast/index.js';

// 导出配置
export { loadConfig, validateConfig } from './config/index.js';

// 导出类型
export type * from './types/index.js';
EOF
```

**变更文件：**

| 当前路径 | 目标路径 | 操作 |
|----------|----------|------|
| `src/hardware/*` | `packages/core/src/hardware/*` | MOVE |
| `src/state-machines/*` | `packages/core/src/state-machines/*` | MOVE |
| `src/relay/*` | `packages/core/src/relay/*` | MOVE |
| `src/voice-broadcast/*` | `packages/core/src/voice-broadcast/*` | MOVE |
| `src/config/*` | `packages/core/src/config/*` | MOVE |
| `src/logger/*` | `packages/core/src/logger/*` | MOVE |
| `src/udp/*` | `packages/core/src/udp/*` | MOVE |
| `src/tcp/*` | `packages/core/src/tcp/*` | MOVE |
| `src/types/*` | `packages/core/src/types/*` | MOVE |
| `src/business-logic/*` | `packages/core/src/business-logic/*` | MOVE |
| `src/index.ts` | `packages/core/src/index.ts` | MODIFY |

---

### 8.3 阶段三：迁移测试文件

**目标：** 将测试文件移动到 `packages/core/`

```bash
# 移动测试文件
mv test/* packages/core/__tests__/

# 更新测试导入路径
# 将 import from '../src/' 改为 import from '../src/'
```

---

### 8.4 阶段四：更新 Backend 依赖

**目标：** 让 backend 依赖 @node-switch/core

**packages/backend/package.json 修改：**

```json
{
  "dependencies": {
    "@node-switch/core": "workspace:*",
    "@node-switch/shared": "workspace:*"
    // ... 其他依赖
  }
}
```

**packages/backend/src/index.ts 修改：**

```typescript
import express from 'express';
import {
  HardwareCommunicationManager,
  createMainMachine,
  loadConfig
} from '@node-switch/core';

const app = express();

// 初始化核心服务
const config = loadConfig();
const hardwareManager = new HardwareCommunicationManager(config);
const mainMachine = createMainMachine(hardwareManager);

// 注入到 Express 上下文
app.locals.hardwareManager = hardwareManager;
app.locals.mainMachine = mainMachine;

// ... 其余代码
```

---

### 8.5 阶段五：更新根目录配置

**目标：** 清理根目录，更新构建脚本

**根 package.json 更新：**

```json
{
  "scripts": {
    "dev": "pnpm --filter backend dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "start": "node packages/backend/dist/index.js"
  }
}
```

**清理项：**

| 文件/目录 | 操作 | 说明 |
|-----------|------|------|
| `src/` | DELETE | 已迁移到 packages/core |
| `dist/` | DELETE | 将由各包单独构建 |
| `test/` | DELETE | 已迁移到 packages/core/__tests__ |

---

## 9. 验证计划

### 9.1 自动化测试

```bash
# 1. 安装依赖
pnpm install

# 2. 构建所有包
pnpm build

# 3. 运行所有测试
pnpm test

# 4. 单独测试核心包
pnpm --filter @node-switch/core test

# 5. 单独测试后端包
pnpm --filter backend test
```

### 9.2 功能验证

| 验证项 | 命令/步骤 | 预期结果 |
|--------|-----------|----------|
| 构建成功 | `pnpm build` | 无错误，各包生成 dist/ |
| 核心测试 | `pnpm --filter @node-switch/core test` | 所有测试通过 |
| 后端测试 | `pnpm --filter backend test` | 所有测试通过 |
| 前端测试 | `pnpm --filter frontend test` | 所有测试通过 |
| 开发模式 | `pnpm dev` | 服务正常启动 |
| 硬件通信 | 检查设备状态 | 继电器状态可读取 |
| API 访问 | `curl http://localhost:3000/api/config` | 返回配置 JSON |

### 9.3 回滚方案

如果迁移出现问题：

```bash
# 使用 Git 回滚
git checkout -- .
git clean -fd

# 或恢复特定版本
git reset --hard HEAD~1
```

---

## 10. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 导入路径错误 | 中 | 高 | 构建前进行 TypeScript 类型检查 |
| 测试失败 | 中 | 中 | 逐步迁移，每步验证 |
| 配置文件路径 | 低 | 高 | 使用相对于包根目录的路径 |
| pnpm 依赖解析 | 低 | 中 | 确保 workspace 协议正确 |

---

## 11. 时间线建议

| 阶段 | 预计工作量 | 依赖 |
|------|------------|------|
| 阶段一：创建包结构 | 10 分钟 | 无 |
| 阶段二：迁移源代码 | 20 分钟 | 阶段一 |
| 阶段三：迁移测试 | 15 分钟 | 阶段二 |
| 阶段四：更新 Backend | 30 分钟 | 阶段二 |
| 阶段五：清理根目录 | 10 分钟 | 阶段四 |
| 验证 | 20 分钟 | 阶段五 |

**总计：约 1.5-2 小时**
