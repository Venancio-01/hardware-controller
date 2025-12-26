# 开发指南

> **生成日期**: 2025-12-26

---

## 1. 环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | >= 22.0.0 |
| pnpm | 推荐 |

---

## 2. 快速开始

### 2.1 安装依赖

```bash
pnpm install
```

### 2.2 环境配置

```bash
cp .env.example .env
```

编辑 `.env` 文件配置硬件地址：

```bash
# 柜体端
CABINET_TARGET_HOST=192.168.1.101
CABINET_TARGET_PORT=8000

# 控制端
CONTROL_TARGET_HOST=192.168.1.102
CONTROL_TARGET_PORT=8000

# 语音模块
VOICE_BROADCAST_HOST=192.168.1.103
VOICE_BROADCAST_PORT=50000

# 轮询间隔
QUERY_INTERVAL=1000
```

### 2.3 开发模式

```bash
# 启动所有包
pnpm dev

# 仅前端
pnpm --filter frontend dev

# 仅后端
pnpm --filter backend dev
```

---

## 3. 构建

```bash
# 构建所有包
pnpm build

# 仅构建共享库
pnpm --filter shared build
```

---

## 4. 测试

```bash
# 运行所有测试
pnpm test

# 特定包测试
pnpm --filter frontend test
pnpm --filter backend test

# 监听模式
pnpm --filter frontend test:watch
```

---

## 5. 代码规范

- **TypeScript**: 严格模式
- **ESM**: 项目使用 ES Modules
- **Zod**: 前后端统一验证
- **Pino**: 结构化日志

---

## 6. 目录约定

| 目录 | 用途 |
|------|------|
| `src/` | 核心硬件服务 |
| `packages/frontend/` | React 前端 |
| `packages/backend/` | Express API |
| `packages/shared/` | 共享代码 |
| `docs/` | 项目文档 |
| `test/` | 测试文件 |
