# 组件清单

> **生成日期**: 2025-12-26
> **扫描模式**: 完全扫描

---

## 1. 前端组件 (packages/frontend/src/components/)

### 1.1 Dashboard 组件

| 组件 | 文件 | 描述 |
|------|------|------|
| `ConfigForm` | dashboard/ConfigForm.tsx | 配置表单主组件，集成react-hook-form和zod验证 |
| `AppConfigCard` | dashboard/AppConfigCard.tsx | 应用程序配置卡片 |
| `NetworkConfigCard` | dashboard/NetworkConfigCard.tsx | 网络配置卡片 |

### 1.2 布局组件

| 组件 | 文件 | 描述 |
|------|------|------|
| Sidebar | layout/Sidebar.tsx | 侧边栏导航 |
| Header | layout/Header.tsx | 顶部导航栏 |

### 1.3 系统组件

| 组件 | 文件 | 描述 |
|------|------|------|
| `RestartButton` | system/RestartButton.tsx | 系统重启按钮 |

### 1.4 配置组件

| 组件 | 文件 | 描述 |
|------|------|------|
| `NetworkConfigForm` | config/NetworkConfigForm.tsx | 网络配置表单 |

### 1.5 UI 组件库 (Shadcn/ui)

| 组件 | 用途 |
|------|------|
| Alert | 警告提示 |
| AlertDialog | 模态确认对话框 |
| Button | 按钮 |
| Card | 卡片容器 |
| Checkbox | 复选框 |
| Dialog | 对话框 |
| Form | 表单包装器 |
| Input | 输入框 |
| Label | 标签 |
| Select | 下拉选择 |
| Separator | 分隔线 |
| Skeleton | 加载骨架屏 |
| Switch | 开关 |
| Toast | 消息提示 |

---

## 2. 后端服务 (packages/backend/src/services/)

| 服务 | 文件 | 描述 |
|------|------|------|
| `ConfigService` | config.service.ts | 配置读写服务 |
| `ConfigImportExportService` | config-import-export.service.ts | 配置导入导出 |
| `RestartService` | restart.service.ts | 系统重启服务 |
| `ConflictDetectionService` | conflict-detection.service.ts | 配置冲突检测 |
| `ConnectionTestService` | connection-test.service.ts | 网络连接测试 |
| `StatusService` | status.service.ts | 系统状态服务 |

---

## 3. 核心模块 (src/)

### 3.1 状态机

| 状态机 | 文件 | 描述 |
|--------|------|------|
| `mainMachine` | state-machines/main-machine.ts | 主状态机，管理整体流程 |
| `applyAmmoMachine` | state-machines/apply-ammo-machine.ts | 供弹申请流程状态机 |
| `monitorMachine` | state-machines/monitor-machine.ts | 设备监控状态机 |
| `alarmMachine` | state-machines/alarm-machine.ts | 报警处理状态机 |

### 3.2 硬件模块

| 模块 | 文件 | 描述 |
|------|------|------|
| `HardwareCommunicationManager` | hardware/manager.ts | 统一硬件通信管理 |
| Hardware Initializer | hardware/initializer.ts | 硬件初始化 |

### 3.3 继电器模块

| 模块 | 文件 | 描述 |
|------|------|------|
| `RelayCommandBuilder` | relay/controller.ts | 继电器命令构建器 |
| Relay Reset | relay/reset.ts | 继电器重置 |
| Relay Validation | relay/validation.ts | 继电器验证 |

### 3.4 语音播报模块

| 模块 | 文件 | 描述 |
|------|------|------|
| `VoiceBroadcastController` | voice-broadcast/index.ts | 语音播报控制器 |
| Voice Initializer | voice-broadcast/initializer.ts | 语音模块初始化 |

### 3.5 通信客户端

| 客户端 | 文件 | 描述 |
|--------|------|------|
| `UDPClient` | udp/client.ts | UDP 通信客户端 |
| `TCPClient` | tcp/client.ts | TCP 通信客户端 |

### 3.6 业务逻辑

| 模块 | 文件 | 描述 |
|------|------|------|
| `RelayStatusAggregator` | business-logic/relay-status-aggregator.ts | 继电器状态聚合器 |

---

## 4. 共享模块 (packages/shared/src/)

### 4.1 Schemas

| Schema | 文件 | 描述 |
|--------|------|------|
| `configSchema` | schemas/config.schema.ts | 配置验证 |
| `networkConfigSchema` | schemas/network.schema.ts | 网络配置验证 |
| `deviceStatusSchema` | schemas/device.schema.ts | 设备状态验证 |
| `apiResponseSchema` | schemas/api-response.schema.ts | API响应验证 |
| `loginRequestSchema` | schemas/auth.schema.ts | 登录验证 |
| `testConnectionRequestSchema` | schemas/test-connection.schema.ts | 连接测试验证 |
| `conflictDetectionRequestSchema` | schemas/conflict-detection.schema.ts | 冲突检测验证 |

### 4.2 Types

| 类型 | 文件 | 描述 |
|------|------|------|
| `Config` | types/config.types.ts | 配置类型 |
| `NetworkConfig` | types/network.types.ts | 网络配置类型 |
| `DeviceStatus` | types/device.types.ts | 设备状态类型 |
| `ApiResponse` | types/api.types.ts | API响应类型 |

---

## 5. 自定义 Hooks (packages/frontend/src/hooks/)

| Hook | 描述 |
|------|------|
| `useUpdateConfig` | 配置更新，处理API调用和Toast提示 |
| `useImportExportConfig` | 配置导入导出 |
| `useRestartSystem` | 系统重启 |
