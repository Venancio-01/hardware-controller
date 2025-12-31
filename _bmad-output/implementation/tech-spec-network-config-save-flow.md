# 技术规范：网络配置集成保存流程

**创建时间：** 2025-12-31
**状态：** 准备开发

## 概述

### 问题陈述
用户希望将网络配置（IP地址、子网掩码、网关）集成到应用程序的主要"保存"工作流程中。目前，网络配置可能是独立的，或者未与主要硬件配置的保存操作集成。更改网络设置存在断开连接的风险，需要向用户发出警告。应用网络设置后，应用程序应重定向到新 IP 地址的 3000 端口。

### 解决方案
将 `NetworkConfigForm` 状态集成到主 `ConfigForm` 中，修改"保存"按钮以同时处理硬件和网络变更。
- 检测网络设置是否已更改。
- 如果已更改，显示风险警告对话框。
- 首先保存硬件设置（如果已更改）。
- 然后应用网络设置。
- 成功后，将浏览器重定向到新的 IP 地址。

### 范围（包含/不包含）
**包含范围：**
- 前端：`ConfigForm.tsx`、`NetworkConfigForm.tsx`、`HeaderActions.tsx`
- 逻辑：合并表单状态、顺序保存、模态对话框、重定向

**不包含范围：**
- 后端 API 更改（假设 `nmcli` 和配置 API 正常工作）
- 其他配置部分（如串口）的逻辑更改，除非它们影响保存流程

## 开发背景

### 代码库模式
- **React Hook Form**：用于表单状态管理
- **TanStack Query**：用于数据获取和变更
- **Tailwind CSS + Shadcn UI**：用于 UI 组件
- **TypeScript**：严格类型检查

### 参考文件
- `packages/frontend/src/components/dashboard/ConfigForm.tsx`：主父表单
- `packages/frontend/src/components/config/NetworkConfigForm.tsx`：子表单（待重构）
- `packages/frontend/src/hooks/useApplyNetwork.ts`：网络 API hooks
- `packages/frontend/src/hooks/useUpdateConfig.ts`：配置 API hooks

### 技术决策
- **单一表单 vs 嵌套表单**：我们将保持 UI 模块化，但可能需要分离的状态或共享上下文。鉴于 `NetworkConfigForm` 目前是独立的，我们需要将状态提升，或者使用转发的 ref/hook 从 `ConfigForm` 的保存处理器访问 `NetworkConfigForm` 的值，或者简单地将它们合并到 `ConfigForm` 中的一个大型 `useForm` 中。
*决策*：尽可能在 `ConfigForm` 中合并为单个 `useForm`，以便更轻松地跟踪脏状态；或者保持分离并检查两者的脏状态。对于"全局保存"而言，合并更简洁。

## 实施计划

### 任务

- [ ] **重构 NetworkConfigForm**：使其成为受控组件，或接受来自父 `ConfigForm` 的 `control`/`register`。移除其自身的"应用"按钮。
- [ ] **更新 ConfigForm**：
    - [ ] 使用硬件配置和网络配置初始化表单。
    - [ ] 添加网络字段变更的跟踪。
    - [ ] 实现 `handleGlobalSave` 函数。
- [ ] **实现保存逻辑**：
    - [ ] 使用 `dirtyFields` 检查网络变更。
    - [ ] 如果网络已更改 -> 显示警告对话框。
    - [ ] 如果确认 -> `await saveHardware()` -> `await applyNetwork()`。
    - [ ] 如果仅硬件更改 -> `saveHardware()`。
- [ ] **实现重定向**：
    - [ ] 在 `applyNetwork` 成功时，`window.location.href = http://${newIP}:3000`。

### 验收标准

- [ ] AC 1：当用户仅更改硬件设置并点击保存时，显示标准重启对话框。
- [ ] AC 2：当用户更改网络设置（以及可选的硬件设置）时，点击保存显示"风险警告"对话框。
- [ ] AC 3：确认风险警告后，先保存硬件（如果功能已更改），然后保存网络。
- [ ] AC 4：网络保存成功后，页面重定向到 `http://<new_ip>:3000`。
- [ ] AC 5：网络配置表单不再有自身的"应用"按钮；它是全局保存的一部分。

## 其他背景

### 依赖项
- 后端 `nmcli` 包装器必须可靠。
- 前端必须能够访问 `window.location`。

### 测试策略
- 手动测试所有 3 种路径（仅硬件、仅网络、混合）。
- 提交前验证 IP 地址格式。

### 注意事项
- 确保根据要求硬编码端口 3000。
