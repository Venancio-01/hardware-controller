# Tech-Spec: 手动取消报警功能

**创建时间：** 2025-12-25
**状态：** Implementation Complete
**负责人：** 青山

---

## 概述

### 问题描述

当前 `apply-ammo-machine` 在进入 `door_open_timeout` 状态（柜门超时报警）后，用户无法通过物理按钮手动取消报警。如果柜门超时是误触发或用户需要继续操作，系统没有提供恢复到正常流程的机制。

### 解决方案

在现有的 `MonitorMachine` 中添加对 `ALARM_STATUS_INDEX` 的状态变化监听，检测 toggle 按钮的状态翻转（0↔1），通过 MainMachine 转发 `ALARM_CANCEL` 事件到当前激活的子状态机，实现手动取消报警功能。

**核心机制**：
- 利用 `RelayStatusAggregator.hasIndexChanged()` 检测 `ALARM_STATUS_INDEX` 的状态翻转
- 发送 `alarm_cancel_toggled` 事件到 MainMachine
- MainMachine 转发 `ALARM_CANCEL` 到 applyAmmo 子状态机
- applyAmmoMachine 从 `door_open_timeout` 回退到 `door_open` 状态
- 立即语音播报"取消报警"
- 重新开始超时计时

### 范围 (In/Out)

#### 包含在内 ✅
- 在 MonitorMachine 中添加 `ALARM_STATUS_INDEX` 状态监听（仅 control 端）
- 在 MainMachine 的 `normal` 状态中添加报警取消事件转发逻辑
- 在 applyAmmoMachine 中添加 `ALARM_CANCEL` 事件处理
- 添加语音播报"取消报警"动作
- 添加测试用例验证完整的事件流

#### 不包含 ❌
- 其他报警场景（钥匙开门报警、震动报警）的手动取消（未来扩展）
- 硬件协议修改（假设 ALARM_STATUS_INDEX 已存在且为 toggle 按钮）
- 报警权限验证（无需授权即可取消）
- 报警历史记录功能
- 按钮防抖的硬件层处理（软件层实现，假设硬件无防抖）

---

## 开发上下文

### 代码库模式

#### XState 状态机模式
- **框架：** XState v5.12.1
- **模式：** 父子状态机嵌套，使用 `sendTo()` 和 `sendParent()` 转发事件
- **事件流：** 硬件 → MonitorMachine → MainMachine → 子状态机

#### 硬件监听模式（MonitorMachine）
```typescript
// 在 RELAY_DATA_RECEIVED 事件处理器中检测状态变化
on: {
  RELAY_DATA_RECEIVED: {
    actions: enqueueActions(({ context, event, enqueue }) => {
      const { clientId, data } = event;
      const status = parseStatusResponse(rawStr, 'dostatus');
      const combinedUpdate = context.aggregator.update(clientId as RelayClientId, status);

      // 检测特定索引的状态变化
      if (context.aggregator.hasIndexChanged(config.SOME_INDEX, combinedUpdate)) {
        const currentState = combinedUpdate.combinedState[config.SOME_INDEX];
        enqueue.sendParent({
          type: 'event_name',
          priority: EventPriority.P2
        });
      }
    })
  }
}
```

**关键方法：** `RelayStatusAggregator.hasIndexChanged(index, combinedUpdate)`
- 通过比较 `previousCombined[index]` 和 `combinedState[index]` 检测边沿
- **已支持 toggle 检测**：只要 index 的值发生变化（0→1 或 1→0），就会返回 `true`
- 无需额外的状态记忆逻辑

#### 事件转发模式（MainMachine）
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

#### 语音播报模式（applyAmmoMachine）
```typescript
actions: {
  broadcastMessage: ({ context }) => {
    if (!VoiceBroadcastController.isInitialized()) {
      context.logger.warn('语音播报未初始化，跳过播报');
      return;
    }
    const voiceController = VoiceBroadcastController.getInstance();
    void voiceController.broadcast('消息内容');
  }
}
```

### 需要参考的文件

| 文件路径 | 用途 | 需要修改 |
|---------|------|---------|
| `src/state-machines/monitor-machine.ts` | 添加 ALARM_STATUS_INDEX 监听逻辑 | ✅ 是 |
| `src/state-machines/main-machine.ts` | 添加报警取消事件转发逻辑 | ✅ 是 |
| `src/state-machines/apply-ammo-machine.ts` | 添加 ALARM_CANCEL 事件处理和语音播报 | ✅ 是 |
| `src/types/state-machine.ts` | 添加新的事件类型定义 | ✅ 是 |
| `src/config/index.ts` | ALARM_STATUS_INDEX 配置定义（已存在） | ❌ 否 |
| `src/business-logic/relay-status-aggregator.ts` | 状态聚合器（无需修改） | ❌ 否 |
| `test/state-machines/monitor-machine.enhanced.test.ts` | 添加测试用例 | ✅ 是 |
| `test/state-machines/apply-ammo-machine.test.ts` | 添加状态转换测试 | ✅ 是 |

### 技术决策

#### 1. 事件类型设计
**决策：** 创建新的事件类型 `AlarmCancelToggledEvent`

**理由：**
- 区分于现有的 `AlarmCancelledEvent`（用于 P0 报警场景）
- 明确表示这是"按钮状态变化"事件，而非"报警已取消"结果
- 使用 `P2` 优先级（业务流程级别）

**类型定义：**
```typescript
// src/types/state-machine.ts
export type AlarmCancelToggledEvent = BaseEvent & {
  type: 'alarm_cancel_toggled';
  priority: EventPriority.P2;
};
```

#### 2. 状态转换逻辑
**决策：** 从 `door_open_timeout` 转换到新的中间状态 `door_open_alarm_cancelled`，而非直接回退到 `door_open`

**理由：**
- 直接回退到 `door_open` 会导致状态不一致问题（如果柜门实际已关闭）
- 创建中间状态可以明确表示"报警已取消"的语义
- 等待硬件事件（DOOR_CLOSE）来决定最终状态，避免竞态条件
- 重新开始超时计时（如果 30 秒内未关门，会再次进入 `door_open_timeout`）

**状态机转换：**
```
door_open --[30s timeout]--> door_open_timeout
door_open_timeout --[ALARM_CANCEL]--> door_open_alarm_cancelled
door_open_alarm_cancelled --[DOOR_CLOSE]--> door_closed
door_open_alarm_cancelled --[30s timeout]--> door_open_timeout (循环)
```

**优势：**
- ✅ 明确的状态语义，避免混淆
- ✅ 利用硬件事件自然同步状态
- ✅ 如果柜门已关闭，DOOR_CLOSE 事件会正确转换到 `door_closed`
- ✅ 如果柜门仍打开，30 秒后会再次报警（符合预期）

#### 3. 报警灯控制时机
**决策：** 利用现有的 `door_open_timeout` 状态的 `exit` 钩子

**理由：**
- `door_open_timeout` 的 `exit: 'alarmOff'` 已经实现了报警灯关闭
- 无需重复实现
- 保持代码简洁

**现有代码：**
```typescript
door_open_timeout: {
  entry: 'alarmOn',
  exit: 'alarmOff',  // ✅ 自动关闭报警灯
  on: {
    ALARM_CANCEL: { target: 'door_open_alarm_cancelled', actions: 'broadcastAlarmCancelled' }
  }
}
```

#### 4. 语音播报内容
**决策：** 播报"取消报警"

**理由：**
- 简洁明了
- 与现有播报风格一致（"柜门超时未关"、"供弹完毕"等）
- **不播报**"已开门"（door_open 的 entry 播报），避免冗余

#### 5. Toggle 按钮的边沿检测
**决策：** 依赖 `RelayStatusAggregator.hasIndexChanged()` 检测任何状态变化

**理由：**
- Toggle 按钮的特性：每次按下翻转状态（0→1 或 1→0）
- `hasIndexChanged()` 已经实现了边沿检测
- 无需关心是 0→1 还是 1→0，只要变化就触发

**代码实现：**
```typescript
if (context.aggregator.hasIndexChanged(config.ALARM_STATUS_INDEX, combinedUpdate)) {
  log.info(`[逻辑] ALARM_STATUS_INDEX (CH${config.ALARM_STATUS_INDEX + 1}) 已变化`);
  enqueue.sendParent({
    type: 'alarm_cancel_toggled',
    priority: EventPriority.P2
  });
}
```

#### 6. ALARM_STATUS_INDEX 的位置
**决策：** 仅监听 `control` 端

**理由：**
- ALARM_STATUS_INDEX = 10（control 端的 CH3，因为 control 端从 index 8 开始）
- 柜体端没有此按钮（设计假设）
- 与现有配置一致（config.CONTROL_TARGET_HOST/PORT）

**索引映射：**
- Cabinet 端：CH1-CH8 → index 0-7
- Control 端：CH1-CH8 → index 8-15
- **ALARM_STATUS_INDEX = 10** → Control 端的 CH3

---

## 实施计划

### 任务

#### ✅ 任务 1: 添加事件类型定义
**文件：** `src/types/state-machine.ts`
**位置：** 在 `AlarmCancelledEvent` 之后添加

**需要添加的代码：**
```typescript
// 在第 35 行后添加

// P2 Events - Alarm Cancel
export type AlarmCancelToggledEvent = BaseEvent & {
  type: 'alarm_cancel_toggled';
  priority: EventPriority.P2;
};

// 更新 SystemEvent 类型并集
export type SystemEvent =
  | KeyDetectedEvent
  | VibrationDetectedEvent
  | MonitorAnomalyEvent
  | ApplyRequestEvent
  | AuthorizeRequestEvent
  | RefuseRequestEvent
  | FinishRequestEvent
  | OperationCompleteEvent
  | CabinetLockChangedEvent
  | AlarmCancelledEvent
  | AlarmCancelToggledEvent  // ✅ 添加这行
  | MaintenanceEvent
  | MonitorTickEvent;
```

**验证：** TypeScript 编译通过，无类型错误

---

#### ✅ 任务 2: 在 MonitorMachine 中添加 ALARM_STATUS_INDEX 监听
**文件：** `src/state-machines/monitor-machine.ts`
**位置：** `RELAY_DATA_RECEIVED` 事件处理器（第 98 行后）

**需要添加的代码：**
```typescript
// 在第 97 行后添加（在 cabinet_lock_changed 处理之后）

// 4. 处理报警取消按钮逻辑 (CH11 - ALARM_STATUS_INDEX)
if (context.aggregator.hasIndexChanged(config.ALARM_STATUS_INDEX, combinedUpdate)) {
  log.info(`[逻辑] ALARM_STATUS_INDEX (CH${config.ALARM_STATUS_INDEX + 1}) 已变化`);
  enqueue.sendParent({
    type: 'alarm_cancel_toggled',
    priority: EventPriority.P2
  });
}
```

**注意：**
- 保持与现有代码风格一致（使用 `log.info()` 记录逻辑）
- 使用 `CH${config.ALARM_STATUS_INDEX + 1}` 格式化日志（人类可读的通道号）
- 仅检测状态变化，不关心具体值（toggle 按钮特性）

---

#### ✅ 任务 3: 在 MainMachine 中添加事件转发逻辑
**文件：** `src/state-machines/main-machine.ts`
**位置：** `normal` 状态的 `on` 块（第 87 行后）

**需要添加的代码：**
```typescript
// 在第 86 行后添加（在 cabinet_lock_changed 处理之后）

on: {
  // ... 现有的事件处理 ...

  alarm_cancel_toggled: {
    actions: sendTo('applyAmmo', { type: 'ALARM_CANCEL' })
  }
}
```

**注意：**
- 将 `alarm_cancel_toggled` 转换为 `ALARM_CANCEL` 发送给 applyAmmo
- 简化事件类型（子状态机不需要知道具体的硬件索引）
- 仅在 `normal` 状态中监听（只有此时 applyAmmo 是激活的）

---

#### ✅ 任务 4: 在 applyAmmoMachine 中添加事件处理
**文件：** `src/state-machines/apply-ammo-machine.ts`

**4.1 更新事件类型定义（第 9-15 行）**
```typescript
export type ApplyAmmoEvent =
  | { type: 'APPLY' }
  | { type: 'AUTHORIZED' }
  | { type: 'REFUSE' }
  | { type: 'FINISHED' }
  | { type: 'DOOR_OPEN' }
  | { type: 'DOOR_CLOSE' }
  | { type: 'ALARM_CANCEL' };  // ✅ 添加这行
```

**4.2 添加语音播报动作（第 96 行后）**
```typescript
// 在第 95 行后添加（在 broadcastDoorTimeout 之后）

broadcastAlarmCancelled: ({ context }) => {
  if (!VoiceBroadcastController.isInitialized()) {
    context.logger.warn('语音播报未初始化，跳过取消报警播报');
    return;
  }

  const voiceController = VoiceBroadcastController.getInstance();
  void voiceController.broadcast('取消报警');
}
```

**4.3 在 door_open_timeout 状态中添加事件处理（第 190-200 行）**
```typescript
door_open_timeout: {
  entry: 'alarmOn',
  exit: 'alarmOff',
  on: {
    DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
    ALARM_CANCEL: {
      target: 'door_open_alarm_cancelled',
      actions: 'broadcastAlarmCancelled'
      // exit 钩子会自动执行 alarmOff，无需在 actions 中重复
    }
  }
}

// 新增 door_open_alarm_cancelled 状态
door_open_alarm_cancelled: {
  // 报警已取消，等待柜门关闭或再次超时
  after: {
    [config.DOOR_OPEN_TIMEOUT_S * 1000]: { target: 'door_open_timeout', actions: 'broadcastDoorTimeout' }
  },
  on: {
    DOOR_CLOSE: { target: 'door_closed', actions: ['broadcastDoorClosed', 'resetLock'] },
    FINISHED: { target: 'idle', actions: ['broadcastCancelled', sendParent({ type: 'operation_complete', priority: EventPriority.P2 })] }
  }
}
```

**注意：**
- `exit: 'alarmOff'` 会自动执行，关闭报警灯
- 转换到 `door_open_alarm_cancelled` 状态会重新开始超时计时（`after` 钩子）
- 只播报"取消报警"，不播报"已开门"
- 如果柜门已关闭，`DOOR_CLOSE` 事件会将状态转换到 `door_closed`
- 如果柜门仍打开，30 秒后会再次进入 `door_open_timeout` 状态

---

### 验收标准

#### AC 1: 报警取消按钮状态变化被正确监听
**Given** 系统处于正常运行状态（MainMachine 在 normal 状态）
**When** 用户按下报警取消按钮（ALARM_STATUS_INDEX 从 0 变为 1，或从 1 变为 0）
**Then** MonitorMachine 发送 `alarm_cancel_toggled` 事件到 MainMachine
**And** MainMachine 转发 `ALARM_CANCEL` 事件到 applyAmmo 子状态机

#### AC 2: door_open_timeout 状态下取消报警
**Given** ApplyAmmoMachine 处于 `door_open_timeout` 状态（报警中）
**When** 用户按下报警取消按钮
**Then** ApplyAmmoMachine 进入 `door_open_alarm_cancelled` 状态（报警已取消的中间状态）
**And** 播报语音："取消报警"
**And** 报警灯关闭（柜体端 + 控制端）
**And** 重新开始超时计时（30秒后若未关门会再次进入 `door_open_timeout`）
**And** 如果柜门已关闭，DOOR_CLOSE 事件会将状态转换到 `door_closed`

#### AC 3: 非报警状态下按下按钮无效果
**Given** ApplyAmmoMachine 处于非报警状态（如 `idle`、`applying`、`door_open` 等）
**When** 用户按下报警取消按钮
**Then** ApplyAmmoMachine 忽略该事件（状态不变）
**And** 不播报语音

#### AC 4: 连续按下按钮的防抖处理
**Given** ApplyAmmoMachine 处于 `door_open_timeout` 状态
**When** 用户快速连续按下报警取消按钮（如 100ms 内按两次）
**Then** 系统只处理第一次状态变化（toggle：0→1）
**And** 第二次状态变化（1→0）也触发事件（这是 toggle 的特性）
**And** 但第二次事件到达时状态机已在 `door_open`，因此被忽略

**注意：** 实际上，toggle 按钮的硬件特性决定了每次按下都会翻转状态，因此 0→1→0 会被检测为两次变化。这是符合预期的。

#### AC 5: 状态转换的完整流程
**Given** 用户正在进行取弹流程，ApplyAmmoMachine 处于 `door_open` 状态
**When** 超过 30 秒用户未关门
**Then** ApplyAmmoMachine 进入 `door_open_timeout` 状态
**And** 播报语音："柜门超时未关"
**And** 开启报警灯（柜体端 + 控制端）
**When** 用户按下报警取消按钮
**Then** ApplyAmmoMachine 进入 `door_open_alarm_cancelled` 状态
**And** 播报语音："取消报警"
**And** 报警灯关闭
**And** 重新开始 30 秒超时计时
**And** 如果柜门仍打开，30 秒后会再次进入 `door_open_timeout` 状态
**And** 如果柜门已关闭，DOOR_CLOSE 事件会将状态转换到 `door_closed`

---

## 附加上下文

### 依赖关系

#### 运行时依赖
- XState v5.12.1（状态机框架）
- HardwareCommunicationManager（硬件通信）
- RelayStatusAggregator（状态聚合，无需修改）
- VoiceBroadcastController（语音播报）

#### 配置依赖
```bash
# .env 文件中的配置（已存在）
ALARM_STATUS_INDEX=10          # 报警取消按钮索引（0-15），默认 10
DOOR_OPEN_TIMEOUT_S=30         # 开门超时时间（秒）
RELAY_CABINET_ALARM_INDEX=8    # 柜体端报警灯继电器索引
RELAY_CONTROL_ALARM_INDEX=1    # 控制端报警灯继电器索引
```

### 测试策略

#### 单元测试

**MonitorMachine 测试**（`test/state-machines/monitor-machine.enhanced.test.ts`）
```typescript
it('should send alarm_cancel_toggled event when ALARM_STATUS_INDEX changes', async () => {
  // 模拟 ALARM_STATUS_INDEX 从 0 变为 1
  controlIndexes.add(config.ALARM_STATUS_INDEX);
  sendStatus('control');

  expect(receivedEvents).toContainEqual(
    expect.objectContaining({
      type: 'alarm_cancel_toggled',
      priority: EventPriority.P2
    })
  );
});
```

**ApplyAmmoMachine 测试**（`test/state-machines/apply-ammo-machine.test.ts`）
```typescript
it('should transition from door_open_timeout to door_open on ALARM_CANCEL', () => {
  // 启动状态机并进入 door_open_timeout 状态
  const actor = createActor(applyAmmoMachine, { input: { logger, manager } });
  actor.start();
  actor.send({ type: 'APPLY' });
  actor.send({ type: 'AUTHORIZED' });
  actor.send({ type: 'DOOR_OPEN' });
  // 等待超时...

  // 发送 ALARM_CANCEL 事件
  actor.send({ type: 'ALARM_CANCEL' });

  // 验证状态转换和语音播报
  expect(actor.getSnapshot().value).toBe('door_open');
  expect(voiceController.broadcast).toHaveBeenCalledWith('取消报警');
  expect(manager.sendCommand).toHaveBeenCalledWith(
    'udp',
    expect.objectContaining({ type: 'open' }),  // 关闭报警灯
    {},
    'cabinet',
    false
  );
});
```

#### 集成测试

**完整事件流测试**
```
1. 模拟用户打开柜门 → 进入 door_open 状态
2. 等待超时 → 进入 door_open_timeout 状态
3. 模拟按下报警取消按钮 → 回到 door_open 状态
4. 验证语音播报和报警灯关闭
```

#### 手动测试

**测试场景 1：正常取消流程**
1. 启动系统
2. 触发申请流程（按下申请按键）
3. 授权通过
4. 打开柜门 → 验证语音播报"已开门..."
5. 等待超时（30秒）→ 验证语音播报"柜门超时未关"和报警灯开启
6. 按下报警取消按钮 → 验证语音播报"取消报警"和报警灯关闭
7. 验证重新开始超时计时（再等30秒会再次报警）

**测试场景 2：非报警状态按下按钮**
1. 启动系统并进入 `idle` 状态
2. 按下报警取消按钮 → 验证无任何反应

**测试场景 3：连续按下按钮**
1. 进入 `door_open_timeout` 状态
2. 快速连续按下报警取消按钮 3 次
3. 验证只有第一次触发状态转换（后续事件被忽略，因为已不在 timeout 状态）

### 注意事项

⚠️ **索引映射：**
- ALARM_STATUS_INDEX = 10 → Control 端的 CH3
- 日志中应使用 `CH${index + 1}` 格式（人类可读）

⚠️ **状态机约束：**
- `ALARM_CANCEL` 事件仅在 `door_open_timeout` 状态下处理
- 其他状态（idle、applying、door_open 等）不处理此事件，因此会被忽略

⚠️ **语音播报顺序：**
1. 按钮触发 → 立即播报"取消报警"（actions 中执行）
2. 状态转换到 `door_open_alarm_cancelled` → 不播报"已开门"（避免冗余）

⚠️ **报警灯控制：**
- `door_open_timeout` 的 `exit` 钩子会自动执行 `alarmOff`
- 无需在 `ALARM_CANCEL` 的 actions 中重复调用

⚠️ **中间状态 door_open_alarm_cancelled：**
- 这是新增的中间状态，用于明确表示"报警已取消但流程未结束"
- 如果柜门已关闭，`DOOR_CLOSE` 事件会将状态转换到 `door_closed`
- 如果柜门仍打开，30 秒后会再次进入 `door_open_timeout` 状态（循环）
- 这个设计避免了状态不一致的问题，同时保持了清晰的语义

⚠️ **Toggle 按钮特性：**
- 每次按下翻转状态（0→1 或 1→0）
- `hasIndexChanged()` 会检测到变化并触发事件
- 这是符合预期的，因为用户想要"取消报警"，而不是"按下按钮"

⚠️ **快速多次点击的处理：**
- Toggle 按钮的硬件特性：每次状态变化（0→1 或 1→0）都会触发事件
- 如果用户在短时间内多次按下（例如 100ms 内按 3 次），会产生多个 `alarm_cancel_toggled` 事件
- XState 的事件队列机制会依次处理这些事件：
  - 第 1 个事件：`door_open_timeout` → `door_open_alarm_cancelled` ✓（状态转换成功）
  - 第 2 个事件：已在 `door_open_alarm_cancelled`，该事件被忽略（XState 默认行为）
  - 后续事件：同样被忽略
- **这是预期行为**，无需添加额外的软件防抖逻辑
- 如果硬件层有抖动问题，应该在硬件层添加防抖电路

⚠️ **硬件状态的异步性（已解决）：**
- 通过引入中间状态 `door_open_alarm_cancelled`，我们避免了之前的状态不一致问题
- 硬件事件是异步到达的，但中间状态会等待 `DOOR_CLOSE` 事件来决定最终状态
- 无论柜门是在取消报警前还是后关闭，系统都能正确同步状态

⚠️ **日志记录：**
- 在 MonitorMachine 中添加足够的日志以便调试
- 使用 `log.info()` 记录逻辑触发点
- 使用现有的 `log` 对象和日志级别

### 相关文档

- `tech-spec-cabinet-door-monitoring.md` - 柜门状态监听集成（已完成实现）
- `src/state-machines/apply-ammo-machine.ts` - 申请供弹状态机
- `src/state-machines/monitor-machine.ts` - 硬件监控状态机
- `src/business-logic/relay-status-aggregator.ts` - 继电器状态聚合器

---

## 变更日志

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-12-25 | 1.0 | 初始版本 | AI PM |
| 2025-12-25 | 1.1 | 引入 door_open_alarm_cancelled 中间状态，解决状态不一致问题 | 青山 + AI Reviewer |

---

## 附录：完整代码修改摘要

### 修改的文件（4个）
1. `src/types/state-machine.ts` - 添加事件类型
2. `src/state-machines/monitor-machine.ts` - 添加 ALARM_STATUS_INDEX 监听
3. `src/state-machines/main-machine.ts` - 添加事件转发
4. `src/state-machines/apply-ammo-machine.ts` - 添加事件处理、语音播报和新的中间状态

### 新增测试（2个）
1. `test/state-machines/monitor-machine.enhanced.test.ts` - 添加报警取消监听测试
2. `test/state-machines/apply-ammo-machine.enhanced.test.ts` - 添加状态转换测试（包含中间状态的测试）

### 代码行数估算
- 类型定义：+2 行
- MonitorMachine：+9 行（优化注释）
- MainMachine：+2 行
- ApplyAmmoMachine：+20 行（包括新状态）
- 测试代码：+100 行（新增多个测试用例）
- **总计：~133 行**（含注释和文档）

### 实施时间估算
- 任务 1-4（代码实现）：30-45 分钟
- 测试编写：30-45 分钟
- 手动测试和调试：30 分钟
- 代码审查和优化：30 分钟（中间状态重构）
- **总计：2-2.5 小时**
