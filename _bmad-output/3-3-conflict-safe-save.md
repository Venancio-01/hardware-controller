---
story_key: "3-3-conflict-safe-save"
story_title: "冲突检测与安全保存"
epic: "Epic 3: 网络配置与连接安全"
status: "ready-for-dev"
author: "青山"
date: "2025-12-25"
---

# 故事 3.3: 冲突检测与安全保存 (Conflict & Safe Save)

## 用户故事
```
As a 系统,
I want 在保存网络配置前检测潜在冲突,
So that 避免 IP 地址冲突或配置错误导致设备失联。
```

## 上下文
在当前实现中，用户可以直接保存网络配置（IP 地址、端口等），但没有检查这些配置是否会导致冲突。如果用户输入了已占用的 IP 地址或其他冲突的配置，可能导致设备失联或网络问题。需要在保存前进行冲突检测，确保配置的安全性。

## 业务价值
- 防止因错误配置导致的设备失联
- 提高网络配置的安全性
- 减少因 IP 冲突导致的网络问题
- 增强用户对系统的信任度

## 接受标准
**Given** 用户尝试保存网络配置
**When** 点击保存按钮
**Then** 系统应先执行冲突检测（如检查 IP 是否已被占用）
**And** 如果检测到冲突，应阻止保存并显示严重警告
**And** 如果无冲突，继续执行保存流程并提示重启

### 具体场景
1. **IP 地址冲突检测**
   - 当用户修改 IP 地址时，系统应检测该 IP 是否已被网络中其他设备占用
   - 使用 ARP 扫描或其他网络检测技术
   - 如果检测到冲突，阻止保存并显示错误信息

2. **端口冲突检测**
   - 检测指定端口是否已被系统或其他服务占用
   - 阻止使用已被占用的端口

3. **网络配置合理性检查**
   - 验证 IP 地址、子网掩码、网关是否在同一网段
   - 检查网关是否可达

## 技术要求
1. 扩展后端配置服务，添加冲突检测功能
2. 修改前端表单，在保存前执行冲突检测
3. 保持现有连接测试功能
4. 不影响配置的原子性保存

## 实现方案

### 1. 后端实现
- 扩展 `ConfigService` 类，添加 `checkConflict` 方法
- 实现 IP 冲突检测（使用 ping 或 ARP 探测）
- 实现端口占用检测
- 在 `updateConfig` 方法中调用冲突检测

### 2. 前端实现
- 修改保存配置的逻辑，先执行冲突检测
- 如果检测到冲突，显示错误信息并阻止保存
- 如果无冲突，继续执行保存流程

### 3. API 扩展
- 添加 `/api/config/check-conflict` 端点
- 接收配置对象，返回冲突检测结果

## 依赖关系
- 依赖于已实现的连接测试功能
- 依赖于现有的配置验证机制
- 依赖于网络检测工具

## 风险与缓解
1. **检测准确性风险**：网络检测可能不准确
   - 缓解：使用多种检测方法，提供用户确认选项

2. **性能影响**：冲突检测可能影响保存速度
   - 缓解：优化检测逻辑，设置合理的超时时间

3. **网络权限**：需要适当的网络权限执行检测
   - 缓解：使用标准网络 API，处理权限错误

## 测试场景
1. **IP 冲突检测测试**
   - 尝试保存已占用的 IP 地址，验证保存被阻止
   - 尝试保存未占用的 IP 地址，验证保存成功

2. **端口冲突检测测试**
   - 尝试保存被占用的端口，验证保存被阻止
   - 尝试保存未被占用的端口，验证保存成功

3. **正常流程测试**
   - 保存无冲突的配置，验证正常保存和提示重启

4. **错误处理测试**
   - 网络检测失败时的错误处理
   - 权限不足时的错误处理

## 验收测试
1. 用户在配置表单中修改网络参数
2. 用户点击保存按钮
3. 系统执行冲突检测
4. 如果无冲突，保存配置并提示重启
5. 如果有冲突，显示错误信息并阻止保存

## 开发记录

### Dev Agent Record
#### 实现计划
- 创建冲突检测相关的类型定义和验证模式
- 实现后端冲突检测服务，包含IP冲突检测、端口占用检测和网络配置合理性检查
- 添加冲突检测API端点
- 修改前端保存逻辑，在保存前先执行冲突检测

#### 完成笔记
已成功实现冲突检测与安全保存功能：

1. **后端实现**：
   - 创建了ConflictDetectionService服务类，实现三种冲突检测：
     - IP 地址冲突检测：通过ping/连接测试检测IP是否已被占用
     - 端口占用检测：使用连接测试服务检测端口是否被占用
     - 网络配置合理性检查：验证IP、子网掩码、网关的格式及网络段一致性
   - 添加了 `/api/config/check-conflict` API端点
   - 更新服务器配置以注册新路由

2. **前端实现**：
   - 修改useUpdateConfig钩子，在保存前先执行冲突检测
   - 创建useCheckConflict钩子以支持独立的冲突检测功能
   - 提供清晰的错误提示给用户

3. **类型和模式**：
   - 定义了ConflictDetectionRequest和ConflictDetectionResult类型
   - 创建了相应的Zod验证模式

4. **测试**：
   - 实现了冲突检测服务的单元测试
   - 实现了路由的集成测试

### 文件列表
- packages/shared/src/types/conflict-detection.types.ts
- packages/shared/src/schemas/conflict-detection.schema.ts
- packages/shared/src/index.ts (更新导出)
- packages/backend/src/services/conflict-detection.service.ts
- packages/backend/src/routes/conflict-detection.routes.ts
- packages/backend/src/server.ts (更新路由注册)
- packages/backend/src/services/__tests__/conflict-detection.service.test.ts
- packages/backend/src/routes/__tests__/conflict-detection.routes.test.ts
- packages/frontend/src/hooks/useCheckConflict.ts
- packages/frontend/src/hooks/useUpdateConfig.ts (更新保存逻辑)
- packages/frontend/src/components/config/NetworkConfigForm.tsx (更新导入)

### 变更日志
- 2025-12-25: 实现冲突检测与安全保存功能
  - 添加ConflictDetectionService提供IP、端口、网络配置合理性检测
  - 添加/api/config/check-conflict API端点
  - 更新前端保存逻辑，先执行冲突检测再保存配置
  - 实现前后端类型定义和验证模式

## 状态
done