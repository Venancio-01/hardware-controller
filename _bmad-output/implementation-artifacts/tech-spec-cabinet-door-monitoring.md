# Tech-Spec: 柜门状态监听集成

**创建时间：** 2025-12-25
**状态：** Implementation Complete ✅
**负责人：** 青山
**完成时间：** 2025-12-25

---

## 概述

### 问题描述

当前 `apply-ammo-machine` 在授权通过后无法感知柜门状态变化，导致无法实现完整的取弹流程。需要添加硬件监听功能，在用户开门/关门时自动触发相应的状态机事件。

### 解决方案

在现有的 `MonitorMachine` 中添加对 `CABINET_DOOR_INDEX` 的监听，复用 MainMachine 中已有的门状态事件转发逻辑，实现从硬件状态到 ApplyAmmoMachine 状态机的完整事件流。

### 范围 (In/Out)

#### 包含在内 ✅
- 在 MonitorMachine 中添加 `CABINET_DOOR_INDEX` 状态监听
- 复用 MainMachine 的 `cabinet_lock_changed` 事件转发机制
- ApplyAmmoMachine 的门状态转换逻辑（已实现，无需修改）

#### 不包含 ❌
- 新增硬件接口或协议
- 修改 ApplyAmmoMachine 的状态机定义
- 柜门超时后的报警逻辑（已实现）
- 语音播报功能（已实现）

---

## 开发上下文

### 代码库模式

#### XState 状态机模式
- **框架：** XState v5
- **模式：** 父子状态机嵌套，使用 `sendTo()` 转发事件
- **事件流：** 硬件 → MonitorMachine → MainMachine → ApplyAmmoMachine

#### 硬件监听模式
```typescript
// 在 MonitorMachine 的 entry 中设置回调
entry: ({ context, self }) => {
  context.hardware.onIncomingData = (protocol, clientId, data) => {
    if (protocol === 'udp') {
      self.send({ type: 'RELAY_DATA_RECEIVED', clientId, data });
    }
  };
}

// 在 RELAY_DATA_RECEIVED 事件中处理
on: {
  RELAY_DATA_RECEIVED: {
    actions: enqueueActions(({ context, event, enqueue }) => {
      const combinedUpdate = context.aggregator.update(clientId, status);
      if (context.aggregator.hasIndexChanged(index, combinedUpdate)) {
        const isClosed = combinedUpdate.combinedState[index];
        enqueue.sendParent({
          type: 'event_name',
          priority: EventPriority.P2
        });
      }
    })
  }
}
```

#### 事件转发模式
```typescript
// MainMachine 使用 sendTo() 转发事件到子状态机
on: {
  cabinet_lock_changed: {
    actions: sendTo('applyAmmo', ({ event }) => {
      return event.isClosed ? { type: 'DOOR_CLOSE' } : { type: 'DOOR_OPEN' };
    })
  }
}
```

### 需要参考的文件

| 文件路径 | 用途 |
|---------|------|
| `src/state-machines/monitor-machine.ts` | 添加 CABINET_DOOR_INDEX 监听逻辑 |
| `src/state-machines/main-machine.ts` | 复用已有的事件转发（无需修改） |
| `src/state-machines/apply-ammo-machine.ts` | 参考门状态转换逻辑（无需修改） |
| `src/config/index.ts` | CABINET_DOOR_INDEX 配置定义 |
| `src/business-logic/relay-status-aggregator.ts` | 状态聚合器，检测状态变化 |

### 技术决策

#### 1. 复用现有事件类型
**决策：** 复用 `cabinet_lock_changed` 事件类型，而不是创建新事件
**理由：**
- MainMachine 已经有 `cabinet_lock_changed` 的转发逻辑（第79-86行）
- 减少代码重复
- 保持事件类型的一致性

#### 2. 门状态逻辑
**关键：** 逻辑映射必须正确
- `high` (true) = 开门 → 发送 `DOOR_OPEN` 事件
- `low` (false) = 关门 → 发送 `DOOR_CLOSE` 事件

**代码实现：**
```typescript
if (context.aggregator.hasIndexChanged(config.CABINET_DOOR_INDEX, combinedUpdate)) {
  const isDoorOpen = combinedUpdate.combinedState[config.CABINET_DOOR_INDEX]; // true = high = 开门
  enqueue.sendParent({
    type: 'cabinet_lock_changed',
    priority: EventPriority.P2,
    isClosed: !isDoorOpen  // 注意反转：isClosed = !isDoorOpen
  });
}
```

#### 3. 配置驱动
**决策：** 使用 `config.CABINET_DOOR_INDEX` 配置项
**优势：**
- 无需硬编码索引值
- 可通过环境变量配置（默认值：1，对应 CH2）

---

## 实施计划

### 任务

#### ✅ 任务 1: 在 MonitorMachine 中添加柜门状态监听
**文件：** `src/state-machines/monitor-machine.ts`
**位置：** `RELAY_DATA_RECEIVED` 事件处理器（第88-97行）
**状态：** 已完成 ✓

**需要添加的代码：**
```typescript
// 在第 86 行后添加（在 ELECTRIC_LOCK_OUT_INDEX 处理之后）

// 4. 处理柜门状态逻辑 (CH2 - CABINET_DOOR_INDEX)
if (context.aggregator.hasIndexChanged(config.CABINET_DOOR_INDEX, combinedUpdate)) {
  const isDoorOpen = combinedUpdate.combinedState[config.CABINET_DOOR_INDEX]; // true = high = 开门
  log.info(`[逻辑] CH2 (柜门) 已变化. 开门: ${isDoorOpen}`);
  enqueue.sendParent({
    type: 'cabinet_lock_changed',
    priority: EventPriority.P2,
    isClosed: !isDoorOpen  // 反转：true = 关门, false = 开门
  });
}
```

**注意：**
- 保持与现有代码风格一致
- 添加适当的日志记录
- 使用 `!isDoorOpen` 反转逻辑，因为 `cabinet_lock_changed` 事件使用 `isClosed` 字段

#### ✅ 任务 2: 验证 MainMachine 的事件转发逻辑
**文件：** `src/state-machines/main-machine.ts`
**位置：** 第79-86行
**状态：** 已完成 ✓

**验证结果：**
- ✅ 已存在 `cabinet_lock_changed` 事件监听
- ✅ 已正确转发 `DOOR_OPEN`/`DOOR_CLOSE` 到 applyAmmo 子状态机
- ✅ 无需修改

#### ✅ 任务 3: 测试验证
**文件：** `test/state-machines/monitor-machine.enhanced.test.ts`
**状态：** 已完成 ✓

**测试场景：**
1. ✅ 柜门从关到开：发送 `DOOR_OPEN` 事件
2. ✅ 柜门从开到关：发送 `DOOR_CLOSE` 事件
3. ✅ 柜门状态无变化：不发送事件
4. ✅ 超时场景：开门后超时，关门后自动解除报警（ApplyAmmoMachine 已实现）

**测试结果：**
- 所有 81 个测试通过
- 更新了 `monitor-machine.enhanced.test.ts` 以使用 `CABINET_DOOR_INDEX` 而不是 `ELECTRIC_LOCK_OUT_INDEX`

### 验收标准

#### AC 1: 柜门状态变化被正确监听
**Given** ApplyAmmoMachine 处于 `authorized` 状态
**When** 用户打开柜门（CABINET_DOOR_INDEX 从 low 变为 high）
**Then** MonitorMachine 发送 `cabinet_lock_changed` 事件（`isClosed: false`）
**And** MainMachine 转发 `DOOR_OPEN` 事件到 ApplyAmmoMachine
**And** ApplyAmmoMachine 进入 `door_open` 状态
**And** 播报语音："已开门，请取弹，取弹后请关闭柜门，并复位按键"

#### AC 2: 关门状态流转
**Given** ApplyAmmoMachine 处于 `door_open` 状态
**When** 用户关闭柜门（CABINET_DOOR_INDEX 从 high 变为 low）
**Then** MonitorMachine 发送 `cabinet_lock_changed` 事件（`isClosed: true`）
**And** MainMachine 转发 `DOOR_CLOSE` 事件到 ApplyAmmoMachine
**And** ApplyAmmoMachine 进入 `door_closed` 状态
**And** 播报语音："柜门已关闭"

#### AC 3: 开门超时处理
**Given** ApplyAmmoMachine 处于 `door_open` 状态
**When** 超过 `DOOR_OPEN_TIMEOUT_S` 秒（默认 30 秒）用户仍未关门
**Then** ApplyAmmoMachine 自动进入 `door_open_timeout` 状态
**And** 播报语音："柜门超时未关"
**And** 开启报警灯（柜体端 + 控制端）

#### AC 4: 超时后关门自动解除报警
**Given** ApplyAmmoMachine 处于 `door_open_timeout` 状态
**When** 用户关闭柜门
**Then** ApplyAmmoMachine 进入 `door_closed` 状态
**And** 播报语音："柜门已关闭"
**And** 自动关闭报警灯

#### AC 5: 状态转换约束
**Given** ApplyAmmoMachine 处于 `authorized` 状态
**When** 柜门状态变化（开门或关门）
**Then** 只有在开门后才能进入 `door_closed` 状态
**And** 不能直接从 `authorized` 跳到 `door_closed`（状态机已保证）

---

## 附加上下文

### 依赖关系

#### 运行时依赖
- XState v5（状态机框架）
- HardwareCommunicationManager（硬件通信）
- RelayStatusAggregator（状态聚合）

#### 配置依赖
```bash
# .env 文件中的配置
CABINET_DOOR_INDEX=1          # 柜门索引（0-15）
DOOR_OPEN_TIMEOUT_S=30        # 开门超时时间（秒）
```

### 测试策略

#### 单元测试
- MonitorMachine 的 `RELAY_DATA_RECEIVED` 事件处理逻辑
- 状态变化检测和事件发送

#### 集成测试
- 完整的事件流：硬件 → MonitorMachine → MainMachine → ApplyAmmoMachine
- 超时场景和报警解除

#### 手动测试
1. 启动系统
2. 触发申请流程（按下申请按键）
3. 授权通过
4. 打开柜门 → 验证语音播报
5. 等待超时 → 验证报警灯开启
6. 关闭柜门 → 验证报警灯关闭
7. 按下完成按键 → 验证流程结束

### 注意事项

⚠️ **关键逻辑：**
- `high` = `true` = 开门
- `low` = `false` = 关门
- MainMachine 的 `cabinet_lock_changed` 事件使用 `isClosed` 字段（`true` = 关门，`false` = 开门）
- **必须反转逻辑：** `isClosed = !isDoorOpen`

⚠️ **状态机约束：**
- 关门状态只能从开门状态流转（状态机已保证）
- 超时后必须先关门才能恢复正常流程

⚠️ **日志记录：**
- 添加足够的日志以便调试
- 使用现有的 `log` 对象和日志级别

### 相关文档

- `docs/状态机设计方案.md` - 整体状态机架构
- `docs/relay-status-change-detection-refactor.md` - 继电器状态监听重构历史

---

## 变更日志

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-12-25 | 1.0 | 初始版本 | AI PM |

---

## 审查记录

### 对抗性代码审查

**审查日期：** 2025-12-25
**审查方法：** Walk-through（逐个讨论）

**发现的问题：** 10 个
- **CRITICAL**: 1 个
- **HIGH**: 2 个（1 个有效）
- **MEDIUM**: 4 个
- **LOW**: 3 个

**修复的问题：**
1. ✅ **F1 (CRITICAL)**: 添加了关门场景测试，验证完整的开关门状态转换
2. ✅ **F3 (HIGH)**: 修正了日志信息，使其与代码逻辑匹配（`ELECTRIC_LOCK_OUT_INDEX` 而非 `AUTH_INDEX`）
3. ✅ **F5 (MEDIUM)**: 通过 F1 的修复间接解决

**跳过的问题：**
- ⏭️ **F2**: 审查者误解（授权逻辑与门锁逻辑是独立的）
- ⏭️ **F4**: 布尔反转逻辑文档增强（已有足够注释）
- ⏭️ **F6**: 事件命名重构（遗留问题，需单独任务）
- ⏭️ **F7-F10**: 低优先级改进建议

**最终测试状态：**
- 24 个测试文件全部通过
- 81 个测试用例全部通过
- 无回归问题
