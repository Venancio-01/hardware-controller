---
stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/prd.md', '_bmad-output/planning/architecture-go-rewrite.md', '_bmad-output/ux-design-specification.md']
workflowType: 'create-epics-and-stories'
project_name: 'node-switch-go'
user_name: '青山'
date: '2025-12-31'
---

# node-switch-go - Epic Breakdown

## Overview

本文档将 node-switch 项目的 PRD、UX 设计和架构需求分解为可实施的 Epic 和用户故事。

**重要说明：** 前端（React + shadcn/ui）已实现完成，本次重点是使用 Go 语言重写后端功能。

**推荐实施顺序：**
1. **Epic 1**: Go 项目基础与配置管理
2. **Epic 3**: 硬件通信模块 (Epic 2 依赖此模块)
3. **Epic 2**: 状态机实现
4. **Epic 4**: Web 服务与认证
5. **Epic 5**: 系统服务管理
6. **Epic 6**: 实时状态推送

## Requirements Inventory

### Functional Requirements

#### 配置管理功能
- **FR-001**: 显示配置 - 以可读格式显示当前系统和应用程序配置
- **FR-002**: 修改应用设置 - 通过 Web 界面允许修改应用程序级设置
- **FR-003**: 修改网络设置 - 通过 Web 界面允许修改系统级网络设置（IP 地址、网络参数）
- **FR-004**: 验证配置 - 保存前验证配置更改
- **FR-005**: 保存配置 - 将配置更改保存到 config.json5 文件
- **FR-006**: 安全认证 - 实现配置访问的安全身份验证
- **FR-007**: 视觉反馈 - 在保存操作期间提供视觉反馈
- **FR-008**: 导入导出 - 允许配置文件的导入/导出
- **FR-011**: 错误显示 - 明确显示配置验证错误
- **FR-012**: 测试网络 - 允许在应用前测试网络配置

#### 系统服务管理
- **FR-013**: 状态显示 - 显示系统服务状态（运行中/已停止/错误）
- **FR-014**: 重启系统 - 通过 Web 界面重启系统服务
- **FR-015**: 实时状态推送 - 通过 WebSocket 实时推送状态变化
- **FR-107**: 自动恢复 - Core 崩溃后自动重启（可配置重试次数）
- **FR-109**: 日志转发 - Core 日志统一管理
- **FR-111**: 启动超时 - 配置 Core 启动超时时间

#### 硬件控制与状态机
- **FR-201**: 钥匙开门报警 - 钥匙开关触发时立即触发报警
- **FR-202**: 振动报警 - 柜体振动开关触发时触发报警
- **FR-203**: 报警优先级处理 - 多种报警同时触发时的优先级处理
- **FR-204**: 取消报警操作 - 控制端取消报警

### NonFunctional Requirements

| ID | 需求描述 | Go 版本目标 |
|----|----------|------------|
| **NFR-001** | 界面加载时间 | < 1 秒 |
| **NFR-002** | 配置验证准确性 | 100% |
| **NFR-003** | 配置更改期间系统可用性 | 99.9% |
| **NFR-004** | 安全合规性遵守程度 | 100% |
| **NFR-005** | 内存使用 | ~25MB (减少 76%) |
| **NFR-006** | 启动时间 | < 100ms |
| **NFR-007** | Docker 镜像大小 | 2-13MB |
| **NFR-008** | 配置更改完成率 | > 95% |
| **NFR-009** | 完成常见配置任务的时间 | < 5 分钟 |
| **NFR-010** | 配置更改错误率 | < 2% |
| **NFR-011** | 配置更改部署加快 | 加快 50% |
| **NFR-012** | 配置相关任务耗时减少 | 减少 40% |

### Additional Requirements

#### 架构技术需求 (AR)
- **AR-001**: Go 1.21+ - 使用 Go 语言全面重写后端
- **AR-002**: 状态机框架 - 使用 looplab/fsm 替代 XState
- **AR-003**: 配置格式 - JSON5（支持注释和尾随逗号）
- **AR-004**: 日志方案 - 标准库 log/slog 零依赖结构化日志
- **AR-005**: 并发模型 - Goroutines + errgroup 管理
- **AR-006**: 硬件通信层 - UDP/TCP/Serial/Voice 客户端在独立 goroutines 运行
- **AR-007**: 前端保留 - React 前端保持不变，HTTP API 接口保持兼容
- **AR-008**: 单一二进制部署 - 静态二进制文件
- **AR-009**: 跨平台编译 - 支持 ARM/x86 交叉编译
- **AR-010**: 项目结构 - 遵循 Go 标准布局 (cmd/, internal/, pkg/)
- **AR-011**: 前端资源嵌入 - 使用 //go:embed 嵌入前端资源
- **AR-012**: HTTP/WebSocket 服务器 - 标准库 net/http 实现

#### UX 设计需求 (UX)
- **UX-001**: 设计系统 - shadcn/ui + Tailwind CSS（前端已实现）
- **UX-002**: 实时表单验证 - Zod schema 即时验证（前端已实现）
- **UX-003**: 配置页面布局 - 左侧仪表盘（1/3）+ 右侧配置表单（2/3）（前端已实现）
- **UX-004**: Toast 通知 - 保存/测试连接结果反馈（前端已实现）
- **UX-005**: Alert 提醒 - 重启提醒（前端已实现）
- **UX-006**: 响应式设计 - 1920x1080 基准（前端已实现）
- **UX-007**: 无障碍合规 - WCAG 2.1 AA（前端已实现）
- **UX-008**: 登录页面（前端已实现）
- **UX-009**: 配置历史页面（前端已实现）
- **UX-010**: 暗色模式支持（可选，前端已实现）

### FR Coverage Map

```
FR-001  → Epic 1 - 显示配置
FR-002  → Epic 5 - 修改应用设置
FR-003  → Epic 5 - 修改网络设置
FR-004  → Epic 1 - 验证配置
FR-005  → Epic 1 - 保存配置 (JSON5)
FR-006  → Epic 4 - 安全认证
FR-007  → Epic 4 - 视觉反馈（配合前端）
FR-008  → Epic 5 - 导入导出
FR-011  → Epic 1 - 错误显示
FR-012  → Epic 3 - 测试网络
FR-013  → Epic 5 - 状态显示
FR-014  → Epic 5 - 重启系统
FR-015  → Epic 6 - 实时状态推送
FR-107  → Epic 5 - 自动恢复
FR-109  → Epic 5 - 日志管理
FR-111  → Epic 5 - 启动超时
FR-201  → Epic 2 - 钥匙开门报警
FR-202  → Epic 2 - 振动报警
FR-203  → Epic 2 - 报警优先级处理
FR-204  → Epic 2 - 取消报警操作
```

## Epic List

### Epic 1: Go 项目基础与配置管理
**用户价值**: 管理员可以通过 Web 界面查看和修改系统配置，配置变更会被验证并安全保存。

**架构变更说明**: 本项目使用 Go 语言重写，采用单进程 + Goroutines 并发模型，替代原 Node.js 版本的 IPC 多进程模型。原 FR-101 (进程分离) 和 FR-104 (进程通信) 在此新架构下通过 Goroutines 管理和 Channel 通信隐式实现。

**功能范围**:
- Go 项目结构搭建（遵循标准布局）
- JSON5 配置文件加载和保存
- 配置验证（格式和依赖关系）
- HTTP API 端点实现（与前端兼容）

**FRs 覆盖**: FR-001, FR-004, FR-005, FR-011
**ARs 覆盖**: AR-001, AR-003, AR-004, AR-010

---

### Epic 2: 状态机实现
**用户价值**: 系统能够正确处理供弹业务流程和报警逻辑，硬件事件触发时状态正确转换。

**功能范围**:
- 使用 looplab/fsm 实现主状态机
- 实现申请供弹状态机
- 实现报警状态机（钥匙/振动/监控）
- 实现监控状态机（硬件输入检测）
- 状态机单元测试

**FRs 覆盖**: FR-201, FR-202, FR-203, FR-204
**ARs 覆盖**: AR-002

---

### Epic 3: 硬件通信模块
**用户价值**: 系统能够与柜体端、控制端和语音播报模块通信，继电器控制命令正确执行。

**功能范围**:
- UDP 客户端（柜体端通信）
- TCP 客户端（语音播报）
- 串口客户端（直接硬件控制）
- 继电器命令构建和发送
- 硬件管理器（errgroup 协调 goroutines）

**FRs 覆盖**: FR-012（网络测试）
**ARs 覆盖**: AR-005, AR-006

---

### Epic 4: Web 服务与认证
**用户价值**: 用户可以安全地访问配置界面，执行敏感操作需要身份验证。

**功能范围**:
- HTTP/WebSocket 服务器（标准库 net/http）
- 嵌入式 React 前端资源
- 身份认证中间件
- CORS 和安全头配置

**FRs 覆盖**: FR-006, FR-007
**ARs 覆盖**: AR-007, AR-008, AR-011, AR-012

---

### Epic 5: 系统服务管理
**用户价值**: 管理员可以查看系统运行状态，并在需要时重启系统服务以应用配置更改。

**功能范围**:
- 系统健康检查 API
- 系统状态查询 API
- 系统重启 API
- 配置导入/导出功能

**FRs 覆盖**: FR-002, FR-003, FR-008, FR-013, FR-014, FR-107, FR-109, FR-111

---

### Epic 6: 实时状态推送
**用户价值**: 用户可以实时看到系统状态变化，无需手动刷新页面。

**功能范围**:
- WebSocket 连接管理
- 状态变化事件推送
- 连接断开重连机制

**FRs 覆盖**: FR-015

---

## Epic 1: Go 项目基础与配置管理

### Epic Goal

管理员可以通过 Web 界面查看和修改系统配置，配置变更会被验证并安全保存。

### Story 1.1: 搭建 Go 项目骨架

As a 开发人员,
I want 创建符合 Go 标准布局的项目骨架,
So that 项目具有清晰的结构和可维护性。

**Acceptance Criteria:**

**Given** 新建的项目目录
**When** 创建项目结构
**Then** 生成以下目录结构:
  - `cmd/node-switch/` - 应用入口
  - `internal/config/` - 配置管理
  - `internal/api/` - HTTP API
  - `internal/logger/` - 日志模块
  - `pkg/types/` - 共享类型定义
**And** `go.mod` 文件包含项目依赖 (Go 1.21+)
**And** `main.go` 包含基本的应用启动代码
**And** 遵循 Go 社区标准项目布局

### Story 1.2: 实现 JSON5 配置加载

As a 开发人员,
I want 实现 JSON5 配置文件加载功能,
So that 配置文件支持注释和尾随逗号，更易于维护。

**Acceptance Criteria:**

**Given** 已存在的 config.json5 文件（包含注释和尾随逗号）
**When** 应用启动并加载配置
**Then** 使用 github.com/titanous/json5 正确解析配置文件
**And** 配置被加载到 Go 结构体中
**And** 忽略 JSON5 中的注释
**And** 支持尾随逗号
**And** 如果文件不存在，返回有意义的错误信息
**And** 如果 JSON5 格式无效，返回具体的解析错误

### Story 1.3: 实现配置验证

As a 系统,
I want 验证配置字段的格式和有效性,
So that 无效配置不会导致系统错误。

**Acceptance Criteria:**

**Given** 已加载的配置结构体
**When** 验证配置
**Then** IP 地址字段验证 IPv4 格式 (如 192.168.1.100)
**And** 端口号验证范围 1-65535
**And** 必填字段不为空
**And** 返回所有验证错误（不只是第一个）
**And** 错误消息清晰具体（如 "IP 地址格式无效"）
**And** 验证规则与前端 Zod schema 一致

### Story 1.4: 实现配置保存 API

As a 管理员,
I want 通过 HTTP API 保存配置更改,
So that 配置变更被持久化到 config.json5 文件。

**Acceptance Criteria:**

**Given** 用户通过前端提交配置更改
**When** POST 请求发送到 `/api/config`
**Then** 验证请求体的配置数据
**And** 如果验证失败，返回 400 错误和具体错误信息
**And** 如果验证成功，将配置写入 config.json5
**And** 使用 JSON5 格式保存（保留注释）
**And** 返回 200 成功响应
**And** 保存失败时返回 500 错误和错误详情
**And** API 端点与现有前端兼容

### Story 1.5: 实现配置查询 API

As a 管理员,
I want 通过 HTTP API 查询当前配置,
So that 前端可以显示当前系统配置。

**Acceptance Criteria:**

**Given** 前端需要显示当前配置
**When** GET 请求发送到 `/api/config`
**Then** 返回当前配置的 JSON 表示
**And** JSON 结构与前端期望一致
**And** 包含所有配置字段（应用、网络、硬件等）
**And** 返回 200 成功状态码
**And** 配置不存在时返回 404 错误
**And** API 端点与现有前端兼容

---

## Epic 2: 状态机实现

### Epic Goal

系统能够正确处理供弹业务流程和报警逻辑，硬件事件触发时状态正确转换。

### Story 2.1: 实现主状态机框架

As a 开发人员,
I want 使用 looplab/fsm 实现主状态机框架,
So that 系统状态转换有清晰的架构基础。

**Acceptance Criteria:**

**Given** 需要实现主状态机
**When** 创建主状态机
**Then** 使用 github.com/looplab/fsm 框架
**And** 定义状态: idle, normal, alarm
**And** 定义事件: apply_request, key_detected, vibration_detected, alarm_cancelled
**And** 实现 enter_idle, enter_normal, enter_alarm 回调
**And** 状态转换日志记录
**And** 状态机可测试（独立于硬件）

### Story 2.2: 实现申请供弹状态机

As a 系统,
I want 处理申请供弹业务流程,
So that 用户可以完成正常的供弹操作。

**Acceptance Criteria:**

**Given** 用户按下申请按钮
**When** 触发申请供弹流程
**Then** 状态从 idle → applying
**And** 点亮申请灯，播报"已申请，请等待授权"
**And** 授权通过时状态 applying → authorized
**And** 授权拒绝时状态 applying → idle
**And** 实现授权等待超时重试机制
**And** 柜门打开后进入 door_open 状态
**And** 柜门关闭后进入 waiting_lock_reset 状态
**And** 门锁拧回后进入 finished → idle
**And** 完成时播报"供弹完毕"

### Story 2.3: 实现报警状态机

As a 系统,
I want 处理钥匙开门和振动报警,
So that 安全事件得到及时响应。

**Acceptance Criteria:**

**Given** 检测到安全事件
**When** 触发报警流程
**Then** 钥匙开关触发时进入 key_alarm 状态
**And** 振动开关触发时进入 vibration_alarm 状态
**And** 开启柜体报警器和控制台报警器
**And** 柜体端和控制端播报相应语音
**And** 钥匙复位后播报"钥匙已复位，请取消报警"
**And** 钥匙复位后才能取消报警
**And** 振动报警可被钥匙报警抢占（优先级更高）
**And** 取消报警后状态回到 idle

### Story 2.4: 实现监控状态机

As a 系统,
I want 监控硬件输入变化和连接状态,
So that 硬件事件能被及时检测和上报。

**Acceptance Criteria:**

**Given** 硬件设备连接正常
**When** 硬件输入状态变化
**Then** 检测申请按钮 (CI0) 闭合 → 发送 apply_request 事件
**And** 检测柜门状态 (CI1) 变化 → 发送 cabinet_lock_changed 事件
**And** 检测门锁开关 (CI2) 变化 → 发送 door_lock_switch_changed 事件
**And** 检测钥匙开关 (CI3) 触发 → 发送 key_detected 事件
**And** 检测振动开关 (CI4) 触发 → 发送 vibration_detected 事件（带节流）
**And** 检测取消报警 (CTI8) 触发 → 发送 alarm_cancel_toggled 事件
**And** 检测授权通过 (CTI10) 触发 → 发送 authorize_request 事件
**And** 监控 TCP/Serial 连接状态
**And** 连接断开时发送 monitor_anomaly 事件
**And** 连接恢复时发送 monitor_recover 事件

### Story 2.5: 实现状态机单元测试

As a 开发人员,
I want 为所有状态机编写单元测试,
So that 状态转换逻辑的正确性得到验证。

**Acceptance Criteria:**

**Given** 已实现的所有状态机
**When** 编写单元测试
**Then** 覆盖主状态机的所有状态转换路径
**And** 覆盖申请供弹状态机的所有状态转换路径
**And** 覆盖报警状态机的所有状态转换路径
**And** 覆盖监控状态机的所有事件检测
**And** 测试授权等待超时重试机制
**And** 测试柜门超时处理
**And** 测试报警优先级抢占
**And** 测试钥匙复位验证
**And** 测试振动报警节流
**And** 测试边界条件（极速连续操作）
**And** 测试覆盖率 ≥ 80%

---

## Epic 3: 硬件通信模块

### Epic Goal

系统能够与柜体端、控制端和语音播报模块通信，继电器控制命令正确执行。

### Story 3.1: 实现 UDP 客户端

As a 系统,
I want 实现 UDP 客户端与柜体端通信,
So that 可以读取继电器状态和发送控制命令。

**Acceptance Criteria:**

**Given** 柜体端设备 IP 和端口配置
**When** 启动 UDP 客户端
**Then** 建立与柜体端的 UDP 连接
**And** 在独立 goroutine 中运行
**And** 实现继电器状态查询命令
**And** 实现继电器控制命令（开/关）
**And** 处理网络错误和重连
**And** 实现 errgroup 取消机制
**And** 使用 context 管理生命周期

### Story 3.2: 实现 TCP 客户端

As a 系统,
I want 实现 TCP 客户端与语音播报模块通信,
So that 可以播报语音提示。

**Acceptance Criteria:**

**Given** 语音播报模块 IP 和端口配置
**When** 启动 TCP 客户端
**Then** 建立与语音模块的 TCP 连接
**And** 在独立 goroutine 中运行
**And** 实现语音播报命令发送
**And** 支持所有播报类型（申请、授权、报警等）
**And** 处理连接断开和重连
**And** 实现 errgroup 取消机制
**And** 连接失败时记录日志但不影响其他模块

### Story 3.3: 实现串口客户端

As a 系统,
I want 实现串口客户端直接控制硬件,
So that 可以直接读取继电器状态和控制硬件。

**Acceptance Criteria:**

**Given** 串口设备路径配置（如 /dev/ttyUSB0）
**When** 启动串口客户端
**Then** 打开并配置串口（波特率、数据位等）
**And** 在独立 goroutine 中运行
**And** 实现继电器状态查询
**And** 实现继电器控制命令
**And** 处理串口断开和重连
**And** 实现 errgroup 取消机制
**And** 串口不可用时优雅降级

### Story 3.4: 实现硬件管理器

As a 系统,
I want 协调所有硬件客户端并发运行,
So that 硬件通信模块统一管理。

**Acceptance Criteria:**

**Given** 已实现的 UDP、TCP、串口客户端
**When** 启动硬件管理器
**Then** 使用 errgroup 管理所有客户端 goroutines
**And** 任何一个客户端失败时，其他客户端继续运行
**And** 实现 context 取消时优雅关闭所有客户端
**And** 提供硬件状态聚合接口
**And** 实现继电器命令队列（FIFO）
**And** 命令执行失败时记录日志
**And** 支持热重载配置（重启硬件客户端）

### Story 3.5: 实现网络测试功能

As a 管理员,
I want 测试网络配置是否正确,
So that 在应用配置前验证连接。

**Acceptance Criteria:**

**Given** 用户输入新的网络配置
**When** 用户点击"测试连接"按钮
**Then** API 端点接收测试请求
**And** 尝试连接配置的 UDP 目标地址
**And** 尝试连接配置的 TCP 目标地址
**And** 返回测试结果（成功/失败/超时）
**And** 失败时返回具体错误信息
**And** 测试操作不影响当前运行状态
**And** 测试超时时间 ≤ 5 秒

---

## Epic 4: Web 服务与认证

### Epic Goal

用户可以安全地访问配置界面，执行敏感操作需要身份验证。

### Story 4.1: 实现 HTTP 服务器

As a 开发人员,
I want 实现 HTTP 服务器托管前端和 API,
So that 用户可以通过浏览器访问系统。

**Acceptance Criteria:**

**Given** 已构建的 React 前端资源
**When** 启动 HTTP 服务器
**Then** 使用标准库 net/http 实现
**And** 使用 //go:embed 嵌入前端资源
**And** 服务端口可配置（默认 3000）
**And** 所有 API 路由以 /api/ 开头
**And** 非_API 路由返回 index.html（SPA 支持）
**And** 静态资源缓存头设置
**And** 支持 CORS（如果需要）
**And** 实现优雅关闭

### Story 4.2: 嵌入前端资源

As a 开发人员,
I want 将 React 前端资源嵌入 Go 二进制文件,
So that 部署时只需单一可执行文件。

**Acceptance Criteria:**

**Given** 已构建的前端 dist/ 目录
**When** 编译 Go 程序
**Then** 使用 //go:embed 指令嵌入前端资源
**And** 嵌入 index.html、CSS、JS 文件
**And** 嵌入字体和其他静态资源
**And** 运行时从内存提供文件（不依赖磁盘）
**And** 文件路径正确映射到 HTTP 路由
**And** 生产构建时验证嵌入成功

### Story 4.3: 实现身份认证中间件

As a 系统,
I want 实现身份认证中间件保护敏感 API,
So that 未授权用户无法修改系统配置。

**Acceptance Criteria:**

**Given** 用户访问受保护的 API 端点
**When** 请求到达认证中间件
**Then** 检查请求头中的认证令牌
**And** 令牌无效时返回 401 Unauthorized
**And** 令牌有效时允许请求继续
**And** 支持基本认证（用户名/密码）
**And** 密码使用哈希存储（不存储明文）
**And** 登录失败时记录日志
**And** 实现会话超时机制
**And** /api/config、/api/system/restart 等端点受保护
**And** /api/status、/api/config 查询端点可公开访问

### Story 4.4: 实现登录 API

As a 用户,
I want 通过 API 登录系统,
So that 我可以访问受保护的配置界面。

**Acceptance Criteria:**

**Given** 用户在前端输入用户名和密码
**When** POST 请求发送到 /api/auth/login
**Then** 验证用户名和密码
**And** 验证成功时返回认证令牌（JWT 或 session）
**And** 验证失败时返回 401 错误
**And** 密码错误时返回具体错误消息
**And** 实现请求速率限制（防止暴力破解）
**And** 登录成功时记录审计日志
**And** API 与前端登录组件兼容

### Story 4.5: 实现安全响应头

As a 系统,
I want 添加安全响应头,
So that 防止常见 Web 安全漏洞。

**Acceptance Criteria:**

**Given** HTTP 响应生成
**When** 添加安全头
**Then** 设置 X-Content-Type-Options: nosniff
**And** 设置 X-Frame-Options: DENY
**And** 设置 X-XSS-Protection: 1; mode=block
**And** 设置 Content-Security-Policy
**And** 设置 Strict-Transport-Security（如果使用 HTTPS）
**And** 移除 X-Powered-By 头
**And** 所有 API 响应包含安全头

---

## Epic 5: 系统服务管理

### Epic Goal

管理员可以查看系统运行状态，并在需要时重启系统服务以应用配置更改。

### Story 5.1: 实现健康检查 API

As a 系统,
I want 提供健康检查 API 端点,
So that 监控系统可以检测服务可用性。

**Acceptance Criteria:**

**Given** 监控系统或负载均衡器需要检查服务状态
**When** GET 请求发送到 /api/system/health
**Then** 返回 200 OK 状态码
**And** 响应体包含服务状态信息
**And** 包含启动时间和运行时长
**And** 包含版本信息
**And** 响应时间 < 100ms
**And** 不需要身份验证

### Story 5.2: 实现系统状态查询 API

As a 管理员,
I want 查询系统当前状态,
So that 我可以了解服务是否正常运行。

**Acceptance Criteria:**

**Given** 前端需要显示系统状态
**When** GET 请求发送到 /api/status
**Then** 返回当前系统状态 JSON
**And** 包含状态机当前状态（idle/normal/alarm）
**And** 包含硬件连接状态（UDP/TCP/Serial）
**And** 包含最后状态更新时间
**And** 包含配置摘要
**And** 返回 200 成功状态码
**And** API 与前端状态显示组件兼容

### Story 5.3: 实现配置修改 API

As a 管理员,
I want 通过 API 修改应用和网络配置,
So that 我可以调整系统参数。

**Acceptance Criteria:**

**Given** 用户在配置界面修改配置值
**When** POST 请求发送到 /api/config
**Then** 验证配置格式和依赖关系
**And** 验证通过时保存到 config.json5
**And** 返回成功响应
**And** 验证失败时返回 400 错误和具体错误信息
**And** 保存失败时返回 500 错误
**And** 需要身份认证
**And** 配置保存后触发重启提示事件

### Story 5.4: 实现配置导入功能

As a 管理员,
I want 导入配置文件,
So that 我可以快速应用预先准备的配置。

**Acceptance Criteria:**

**Given** 用户上传配置文件
**When** POST 请求发送到 /api/config/import
**Then** 解析上传的配置文件（支持 JSON5）
**And** 验证配置格式和有效性
**And** 验证失败时返回 400 错误和具体错误信息
**And** 验证成功时应用配置
**And** 保存到 config.json5
**And** 返回应用结果摘要
**And** 需要身份认证
**And** 文件格式错误时返回友好错误提示

### Story 5.5: 实现配置导出功能

As a 管理员,
I want 导出当前配置,
So that 我可以备份配置或应用到其他系统。

**Acceptance Criteria:**

**Given** 用户需要导出配置
**When** GET 请求发送到 /api/config/export
**Then** 返回当前配置的 JSON5 文件
**And** 设置 Content-Disposition 头（下载文件）
**And** 文件名包含时间戳（如 config-20250131.json5）
**And** 包含所有当前配置字段
**And** 格式化为可读的 JSON5（带缩进）
**And** 需要身份认证
**And** 返回 200 成功状态码

### Story 5.6: 实现系统重启 API

As a 管理员,
I want 通过 API 重启系统服务,
So that 配置更改可以生效。

**Acceptance Criteria:**

**Given** 用户点击重启按钮
**When** POST 请求发送到 /api/system/restart
**Then** 发送停止信号到硬件管理器
**And** 等待所有 goroutines 优雅关闭
**And** 重新加载配置
**And** 重新启动硬件客户端
**And** 重新初始化状态机
**And** 重启成功时返回 200 OK
**And** 重启失败时返回 500 错误和错误详情
**And** 重启时间 < 5 秒
**And** 需要身份认证
**And** WebSocket 客户端收到重启通知

### Story 5.7: 实现 Core 崩溃自动恢复

As a 系统,
I want 在 Core 运行时异常退出时自动恢复,
So that 系统具有高可用性和容错能力。

**Acceptance Criteria:**

**Given** 系统正在运行
**When** 核心业务 goroutine (如硬件管理器或状态机) 发生 panic
**Then** 使用 recover() 捕获 panic
**And** 记录堆栈跟踪日志
**And** 自动尝试重启受影响的组件
**And** 实现指数退避重试机制 (Exponential Backoff)
**And** 达到最大重试次数后停止并标记系统为 Error 状态
**And** 通过 WebSocket 推送系统错误状态

### Story 5.8: 实现统一日志管理

As a 开发人员,
I want 统一管理所有模块的日志,
So that 可以方便地进行故障排查和运维。

**Acceptance Criteria:**

**Given** 系统各模块 (HTTP, 硬件, 状态机) 在运行
**When** 产生日志事件
**Then** 使用 log/slog 标准库记录
**And** 包含结构化字段 (module, level, timestamp)
**And** 支持不同日志级别 (Debug, Info, Warn, Error)
**And** 日志输出到标准输出 (Systemd 可捕获)
**And** 敏感信息 (密码) 在日志中脱敏
**And** 关键错误日志支持上下文关联 (TraceID)

### Story 5.9: 实现启动超时机制

As a 系统,
I want 控制启动过程的超时时间,
So that 系统不会因为硬件连接卡死而无限挂起。

**Acceptance Criteria:**

**Given** 系统正在启动初始化
**When** 连接硬件或初始化资源
**Then** 设置全局启动超时时间 (如 30秒)
**And** 如果在超时时间内未完成初始化
**And** 中止启动流程
**And** 记录启动超时错误
**And** 进入"部分运行"或"维护模式"
**And** 允许管理员通过 Web 界面查看错误并重试

---

## Epic 6: 实时状态推送

### Epic Goal

用户可以实时看到系统状态变化，无需手动刷新页面。

### Story 6.1: 实现 WebSocket 服务器

As a 开发人员,
I want 实现 WebSocket 服务器,
So that 前端可以建立实时连接。

**Acceptance Criteria:**

**Given** 前端需要实时状态更新
**When** WebSocket 连接建立
**Then** 端点为 /ws
**And** 使用标准库 golang.org/x/net/websocket
**And** 支持连接升级
**And** 连接建立时发送初始状态
**And** 失败时返回适当的错误
**And** 支持并发连接
**And** 连接超时检测

### Story 6.2: 实现状态变化推送

As a 系统,
I want 在状态变化时推送更新到所有客户端,
So that 用户看到实时状态。

**Acceptance Criteria:**

**Given** WebSocket 客户端已连接
**When** 系统状态发生变化
**Then** 遍历所有活跃连接
**And** 发送状态更新 JSON 消息
**And** 包含变化类型（state_change、hardware_status、config_update）
**And** 包含新的状态值
**And** 包含时间戳
**And** 发送失败时记录日志并关闭连接
**And** 状态机状态变化时推送
**And** 硬件连接变化时推送

### Story 6.3: 实现连接管理和心跳

As a 系统,
I want 管理 WebSocket 连接和检测断开,
So that 连接可靠且资源正确释放。

**Acceptance Criteria:**

**Given** WebSocket 连接建立
**When** 连接活跃
**Then** 每 30 秒发送心跳消息
**And** 客户端 60 秒无响应时关闭连接
**And** 连接关闭时从活跃列表移除
**And** 优雅关闭时通知所有客户端
**And** 记录连接和断开日志
**And** 限制最大并发连接数（如 10）
**And** 连接被拒绝时返回友好错误
