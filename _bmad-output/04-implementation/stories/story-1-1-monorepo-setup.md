# Story 1.1: 初始化单仓库基础架构 (Monorepo Setup)

## 用户故事
**As a** 开发人员,
**I want** 建立基于 pnpm workspaces 的单仓库结构,
**So that** 我可以在统一的环境中管理后端、前端和共享代码，并确保依赖关系正确。

**优先级:** 高
**估计工时:** 4-6 小时

## 接受标准
**Given** 一个空的或初始化的项目目录
**When** 我运行初始化脚本和安装命令
**Then** 应创建 `packages/backend`, `packages/frontend`, `packages/shared` 三个包目录
**And** 根目录 `pnpm-workspace.yaml` 配置正确
**And** 所有包的 `tsconfig.json` 配置正确且相互兼容
**And** 运行 `pnpm build` 可以成功构建所有包

## 技术任务
- [x] 初始化 pnpm 工作区配置
- [x] 创建 packages/shared 包并配置 Zod 依赖
- [x] 创建 packages/backend 包并配置 Express 依赖
- [x] 创建 packages/frontend 包并配置 React/Vite 依赖
- [x] 配置根目录的 package.json 脚本
- [x] 验证构建流程
- [x] 创建共享包的类型定义和验证模式
- [x] 创建共享包的工具函数
- [x] 为共享包编写和运行测试
- [x] 创建后端基本入口文件
- [x] 创建前端基本入口文件和结构
- [x] 配置前端构建系统

## 实施记录

### 任务 1: 初始化 pnpm 工作区配置
- 已创建根目录 pnpm-workspace.yaml
- 已配置 packages/* 模式

### 任务 2: 创建 packages/shared 包
- 已创建 packages/shared 目录
- 已初始化 package.json
- 已配置 Zod 依赖
- 已设置 TypeScript 配置

### 任务 3: 创建 packages/backend 包
- 已创建 packages/backend 目录
- 已初始化 package.json
- 已配置 Express、Pino、Zod 等依赖
- 已设置 TypeScript 配置

### 任务 4: 创建 packages/frontend 包
- 已创建 packages/frontend 目录
- 已初始化 package.json
- 已配置 React、Vite、shadcn/ui 等依赖
- 已设置 TypeScript 配置

### 任务 5: 配置根目录 package.json 脚本
- 已添加构建、开发、测试等脚本
- 已配置跨包依赖管理

### 任务 6: 验证构建流程
- 已测试 pnpm build 命令
- 所有包均可成功构建

## 测试验证
- [x] 创建失败测试: 验证未初始化的工作区无法构建
- [x] 实现功能: 初始化 pnpm 工作区
- [x] 测试通过: pnpm build 成功构建所有包
- [x] 重构优化: 优化包依赖配置

## 文件变更列表
- pnpm-workspace.yaml (新增)
- packages/shared/package.json (新增)
- packages/shared/tsconfig.json (新增)
- packages/backend/package.json (新增)
- packages/backend/tsconfig.json (新增)
- packages/frontend/package.json (新增)
- packages/frontend/tsconfig.json (新增)
- package.json (根目录，新增脚本)
- README.md (更新项目结构说明)