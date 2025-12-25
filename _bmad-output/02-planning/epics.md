---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - prd.md
  - architecture.md
  - project-planning-artifacts/ux-design-specification.md
---

# node-switch - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for node-switch, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-001: 以可读格式显示当前系统和应用程序配置
FR-002: 通过 Web 界面允许修改应用程序级设置
FR-003: 通过 Web 界面允许修改系统级网络设置（IP 地址、网络参数）
FR-004: 保存前验证配置更改
FR-005: 将配置更改保存到 config.json 文件
FR-006: 实现配置访问的安全身份验证 (架构备注: 可选/MVP后)
FR-007: 在保存操作期间提供视觉反馈
FR-008: 允许配置文件的导入/导出
FR-009: 实现配置更改历史/备份
FR-010: 提供常见设置的配置模板
FR-011: 明确显示配置验证错误
FR-012: 允许在应用前测试网络配置
FR-013: 实现基于角色的访问控制 (低优先级)
FR-014: 提供配置更改审核日志 (低优先级)
FR-015: 添加暗色/亮色主题选项 (低优先级)
FR-016: 启用移动响应式界面 (低优先级)
FR-017: 允许通过 CSV 导入进行批量配置更改 (低优先级)
FR-018: 实时配置验证
FR-019: 检测配置冲突
FR-020: 安全配置传输

### NonFunctional Requirements

NFR-001: 界面加载时间 < 3 秒
NFR-002: 配置验证准确性 100% (双层 Zod 验证)
NFR-003: 配置更改期间的系统可用性 99.9%
NFR-004: 安全合规性遵守程度 100%
NFR-005: 技术栈兼容性: TypeScript 5.9.3, Node.js >=22.0.0, Zod v4.2.1, XState v5.12.1
NFR-006: 兼容 Chrome 浏览器 (PC端)
NFR-007: 支持分辨率 1920x1080 (基准) 和 1366x768 (最小)
NFR-008: 遵守 WCAG 2.1 AA 无障碍标准

### Additional Requirements

**Architecture:**
- **Starter Template**: Vite + React + TypeScript (with shadcn/ui). Use `npm create vite@latest web-ui -- --template react-ts`.
- **Monorepo Structure**: Implement pnpm workspaces with `packages/backend`, `packages/frontend`, `packages/shared`.
- **API Design**: Implement REST API with specific endpoints (`/api/config`, `/api/status`, etc.).
- **State Management**: Use TanStack Query for server state and react-hook-form + Zod for form state.
- **Backend Integration**: Create Express server to serve frontend and handle API requests.
- **Config Backup**: Automatic backup to `config.backup.json` before save.
- **Device Status**: Poll `/api/status` every 5 seconds.
- **File Structure**: Follow specific directory structure for backend, frontend, and shared packages.

**UX Design:**
- **Core Experience**: "状态可见的配置向导" (State-visible configuration wizard).
- **Dashboard**: Left sidebar (1/3 width) showing real-time device status.
- **Form Layout**: Double-column grid for 1080p screens.
- **Validation Feedback**: Real-time inline validation (Green check / Red X).
- **Restart Notification**: Non-dismissible top Alert bar + Toast notification after save.
- **Visual Style**: shadcn/ui default theme with Tailwind CSS.

### FR Coverage Map

| FR ID | Description | Mapped Epic |
|-------|-------------|-------------|
| FR-001 | 以可读格式显示当前系统和应用程序配置 | Epic 1 |
| FR-002 | 通过 Web 界面允许修改应用程序级设置 | Epic 2 |
| FR-003 | 通过 Web 界面允许修改系统级网络设置 | Epic 3 |
| FR-004 | 保存前验证配置更改 | Epic 2, Epic 3 |
| FR-005 | 将配置更改保存到 config.json 文件 | Epic 2, Epic 3 |
| FR-006 | 实现配置访问的安全身份验证 | Epic 1 |
| FR-007 | 在保存操作期间提供视觉反馈 | Epic 2 |
| FR-008 | 允许配置文件的导入/导出 | Epic 4 |
| FR-009 | 实现配置更改历史/备份 | Epic 4 |
| FR-010 | 提供常见设置的配置模板 | Epic 4 |
| FR-011 | 明确显示配置验证错误 | Epic 2 |
| FR-012 | 允许在应用前测试网络配置 | Epic 3 |
| FR-013 | 实现基于角色的访问控制 | Epic 5 |
| FR-014 | 提供配置更改审核日志 | Epic 5 |
| FR-015 | 添加暗色/亮色主题选项 | Epic 5 |
| FR-016 | 启用移动响应式界面 | Deferred (Out of Scope) |
| FR-017 | 允许通过 CSV 导入进行批量配置更改 | Deferred (Out of Scope) |
| FR-018 | 实时配置验证 | Epic 2 |
| FR-019 | 检测配置冲突 | Epic 3 |
| FR-020 | 安全配置传输 | Epic 3 |

## Epic List

## Epic 1: 核心配置界面与状态监控 (Core Configuration & Monitoring)

**Goal:** 建立项目基础架构，并为用户提供一个可访问的 Web 界面，用于查看设备实时连接状态和当前的只读配置信息。这是所有后续交互的基础。

### Story 1.1: 初始化单仓库基础架构 (Monorepo Setup)

As a 开发人员,
I want 建立基于 pnpm workspaces 的单仓库结构,
So that 我可以在统一的环境中管理后端、前端和共享代码，并确保依赖关系正确。

**Acceptance Criteria:**

**Given** 一个空的或初始化的项目目录
**When** 我运行初始化脚本和安装命令
**Then** 应创建 `packages/backend`, `packages/frontend`, `packages/shared` 三个包目录
**And** 根目录 `pnpm-workspace.yaml` 配置正确
**And** 所有包的 `tsconfig.json` 配置正确且相互兼容
**And** 运行 `pnpm build` 可以成功构建所有包

### Story 1.2: 建立共享验证架构 (Shared Validation)

As a 开发人员,
I want 定义共享的 Zod 验证 schemas,
So that 前端表单和后端 API 可以使用同一套规则验证配置数据，保证数据一致性。

**Acceptance Criteria:**

**Given** 已初始化的 `packages/shared` 目录
**When** 我在 `src/schemas/config.schema.ts` 中定义 Zod schema
**Then** Schema 应包含 IP 地址、子网掩码、网关、端口等字段的验证规则
**And** 应该导出 TypeScript 类型定义 `Config`
**And** 前端和后端包都应该能够导入并使用这些 schemas
**And** 单元测试应验证 schema 能正确识别有效和无效数据

### Story 1.3: 开发后端 API 骨架 (Backend Skeleton)

As a 系统管理员,
I want 后端服务能够读取当前的 `config.json` 文件并提供 API,
So that 前端可以获取并显示当前的配置信息。

**Acceptance Criteria:**

**Given** `packages/backend` 已初始化且 `config.json` 存在
**When** 我启动后端服务并请求 `GET /api/config`
**Then** 应返回 HTTP 200 和正确的 JSON 配置数据
**And** 如果 `config.json` 不存在或格式错误，应返回适当的错误代码
**And** 后端应集成 Pino 日志记录请求
**And** 应实现 `ConfigService` 类来封装文件读取逻辑

### Story 1.4: 构建前端仪表盘布局 (Frontend Dashboard)

As a 用户,
I want 访问 Web 界面看到设备状态和当前配置,
So that 我可以确认设备是否在线并了解当前参数。

**Acceptance Criteria:**

**Given** 后端服务正在运行
**When** 我在浏览器访问前端页面
**Then** 应看到 shadcn/ui 风格的双列布局页面
**And** 左侧仪表盘应显示设备状态（在线/离线）和连接信息
**And** 右侧应以只读方式显示当前的配置信息（从 API 获取）
**And** 页面加载时间应小于 3 秒

### Story 1.5: 实现基础身份验证 (Basic Auth)

As a 系统管理员,
I want 系统有基本的登录保护,
So that 未授权的人员无法修改设备配置。

**Acceptance Criteria:**

**Given** 未登录用户访问系统
**When** 尝试进入配置页面
**Then** 应被重定向到 `/login`
**And** 后端 API 应验证请求头中的认证信息（如 Basic Auth 或 Token）
**And** 默认账号密码应可配置
**And** 前端登录页面应显示包含用户名和密码输入框的表单
**And** 表单应使用 shadcn/ui 组件并具有基础验证（非空检查）
**And** 点击登录按钮后，若验证通过，应跳转至仪表盘页面
**And** 界面风格应与整体应用保持一致

## Epic 2: 应用程序配置与验证 (Application Configuration)

**Goal:** 允许用户修改低风险的应用程序级别设置（如超时、重试策略等），并提供强大的实时验证和交互反馈机制。

### Story 2.1: 实现应用程序配置表单 (App Config Form)

As a 用户,
I want 在 Web 界面上修改应用程序配置,
So that 我可以调整应用参数而无需编辑文件。

**Acceptance Criteria:**

**Given** 我在仪表盘页面点击“编辑配置”或直接访问配置表单
**When** 我修改表单字段
**Then** 输入内容应通过 Zod schema 进行实时验证
**And** 验证通过时显示绿色指示，失败时显示红色错误信息
**And** 保存按钮在表单无效时应处于禁用状态

### Story 2.2: 实现后端配置更新 API (Config Update API)

As a 系统,
I want 接收并处理前端发送的配置更新请求,
So that 用户的更改可以被持久化保存。

**Acceptance Criteria:**

**Given** 前端发送有效的 `PUT /api/config` 请求
**When** 后端接收到请求
**Then** 应使用共享的 Zod schema 验证请求数据
**And** 验证失败应返回 400 错误和详细信息
**And** 验证通过应将数据写入 `config.json` 文件
**And** 写入前应自动创建配置文件的备份

### Story 2.3: 实现保存反馈机制 (Save Feedback)

As a 用户,
I want 在保存配置后获得明确的反馈,
So that 我知道操作是否成功以及下一步该做什么。

**Acceptance Criteria:**

**Given** 我点击了保存按钮
**When** 保存操作正在进行
**Then** 按钮应显示加载状态
**When** 保存成功完成
**Then** 右下角应弹出绿色的 Toast 通知“配置已保存”
**And** 顶部应显示不可忽略的 Alert 提示“需要重启系统才能生效”
**When** 保存失败
**Then** 应弹出红色的 Toast 通知并显示错误原因

## Epic 3: 网络配置与连接安全 (Network Configuration & Safety)

**Goal:** 允许用户修改高风险的系统级网络设置（IP、子网、端口），并引入连接测试和冲突检测机制，防止错误配置导致设备失联。

### Story 3.1: 实现网络配置表单与验证 (Network Config Form)

As a 用户,
I want 修改 IP 地址等网络设置并获得严格的验证,
So that 我可以更改网络环境配置而不会输入无效的 IP。

**Acceptance Criteria:**

**Given** 用户在编辑网络配置部分
**When** 用户输入 IP 地址、子网掩码或网关
**Then** 系统应实时验证格式是否符合 IPv4 标准
**And** 如果网关不在子网内，应提示警告
**And** 端口号应限制在 1-65535 范围内

### Story 3.2: 实现连接测试 API (Connection Test API)

As a 系统管理员,
I want 在保存前测试新配置的连接性,
So that 我可以确保新配置能够正常工作。

**Acceptance Criteria:**

**Given** 用户输入了新的网络配置
**When** 用户点击“测试连接”按钮
**Then** 前端应发送测试请求到 `POST /api/system/test-connection`
**And** 后端应尝试使用新参数（如 ping 或建立 socket 连接）
**And** 返回测试结果（成功/失败及延迟时间）

### Story 3.3: 冲突检测与安全保存 (Conflict & Safe Save)

As a 系统,
I want 在保存网络配置前检测潜在冲突,
So that 避免 IP 地址冲突或配置错误导致设备失联。

**Acceptance Criteria:**

**Given** 用户尝试保存网络配置
**When** 点击保存按钮
**Then** 系统应先执行冲突检测（如检查 IP 是否已被占用）
**And** 如果检测到冲突，应阻止保存并显示严重警告
**And** 如果无冲突，继续执行保存流程并提示重启

## Epic 4: 系统控制与生命周期管理 (System Control & Lifecycle)

**Goal:** 提供完整的配置生命周期管理工具，包括配置文件的备份、恢复、导入/导出、模板应用，以及使配置生效的系统重启控制。

### Story 4.1: 实现系统重启功能 (System Restart)

As a 用户,
I want 能够通过 Web 界面重启系统,
So that 新的配置更改可以生效。

**Acceptance Criteria:**

**Given** 用户完成了配置保存
**When** 用户点击“立即重启”按钮
**Then** 系统应弹出确认对话框
**And** 确认后发送 `POST /api/system/restart` 请求
**And** 后端应执行 graceful shutdown 并重启进程
**And** 前端应显示重启进度并在重启完成后自动重连

### Story 4.2: 实现配置导入/导出 (Import/Export)

As a 系统管理员,
I want 导出当前配置并在其他设备上导入,
So that 我可以快速复制配置或备份设置。

**Acceptance Criteria:**

**Given** 用户在配置页面
**When** 点击“导出配置”
**Then** 浏览器应下载当前的 `config.json` 文件
**When** 点击“导入配置”并上传文件
**Then** 系统应验证文件格式和内容有效性
**And** 验证通过后应用配置并提示重启

### Story 4.3: 实现配置模板 (Config Templates)

As a 用户,
I want 能够应用预设的配置模板,
So that 我可以快速设置常见场景的配置而无需手动输入。

**Acceptance Criteria:**

**Given** 系统提供配置模板选项
**When** 用户访问“配置模板”面板
**Then** 应显示可用的配置模板列表（如默认模板、生产环境模板、测试环境模板等）
**And** 用户可以选择一个模板并预览配置内容
**And** 用户确认后，模板配置应填充到当前配置表单
**And** 应用模板后应有确认提示，提醒用户可以进一步修改并保存

### Story 4.4: 实现配置历史与回滚 (History & Rollback)

As a 用户,
I want 查看配置更改历史并能回滚,
So that 我可以在配置出错时恢复到之前的状态。

**Acceptance Criteria:**

**Given** 系统已运行并有过配置修改
**When** 用户访问“配置历史”面板
**Then** 应显示最近的配置备份列表（按时间排序）
**And** 点击某个备份可查看详情或选择“恢复此版本”
**And** 恢复后应自动保存并提示重启

## Epic 5: 增强个性化与可访问性 (Enhancements & Accessibility)

**Goal:** 为配置工具添加个性化体验和增强可访问性，提升系统的可用性。

### Story 5.1: 实现主题切换 (Theme Switcher)

As a 用户,
I want 能够切换暗色/亮色主题,
So that 我可以在不同光线环境下舒适地使用。

**Acceptance Criteria:**

**Given** 用户在界面上
**When** 点击主题切换按钮
**Then** 界面应平滑过渡到暗色/亮色模式
**And** 用户的偏好应被保存在本地存储中，下次访问自动应用
