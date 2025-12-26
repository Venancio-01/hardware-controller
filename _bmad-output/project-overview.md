# 项目概述

> **项目名称**: Node Switch
> **生成日期**: 2025-12-26
> **版本**: 1.0.0

---

## 概述

Node Switch 是一个基于 Node.js + TypeScript 的硬件通信服务系统，用于继电器控制和语音播报。采用 monorepo 架构，支持 Web UI 配置管理。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 核心 | XState + TypeScript + UDP/TCP |
| 前端 | React 19 + Vite + TanStack + Tailwind |
| 后端 | Express + JWT + Pino |
| 共享 | Zod 验证 |

---

## 项目结构

| 部件 | 路径 | 描述 |
|------|------|------|
| Core | `src/` | 硬件通信核心 |
| Frontend | `packages/frontend/` | React 前端 |
| Backend | `packages/backend/` | Express API |
| Shared | `packages/shared/` | 共享库 |

---

## 快速开始

```bash
pnpm install
pnpm dev
```

---

## 文档索引

- [架构文档](./architecture.md)
- [组件清单](./component-inventory-root.md)
- [源码分析](./source-tree-analysis.md)
- [开发指南](./development-guide.md)
- [API 合约](./api-contracts-root.md)
- [数据模型](./data-models-root.md)
