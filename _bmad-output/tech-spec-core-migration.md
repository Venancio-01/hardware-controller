# Tech-Spec: 迁移核心代码到 packages/core

**创建日期:** 2025-12-26
**状态:** 准备开发
**负责人:** 青山

## 概述

### 问题陈述

当前 node-switch 项目的核心业务逻辑（继电器控制、硬件通信、状态机、语音播报、日志、配置等）散布在根目录的 `./src` 和 `./test` 中，导致：
- 代码组织不清晰，核心逻辑与应用入口混在一起
- 难以在其他包（如 future 的 CLI 工具）中复用核心逻辑
- 测试代码与源代码分离，不利于维护
- 依赖关系复杂，模块耦合度高

### 解决方案

将**所有**核心代码（包括 logger 和 config）从根目录迁移到 `./packages/core`，形成一个完全独立、自包含的 `@node-switch/core` 包。根目录仅保留一个简单的应用入口文件。

### 范围 (In/Out)

**✅ 包含 (In Scope):**
- 迁移 `src/tcp/` - TCP 客户端及测试
- 迁移 `src/udp/` - UDP 客户端及测试
- 迁移 `src/config/` - 配置模块及测试
- 迁移 `src/logger/` - 日志模块（Pino）及测试
- 迁移 `src/hardware/` - 硬件通信管理器和初始化器及测试
- 迁移 `src/voice-broadcast/` - 语音播报模块及测试
- 迁移 `src/state-machines/` - 所有状态机（main, monitor, alarm, apply-ammo）及测试
- 迁移 `src/types/` - 核心类型定义（网络类型、状态机类型）
- 迁移 `test/` 下**所有**测试文件到 `packages/core/__tests__/`
- 更新 `packages/core/package.json` 的构建配置和导出接口
- 更新 `packages/core/tsup.config.ts` 构建入口
- 创建新的根目录 `src/index.ts` 作为简化应用入口
- 删除根目录的 `src/` 和 `test/` 目录

**❌ 不包含 (Out of Scope):**
- `packages/backend/` - Web UI 后端（完全独立，不涉及）
- `packages/frontend/` - Web UI 前端（完全独立，不涉及）
- `packages/shared/` - 共享类型和验证（已独立）

## 开发上下文

### 代码库模式

**当前结构:**
```
node-switch/
├── src/
│   ├── config/          ← 配置模块
│   ├── logger/          ← 日志模块 (Pino)
│   ├── tcp/             ← TCP 客户端
│   ├── udp/             ← UDP 客户端
│   ├── types/           ← 类型定义
│   ├── hardware/        ← 硬件管理器
│   ├── voice-broadcast/ ← 语音播报
│   ├── state-machines/  ← 状态机
│   ├── relay/           ← 继电器控制（已空，已迁移）
│   ├── business-logic/  ← 业务逻辑（已空，已迁移）
│   └── index.ts         ← 主入口（72行）
├── test/                ← 约22个测试文件
└── packages/
    ├── core/            ← 已有 relay/, business-logic/
    ├── backend/         ← Web UI 后端
    ├── frontend/        ← Web UI 前端
    └── shared/          ← 共享代码
```

**目标结构:**
```
node-switch/
├── src/
│   └── index.ts         ← 极简入口（约20行）
│
├── packages/
│   └── core/
│       ├── src/
│       │   ├── tcp/             ← 迁移
│       │   ├── udp/             ← 迁移
│       │   ├── types/           ← 迁移
│       │   ├── config/          ← 迁移
│       │   ├── logger/          ← 迁移
│       │   ├── hardware/        ← 迁移
│       │   ├── voice-broadcast/ ← 迁移
│       │   ├── state-machines/  ← 迁移
│       │   ├── relay/           ← 已存在
│       │   ├── business-logic/  ← 已存在
│       │   └── index.ts         ← 统一导出
│       │
│       ├── __tests__/           ← 迁移所有测试
│       │   ├── tcp-*.test.ts
│       │   ├── udp-*.test.ts
│       │   ├── hardware/
│       │   ├── voice-broadcast/
│       │   ├── state-machines/
│       │   ├── integration/
│       │   └── mocks/
│       │
│       ├── package.json         ← 更新配置
│       ├── tsup.config.ts       ← 更新构建入口
│       └── README.md            ← 更新文档
```

### 需要引用的文件

**迁移源文件清单:**

**源代码 (src/):**
```
src/tcp/client.ts                 → packages/core/src/tcp/client.ts
src/udp/client.ts                 → packages/core/src/udp/client.ts
src/config/index.ts               → packages/core/src/config/index.ts
src/logger/index.ts               → packages/core/src/logger/index.ts
src/logger/pino.ts                → packages/core/src/logger/pino.ts
src/logger/types.ts               → packages/core/src/logger/types.ts
src/types/index.ts                → packages/core/src/types/network.ts
src/types/state-machine.ts        → packages/core/src/types/state-machine.ts
src/hardware/manager.ts           → packages/core/src/hardware/manager.ts
src/hardware/initializer.ts       → packages/core/src/hardware/initializer.ts
src/voice-broadcast/index.ts      → packages/core/src/voice-broadcast/index.ts
src/voice-broadcast/initializer.ts → packages/core/src/voice-broadcast/initializer.ts
src/voice-broadcast/types.ts      → packages/core/src/voice-broadcast/types.ts
src/voice-broadcast/validation.ts → packages/core/src/voice-broadcast/validation.ts
src/voice-broadcast/controller.ts → packages/core/src/voice-broadcast/controller.ts
src/state-machines/main-machine.ts    → packages/core/src/state-machines/main-machine.ts
src/state-machines/monitor-machine.ts → packages/core/src/state-machines/monitor-machine.ts
src/state-machines/alarm-machine.ts   → packages/core/src/state-machines/alarm-machine.ts
src/state-machines/apply-ammo-machine.ts → packages/core/src/state-machines/apply-ammo-machine.ts
src/index.ts                      → 新的根目录 src/index.ts（重写，极简化）
```

**测试文件 (test/):**
```
test/tcp-retry.test.ts                  → packages/core/__tests__/tcp-retry.test.ts
test/udp-retry.test.ts                  → packages/core/__tests__/udp-retry.test.ts
test/config-validation.test.ts          → packages/core/__tests__/config-validation.test.ts
test/door-open-timeout-config.test.ts   → packages/core/__tests__/door-open-timeout-config.test.ts
test/hardware/initializer.test.ts       → packages/core/__tests__/hardware/initializer.test.ts
test/voice-broadcast/*.test.ts          → packages/core/__tests__/voice-broadcast/
test/state-machines/*.test.ts           → packages/core/__tests__/state-machines/
test/integration/*.test.ts              → packages/core/__tests__/integration/
test/mocks/*                             → packages/core/__tests__/mocks/
test/orchestration.test.ts              → packages/core/__tests__/orchestration.test.ts
test/types/state-machine-types.test.ts  → packages/core/__tests__/state-machine-types.test.ts
```

### 技术决策

#### 1. 完全迁移策略 - Logger 和 Config

**决策:** 将 `logger` 和 `config` 完整迁移到 core 包内，不使用依赖注入或接口抽象。

**理由:**
- 简化依赖关系，core 包完全自包含
- 减少应用层复杂度
- 便于后续手动调整架构

**实施:**
- 直接复制 `src/logger/` 所有文件到 `packages/core/src/logger/`
- 直接复制 `src/config/` 所有文件到 `packages/core/src/config/`
- 更新所有导入路径

#### 2. 导出接口设计

保持清晰的模块化导出，同时提供便捷的主入口：

```typescript
// packages/core/src/index.ts
// ==================== 基础设施 ====================
export * from './config/index.js';
export * from './logger/index.js';

// ==================== 类型定义 ====================
export * from './types/network.js';
export * from './types/state-machine.js';

// ==================== 网络通信 ====================
export * from './tcp/client.js';
export * from './udp/client.js';

// ==================== 硬件抽象 ====================
export * from './hardware/manager.js';
export * from './hardware/initializer.js';

// ==================== 语音播报 ====================
export * from './voice-broadcast/index.js';

// ==================== 状态机 ====================
export * from './state-machines/main-machine.js';
export * from './state-machines/monitor-machine.js';
export * from './state-machines/alarm-machine.js';
export * from './state-machines/apply-ammo-machine.js';

// ==================== 继电器控制 ====================
export * from './relay/index.js';

// ==================== 业务逻辑 ====================
export * from './business-logic/index.js';
```

**子路径导出 (package.json exports):**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./config": "./dist/config/index.js",
    "./logger": "./dist/logger/index.js",
    "./hardware": "./dist/hardware/manager.js",
    "./voice-broadcast": "./dist/voice-broadcast/index.js",
    "./state-machines": "./dist/state-machines/main-machine.js"
  }
}
```

#### 3. 构建配置更新

更新 `packages/core/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    // 主入口
    'src/index.ts',

    // 现有模块
    'src/relay/index.ts',
    'src/business-logic/index.ts',

    // 新增模块
    'src/config/index.ts',
    'src/logger/index.ts',
    'src/tcp/client.ts',
    'src/udp/client.ts',
    'src/hardware/manager.ts',
    'src/hardware/initializer.ts',
    'src/voice-broadcast/index.ts',
    'src/state-machines/main-machine.ts',
    'src/state-machines/monitor-machine.ts',
    'src/state-machines/alarm-machine.ts',
    'src/state-machines/apply-ammo-machine.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'node22',
});
```

#### 4. 依赖管理

更新 `packages/core/package.json`:

```json
{
  "dependencies": {
    "xstate": "^5.12.1",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.16",
    "tsup": "^8.5.1"
  }
}
```

#### 5. 根目录入口简化

新的 `src/index.ts` (根目录):

```typescript
/**
 * Node Switch 应用程序入口
 *
 * 这是一个极简的启动文件，所有核心逻辑都在 @node-switch/core 包中
 */

import { startApp } from '@node-switch/core';

// 启动应用程序
startApp().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
```

**core 包内新增启动函数:**
```typescript
// packages/core/src/app.ts
export async function startApp() {
  const appLogger = createModuleLogger('App');
  const manager = new HardwareCommunicationManager();
  const relayAggregator = new RelayStatusAggregator();

  // ... 主应用逻辑

  appLogger.info('应用程序已停止');
}
```

## 实施计划

### 任务清单

**阶段 1: 基础设施迁移**
- [ ] **任务 1.1:** 迁移 `src/logger/` → `packages/core/src/logger/`
- [ ] **任务 1.2:** 迁移 `src/config/` → `packages/core/src/config/`
- [ ] **任务 1.3:** 迁移 `src/types/` → `packages/core/src/types/`

**阶段 2: 网络层迁移**
- [ ] **任务 2.1:** 迁移 `src/tcp/` → `packages/core/src/tcp/`
- [ ] **任务 2.2:** 迁移 `src/udp/` → `packages/core/src/udp/`
- [ ] **任务 2.3:** 更新 TCP/UDP 内部导入路径

**阶段 3: 硬件层迁移**
- [ ] **任务 3.1:** 迁移 `src/hardware/` → `packages/core/src/hardware/`
- [ ] **任务 3.2:** 更新 hardware 模块导入路径
- [ ] **任务 3.3:** 验证 hardware 依赖 (tcp, udp, logger, types)

**阶段 4: 功能模块迁移**
- [ ] **任务 4.1:** 迁移 `src/voice-broadcast/` → `packages/core/src/voice-broadcast/`
- [ ] **任务 4.2:** 更新 voice-broadcast 导入路径

**阶段 5: 状态机迁移**
- [ ] **任务 5.1:** 迁移 `src/state-machines/` → `packages/core/src/state-machines/`
- [ ] **任务 5.2:** 更新所有状态机导入路径
- [ ] **任务 5.3:** 创建 `packages/core/src/app.ts` (启动逻辑)

**阶段 6: 测试迁移**
- [ ] **任务 6.1:** 迁移所有 test/ → `packages/core/__tests__/`
- [ ] **任务 6.2:** 更新测试文件中的导入路径
- [ ] **任务 6.3:** 验证所有测试通过

**阶段 7: 构建配置**
- [ ] **任务 7.1:** 更新 `packages/core/package.json` (dependencies, scripts)
- [ ] **任务 7.2:** 更新 `packages/core/tsup.config.ts` (entry points)
- [ ] **任务 7.3:** 更新 `packages/core/src/index.ts` (exports)

**阶段 8: 应用入口重写**
- [ ] **任务 8.1:** 创建新的根目录 `src/index.ts` (极简化)
- [ ] **任务 8.2:** 删除旧的根目录 `src/` 子目录
- [ ] **任务 8.3:** 删除根目录 `test/` 目录

**阶段 9: 验证和文档**
- [ ] **任务 9.1:** 运行 `pnpm build` 验证构建成功
- [ ] **任务 9.2:** 运行 `pnpm test` 验证所有测试通过
- [ ] **任务 9.3:** 手动测试应用启动
- [ ] **任务 9.4:** 更新 `packages/core/README.md`

### 验收标准

- [ ] **AC 1:** `pnpm build` 在根目录成功构建所有包，无错误
- [ ] **AC 2:** `pnpm test` 在根目录成功运行所有测试，100% 通过
- [ ] **AC 3:** `pnpm test` 在 `packages/core` 成功运行所有测试
- [ ] **AC 4:** 根目录 `src/` 仅包含一个 `index.ts` 文件
- [ ] **AC 5:** 根目录 `test/` 目录已被完全删除
- [ ] **AC 6:** `packages/core/src/` 包含所有核心代码（10+ 模块）
- [ ] **AC 7:** `packages/core/__tests__/` 包含所有测试（20+ 文件）
- [ ] **AC 8:** TypeScript 编译无错误，无类型错误
- [ ] **AC 9:** 运行根目录 `src/index.ts` 成功启动应用程序
- [ ] **AC 10:** `packages/backend` 功能不受影响（独立构建和运行）

## 额外上下文

### 模块依赖关系图

```
packages/core/src/
├── index.ts (主导出)
│
├── config/          (独立)
├── logger/          (独立)
├── types/           (独立)
│
├── tcp/             → logger, types
├── udp/             → logger, types
│
├── hardware/        → tcp, udp, logger, types
│
├── voice-broadcast/ → hardware, logger, types, config
│
├── state-machines/  → hardware, voice-broadcast, logger, types, config
│   ├── main-machine.ts
│   ├── monitor-machine.ts
│   ├── alarm-machine.ts
│   └── apply-ammo-machine.ts
│
├── relay/           (已存在，独立)
└── business-logic/  (已存在 → relay)
```

### 导入路径更新规则

**内部导入 (core 包内):**
```typescript
// 规则: 使用相对路径，添加 .js 扩展名
import { HardwareCommunicationManager } from '../hardware/manager.js';
import { createModuleLogger } from '../logger/index.js';
import { config } from '../config/index.js';
```

**外部导入 (根目录应用):**
```typescript
// 规则: 使用包名 @node-switch/core
import {
  HardwareCommunicationManager,
  createMainActor,
  logger,
  config
} from '@node-switch/core';
```

### 测试文件导入路径更新

测试文件中的导入也需要相应更新：

```typescript
// 修改前
import { TCPClient } from '../../src/tcp/client.js';
import { createMockLogger } from '../mocks/logger.mock.js';

// 修改后
import { TCPClient } from '../tcp/client.js';
import { createMockLogger } from '../mocks/logger.mock.js';
```

### 关键风险和缓解措施

**风险 1: 循环依赖**
- **概率:** 中
- **影响:** 构建失败
- **缓解:**
  - 严格按照依赖层次迁移（从底向上）
  - 使用 `import type` 延迟类型加载
  - 每个模块迁移后立即验证构建

**风险 2: 测试文件中的 mock 和 setup 失效**
- **概率:** 高
- **影响:** 测试失败
- **缓解:**
  - 迁移 `test/setup.ts` 到 `__tests__/setup.ts`
  - 更新 vitest.config.ts 的 rootDir
  - 验证所有 mock 路径

**风险 3: Pino 日志在构建时出错**
- **概率:** 中
- **影响:** 运行时日志失效
- **缓解:**
  - 确保 pino 和 pino-pretty 在 dependencies 中
  - 测试生产环境的日志输出
  - 验证 tsup 的 external 配置

**风险 4: 状态机 XState 导入问题**
- **概率:** 低
- **影响:** 状态机无法启动
- **缓解:**
  - 确保 xstate 在 dependencies 中
  - 验证所有 xState 导入路径
  - 测试状态机创建和启动

### 性能考虑

**构建性能:**
- 当前: ~5-10秒 (仅 relay, business-logic)
- 迁移后: ~15-25秒 (10+ 模块)
- **优化:** 启用 tsup 缓存，使用 `--watch` 模式开发

**运行时性能:**
- 无影响（仅代码组织变化）

**包体积:**
- 当前: ~500KB
- 迁移后: ~2-3MB (包含 Pino, XState 及所有模块)
- **注意:** 这是完整的核心包，预期大小合理

### 向后兼容性

**破坏性变更:**
- ✅ 根目录导入路径完全改变
- ✅ 包结构完全改变
- ✅ 测试路径完全改变

**非破坏性:**
- ✅ API 接口保持不变
- ✅ 功能完全一致

**迁移指南 (给其他开发者):**
```bash
# 1. 更新导入
- import { X } from './hardware/manager.js';
+ import { X } from '@node-switch/core';

# 2. 更新测试路径
- test/integration/xxx.test.ts
+ packages/core/__tests__/integration/xxx.test.ts

# 3. 构建命令
- pnpm build
- pnpm build  # (无变化)
```

### 后续优化建议

**架构改进 (由青山手动调整):**
1. 将 logger 提取到 shared 包或创建独立的 @node-switch/logger
2. 将 config 提取到 shared 包或创建独立的 @node-switch/config
3. 考虑将 state-machines 拆分为独立的 @node-switch/state-machines 包
4. 优化 core 包的导出粒度，支持 tree-shaking

**功能扩展:**
1. 创建 CLI 工具包使用 core
2. 添加 core 包的独立版本发布到 npm
3. 添加性能监控和指标收集
4. 考虑添加插件系统

### 文档更新清单

- [ ] `packages/core/README.md` - 完整的模块说明和 API 文档
- [ ] `packages/core/MIGRATION.md` - 迁移指南
- [ ] `packages/core/CHANGELOG.md` - 变更日志
- [ ] 根目录 `README.md` - 更新项目结构说明
- [ ] 根目录 `docs/` - 更新架构文档

---

## 附录

### 迁移检查清单

打印此清单并在迁移过程中逐项检查：

```markdown
## 阶段 1: 基础设施
[ ] logger 迁移完成
[ ] config 迁移完成
[ ] types 迁移完成
[ ] 基础设施测试通过

## 阶段 2: 网络层
[ ] tcp 迁移完成
[ ] udp 迁移完成
[ ] 网络层测试通过

## 阶段 3: 硬件层
[ ] hardware 迁移完成
[ ] hardware 测试通过

## 阶段 4: 功能模块
[ ] voice-broadcast 迁移完成
[ ] voice-broadcast 测试通过

## 阶段 5: 状态机
[ ] state-machines 迁移完成
[ ] app.ts 创建完成
[ ] 状态机测试通过

## 阶段 6: 测试迁移
[ ] 所有测试文件迁移完成
[ ] 测试导入路径更新完成
[ ] 全部测试通过

## 阶段 7: 构建配置
[ ] package.json 更新完成
[ ] tsup.config.ts 更新完成
[ ] index.ts 导出更新完成

## 阶段 8: 应用入口
[ ] 新的 src/index.ts 创建完成
[ ] 旧的 src/ 子目录删除完成
[ ] test/ 目录删除完成

## 阶段 9: 最终验证
[ ] pnpm build 成功
[ ] pnpm test 全部通过
[ ] 应用启动成功
[ ] backend 不受影响
[ ] 文档更新完成
```

### 快速回滚方案

如果迁移遇到严重问题，快速回滚步骤：

```bash
# 1. Git 回滚
git checkout -b backup-before-migration
git commit -am "Backup before core migration"

# 2. 如果需要回滚
git reset --hard HEAD~1

# 3. 或者恢复特定目录
git checkout HEAD~1 -- src/ test/
```

---

**附注:** 这是一个大规模重构，预计需要 8-12 小时完成。建议在开发分支进行，每个阶段完成后提交一次，便于回滚。迁移完成后由青山手动进行架构优化。
