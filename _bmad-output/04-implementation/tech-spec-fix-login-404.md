# Tech-Spec: 修复前端 API 代理配置解决 404 错误

**创建时间:** 2025-12-26
**状态:** ✅ 已完成
**优先级:** 高（阻塞性问题）
**完成时间:** 2025-12-26

## 概述

### 问题陈述

前端调用登录 API (`/api/auth/login`) 时收到 404 错误，导致用户无法登录。经排查，问题根源是 Vite 开发服务器缺少代理配置，导致 API 请求没有被转发到后端服务器。

### 解决方案

在 `packages/frontend/vite.config.ts` 中配置 Vite 代理，将 `/api/*` 请求转发到后端服务器（`http://localhost:3000`）。

### 范围

**包含:**
- 配置 Vite 开发服务器代理
- 测试登录 API 调用是否成功
- 验证其他 API 路由也正常工作

**不包含:**
- 生产环境的部署配置
- API 路由的修改
- 前端登录逻辑的修改

## 开发上下文

### 代码库模式

**项目结构:**
- monorepo 结构，使用 pnpm workspace
- 前端: `packages/frontend/` - Vite + React
- 后端: `packages/backend/` - Express + TypeScript
- 共享: `packages/shared/` - 共享类型和验证

**端口配置:**
- 前端开发服务器: `localhost:5173`
- 后端 API 服务器: `localhost:3000`

**现有配置:**
- 后端已在 `server.ts` 中正确配置路由: `app.use('/api/auth', authRoutes)`
- 前端 `apiFetch` 工具正确使用相对路径 `/api/auth/login`
- **缺失:** Vite 代理配置

### 需要参考的文件

1. **packages/frontend/vite.config.ts** - 需要修改
   - 当前只有基础配置，缺少 `server.proxy` 字段

2. **packages/backend/src/server.ts** - 路由配置参考
   - 确认后端监听端口 3000
   - 确认所有 API 路由都在 `/api` 前缀下

3. **packages/frontend/src/lib/api.ts** - API 调用工具
   - 使用相对路径调用 API（如 `/api/auth/login`）

4. **packages/frontend/src/contexts/auth.context.tsx** - 登录逻辑
   - 第 10 行: `apiFetch<LoginResponse>('/api/auth/login', ...)`

### 技术决策

**为什么选择 Vite 代理而不是其他方案:**

1. **开发环境标准方案** - Vite 官方推荐在开发环境使用代理处理跨域
2. **无需修改前端代码** - API 调用使用相对路径，保持代码简洁
3. **自动重写** - 代理会自动处理路径转发，无需额外配置
4. **热重载友好** - 代理配置修改后会自动生效

**替代方案（未采用）:**
- ❌ 在前端使用绝对路径 (`http://localhost:3000/api/...`) - 需要修改多处代码，且不利于生产环境部署
- ❌ 配置 CORS 允许直接跨域访问 - 安全性较低，不符合最佳实践

## 实现计划

### 任务

- [x] **任务 1: 在 vite.config.ts 中添加代理配置**
  - 在 `server` 对象中添加 `proxy` 字段
  - 配置 `/api` 路径的代理规则，转发到 `http://localhost:3000`
  - 可选: 添加 `changeOrigin` 和 `rewrite` 配置以获得更好的兼容性

- [ ] **任务 2: 重启开发服务器并测试** ⚠️ 需要用户执行
  - 停止当前 Vite 开发服务器
  - 重新启动前端开发服务器
  - 确认代理配置已加载（检查启动日志）

- [ ] **任务 3: 测试登录功能** ⚠️ 需要用户执行
  - 打开浏览器登录页面
  - 输入测试账号密码（根据 `auth.config.ts` 中的配置）
  - 验证登录是否成功
  - 检查浏览器 Network 面板，确认请求被正确代理

- [ ] **任务 4: 验证其他 API 路由** ⚠️ 需要用户执行
  - 测试配置相关的 API（需要认证的请求）
  - 测试系统状态 API
  - 确认所有 `/api/*` 请求都能正常工作

### 验收标准

- [ ] **AC 1:** Given 用户在登录页面输入有效凭据，When 点击登录按钮，Then 请求被成功代理到后端并返回 token
- [ ] **AC 2:** Given Vite 开发服务器启动，When 检查控制台输出，Then 无代理配置相关错误
- [ ] **AC 3:** Given 登录成功后，When 访问受保护的页面，Then 认证状态正确显示
- [ ] **AC 4:** Given API 请求失败，When 查看浏览器控制台，Then 错误信息清晰明确

## 附加上下文

### 依赖项

**无新增依赖** - 使用 Vite 内置的代理功能（基于 http-proxy）

### 测试策略

1. **手动测试** - 在浏览器中测试登录流程
2. **网络面板检查** - 使用浏览器开发工具查看请求是否被正确代理
   - 检查请求 URL 是否为 `http://localhost:5173/api/auth/login`
   - 检查响应是否来自后端（应该包含 token）
3. **日志验证** - 检查后端日志，确认收到请求

### 测试账号

根据 `packages/backend/src/config/auth.config.ts` 中的配置:
- 用户名: 查看 `authConfig.username`
- 密码: 查看 `authConfig.password`

### 注意事项

⚠️ **仅开发环境配置**
- 此代理配置仅在开发环境生效（`vite dev`）
- 生产环境部署时需要单独的反向代理配置（如 Nginx）
- 不需要在 `vite.config.ts` 中添加生产环境配置

⚠️ **端口一致性**
- 确保后端服务器在端口 3000 运行
- 如果后端端口更改，需要同步更新代理配置

⚠️ **路径前缀**
- 所有后端 API 都在 `/api` 前缀下
- 代理配置应该匹配 `/api` 而不是单个路径

## 参考资源

- [Vite 官方文档 - 代理配置](https://vitejs.dev/config/server-options.html#server-proxy)
- [http-proxy 中间件文档](https://github.com/http-party/node-http-proxy#options)
- 项目中其他配置文件参考: `packages/backend/src/server.ts`

---

## 实现总结

### 已完成工作

1. **代理配置添加** ✅ (packages/frontend/vite.config.ts:19-24)
   - 在 `server` 对象中添加了 `proxy` 字段
   - 配置 `/api` 路径转发到 `http://localhost:3000`
   - 启用 `changeOrigin: true` 处理跨域问题

### 待验证工作（需要用户手动测试）

2. **重启开发服务器** - 配置需要重启 Vite 才能生效
3. **登录功能测试** - 验证 `/api/auth/login` 请求成功代理
4. **其他 API 路由验证** - 确保所有 `/api/*` 路径正常工作

### 代码变更

- **修改文件**: `packages/frontend/vite.config.ts`
- **变更行数**: +5 行（代理配置）
- **风险等级**: 低（仅开发环境配置）

---

**用户测试指南:**

1. 重启前端开发服务器:
   ```bash
   cd packages/frontend
   pnpm dev
   ```

2. 确保后端服务器在运行 (端口 3000)

3. 在浏览器中测试登录功能

4. 检查浏览器 Network 面板，验证请求被正确代理

---

**状态:** 实现完成，等待用户测试验证
