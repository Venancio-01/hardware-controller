# Tech-Spec: 语音播报模块 API 重构

**Created:** 2025-12-29
**Status:** ✅ Completed

## 概述

### 问题陈述

当前 `voice-broadcast` 模块存在以下问题：

1. **API 不清晰**：调用者使用 `VoiceBroadcastController.getInstance().broadcast('...')` 无法直观知道消息发往哪个端（柜子端/控制端）
2. **样板代码重复**：每次调用前都需要检查 `VoiceBroadcastController.isInitialized()`
3. **目标参数不直观**：`targetClientId` 作为第三个可选参数，容易被忽略
4. **客户端 ID 混乱**：使用字符串 ID `'voice-broadcast-cabinet'` / `'voice-broadcast-control'`，不够语义化

### 解决方案

重构 API 为 **分离式访问器模式**：

```typescript
// 新 API 设计
const voiceBroadcast = VoiceBroadcast.getInstance();

// 柜子端播报
voiceBroadcast.cabinet.broadcast('已申请，请等待授权');

// 控制端播报
voiceBroadcast.control.broadcast('授权通过');

// 如果需要同时播报
await Promise.all([
  voiceBroadcast.cabinet.broadcast('消息'),
  voiceBroadcast.control.broadcast('消息')
]);
```

### 范围

**包含：**
- 重构 `VoiceBroadcastController` 为 `VoiceBroadcast` (更简洁命名)
- 创建 `VoiceClient` 类封装单个端的播报逻辑
- 提供 `cabinet` / `control` 两个预置访问器
- 更新 `initializer.ts` 以适配新设计
- 更新所有调用方 (`apply-ammo-machine.ts` 等)
- 更新相关测试文件

**不包含：**
- 修改硬件通信层 (`HardwareCommunicationManager`)
- 修改配置文件格式

---

## 开发上下文

### 代码库模式

- 使用 **单例模式** 管理全局实例
- 使用 **XState** 状态机进行流程控制
- 使用 **Zod** 进行参数验证
- 日志模块：`createModuleLogger('ModuleName')`
- 导入使用 `.js` 扩展名

### 需要参考的文件

| 文件 | 说明 |
|------|------|
| `packages/core/src/voice-broadcast/index.ts` | 主控制器（需重构） |
| `packages/core/src/voice-broadcast/initializer.ts` | 初始化逻辑（需更新） |
| `packages/core/src/voice-broadcast/types.ts` | 类型定义（需更新） |
| `packages/core/src/voice-broadcast/validation.ts` | 验证逻辑（保持） |
| `packages/core/src/state-machines/apply-ammo-machine.ts` | 主要调用方（需更新） |
| `config.json5` | 配置文件（参考硬件配置） |

### 技术决策

1. **命名约定**：`VoiceBroadcastController` → `VoiceBroadcast` (更简洁)
2. **访问器模式**：使用 getter 属性 `cabinet` / `control` 返回 `VoiceClient` 实例
3. **懒加载检查**：在 `VoiceClient.broadcast()` 内部处理初始化检查，调用方无需关心
4. **向后兼容**：保留 `broadcast(text, options, targetClientId?)` 方法用于动态目标场景

---

## 实现计划

### 任务列表

- [ ] **Task 1: 创建 VoiceClient 类**
  - 新建 `packages/core/src/voice-broadcast/client.ts`
  - 封装单个端的播报逻辑
  - 包含 `broadcast()`, `playSound()`, `setInterruptMode()`, `setCacheMode()` 方法

- [ ] **Task 2: 重构 VoiceBroadcast 主类**
  - 重命名 `VoiceBroadcastController` → `VoiceBroadcast`
  - 添加 `cabinet` / `control` getter 属性
  - 保留 `broadcast()` 方法但标记为 `@deprecated`（或保留用于高级场景）

- [ ] **Task 3: 更新类型定义**
  - 在 `types.ts` 中添加 `VoiceTarget = 'cabinet' | 'control'` 类型
  - 更新 `VoiceClientConfig` 接口

- [ ] **Task 4: 更新初始化逻辑**
  - 修改 `initializer.ts` 适配新类名和结构

- [ ] **Task 5: 更新调用方 - apply-ammo-machine.ts**
  - 替换所有 `VoiceBroadcastController.getInstance().broadcast(...)` 调用
  - 移除重复的 `isInitialized()` 检查（由 VoiceClient 内部处理）
  - 明确指定 `cabinet` 或 `control`

- [ ] **Task 6: 更新其他调用方（如有）**
  - 搜索并更新所有使用语音播报的模块

- [ ] **Task 7: 更新测试文件**
  - 更新 mock 和测试用例以匹配新 API

- [ ] **Task 8: 更新 index.ts 导出**
  - 确保模块导出正确的新类名

### 验收标准

- [ ] **AC 1**: 调用方可以使用 `VoiceBroadcast.getInstance().cabinet.broadcast('...')` 发送柜子端语音
- [ ] **AC 2**: 调用方可以使用 `VoiceBroadcast.getInstance().control.broadcast('...')` 发送控制端语音
- [ ] **AC 3**: 调用方无需手动检查 `isInitialized()`，由模块内部处理
- [ ] **AC 4**: 所有现有测试通过 (`pnpm test`)
- [ ] **AC 5**: TypeScript 编译无错误 (`pnpm build`)

---

## 附加上下文

### 依赖关系

- `HardwareCommunicationManager`：底层硬件通信（不变）
- `iconv-lite`：GB2312 编码（不变）

### 测试策略

1. **单元测试**：测试 `VoiceClient` 的 `broadcast()` 方法
2. **集成测试**：测试 `VoiceBroadcast` 初始化和访问器
3. **Mock 策略**：Mock `HardwareCommunicationManager` 的 `sendCommand` 方法

### 文件变更概览

```diff
packages/core/src/voice-broadcast/
├── client.ts          [NEW]    VoiceClient 类
├── index.ts           [MODIFY] VoiceBroadcast 重构
├── initializer.ts     [MODIFY] 适配新类名
├── types.ts           [MODIFY] 添加 VoiceTarget 类型
└── validation.ts      [KEEP]   保持不变

packages/core/src/state-machines/
└── apply-ammo-machine.ts [MODIFY] 更新调用方式
```

### 备注

- 建议先完成核心重构，再批量更新调用方
- 考虑添加 JSDoc 文档说明新 API 用法
