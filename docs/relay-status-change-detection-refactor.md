# 继电器状态变化检测重构方案

## 文档元信息

- **创建日期**: 2025-12-24
- **目标受众**: Code Agent
- **影响范围**: `src/index.ts`, `src/business-logic/relay-status-aggregator.ts`
- **优先级**: P1（存在潜在 bug，需要修复）

---

## 问题描述

当前代码通过字符串匹配 (`changeDescriptions.some(d => d.includes('CH13'))`) 来判断继电器状态变化，这种方式存在以下问题：

### 1. 类型安全问题
- 使用字符串匹配代替结构化数据比较
- 缺乏编译时类型检查

### 2. 潜在的子串匹配 Bug
```typescript
// src/index.ts:56 - 错误：会误匹配 CH13 为 CH1
if (combinedUpdate.changeDescriptions.some(d => d.includes('CH1'))) {
```
当 CH13 变化时，`'CH13: 断开 → 闭合'.includes('CH1')` 返回 `true`，会错误触发 CH1 的逻辑。

### 3. 语义断层
- `CH13` 是人类可读的描述（1-based channel number）
- `config.AUTH_INDEX` 是程序索引（0-based array index）
- 映射关系没有在代码中显式建立

### 4. 脆弱性
- 如果修改 `changeDescriptions` 格式，业务逻辑会静默失效
- `changeDescriptions` 本应仅用于日志输出，不应作为业务逻辑的数据源

---

## 当前代码分析

### 问题代码位置：`src/index.ts:56-86`

```typescript
// 处理申请逻辑 - BUG: includes('CH1') 会匹配 CH13
if (combinedUpdate.changeDescriptions.some(d => d.includes('CH1'))) {
  const isCabinetRelay1Closed = (combinedUpdate.combinedState[config.APPLY_INDEX]);
  // ...
}

// 处理授权逻辑
if (combinedUpdate.changeDescriptions.some(d => d.includes('CH13'))) {
  const isControlRelay5Closed = (combinedUpdate.combinedState[config.AUTH_INDEX]);
  // ...
}

// 处理门锁逻辑
if (combinedUpdate.changeDescriptions.some(d => d.includes('CH2'))) {
  const isCabinetRelay2Closed = (combinedUpdate.combinedState[config.ELECTRIC_LOCK_OUT_INDEX]);
  // ...
}
```

### 数据结构：`RelayCombinedUpdate`

```typescript
export interface RelayCombinedUpdate {
  combinedState: boolean[];      // 当前所有继电器状态
  previousCombined: boolean[] | null;  // 上一次的状态
  changed: boolean;              // 是否有变化
  changeDescriptions: string[];  // 变化描述（仅用于日志）
  allStatusText: string;         // 全部状态文本（仅用于日志）
  raw: { cabinet: string; control: string };  // 原始数据（仅用于日志）
}
```

---

## 改进方案

### 核心思路

直接使用结构化数据 (`previousCombined` 和 `combinedState`) 比较状态变化，不依赖字符串匹配。

### 实现方式

#### 方案 1：在 `RelayStatusAggregator` 中添加辅助方法（推荐）

在 `src/business-logic/relay-status-aggregator.ts` 中添加：

```typescript
export class RelayStatusAggregator {
  // ... 现有代码 ...

  /**
   * 检查指定索引的继电器是否发生变化
   * @param index 继电器索引（0-based）
   * @returns 如果该继电器状态发生变化返回 true，否则返回 false
   */
  hasIndexChanged(index: number, combinedUpdate: RelayCombinedUpdate): boolean {
    if (!combinedUpdate.previousCombined) {
      return false;
    }
    return combinedUpdate.previousCombined[index] !== combinedUpdate.combinedState[index];
  }
}
```

然后在 `src/index.ts` 中使用：

```typescript
// 处理申请逻辑
if (relayAggregator.hasIndexChanged(config.APPLY_INDEX, combinedUpdate)) {
  const isCabinetRelay1Closed = combinedUpdate.combinedState[config.APPLY_INDEX];
  appLogger.debug(`[Logic] CH1 changed. Closed: ${isCabinetRelay1Closed}`);
  if (isCabinetRelay1Closed) {
    appLogger.info('[Logic] Sending apply_request to MainMachine');
    mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
  } else {
    appLogger.info('[Logic] Sending finish_request to MainMachine');
    mainActor.send({ type: 'finish_request', priority: EventPriority.P2 });
  }
}

// 处理授权逻辑
if (relayAggregator.hasIndexChanged(config.AUTH_INDEX, combinedUpdate)) {
  const isControlRelay5Closed = combinedUpdate.combinedState[config.AUTH_INDEX];
  if (isControlRelay5Closed) {
    mainActor.send({ type: 'authorize_request', priority: EventPriority.P2 });
  } else {
    mainActor.send({ type: 'refuse_request', priority: EventPriority.P2 });
  }
}

// 处理门锁逻辑
if (relayAggregator.hasIndexChanged(config.ELECTRIC_LOCK_OUT_INDEX, combinedUpdate)) {
  const isCabinetRelay2Closed = combinedUpdate.combinedState[config.ELECTRIC_LOCK_OUT_INDEX];
  mainActor.send({
    type: 'cabinet_lock_changed',
    priority: EventPriority.P2,
    isClosed: isCabinetRelay2Closed
  });
}
```

#### 方案 2：在 `RelayCombinedUpdate` 接口中添加方法（备选）

修改接口定义：

```typescript
export interface RelayCombinedUpdate {
  combinedState: boolean[];
  previousCombined: boolean[] | null;
  changed: boolean;
  changeDescriptions: string[];
  allStatusText: string;
  raw: { cabinet: string; control: string };

  /**
   * 检查指定索引的继电器是否发生变化
   */
  hasIndexChanged(index: number): boolean;
}
```

在 `RelayStatusAggregator.update()` 中实现：

```typescript
return {
  combinedState,
  previousCombined,
  changed,
  changeDescriptions,
  allStatusText,
  raw,
  hasIndexChanged(index: number): boolean {
    if (!previousCombined) {
      return false;
    }
    return previousCombined[index] !== combinedState[index];
  }
};
```

然后在 `src/index.ts` 中使用：

```typescript
if (combinedUpdate.hasIndexChanged(config.APPLY_INDEX)) {
  // ...
}
```

---

## 实施步骤

### Step 1: 修改 `src/business-logic/relay-status-aggregator.ts`

1. 在 `RelayStatusAggregator` 类中添加 `hasIndexChanged()` 方法
2. 添加完整的 JSDoc 注释
3. 添加边界检查（index 越界保护）

### Step 2: 修改 `src/index.ts`

1. 替换所有 `changeDescriptions.some(d => d.includes('CHx'))` 为 `relayAggregator.hasIndexChanged()`
2. 保持现有的日志输出不变
3. 保持业务逻辑不变

### Step 3: 验证

1. 确保所有继电器变化检测正常工作
2. 确认 CH1 和 CH13 不会互相干扰
3. 验证日志输出仍正常

### Step 4: 清理

1. 移除不再需要的 `changeDescriptions` 引用（如果仅用于日志，保留）
2. 添加单元测试（可选）

---

## 索引映射关系参考

| Channel 名称 | config 索引 | CH 编号 | 设备 | 位置 |
|-------------|------------|--------|------|------|
| APPLY_INDEX | config.APPLY_INDEX | CH1 | cabinet | 继电器 1 |
| ELECTRIC_LOCK_OUT_INDEX | config.ELECTRIC_LOCK_OUT_INDEX | CH2 | cabinet | 继电器 2 |
| AUTH_INDEX | config.AUTH_INDEX | CH13 | control | 继电器 5 |

**注意**: CH 编号 = 索引 + 1（1-based vs 0-based）

---

## 预期收益

1. **修复 bug**: 解决 CH1/CH13 子串匹配问题
2. **类型安全**: 使用数字索引代替字符串匹配
3. **可维护性**: 数据源单一，映射关系清晰
4. **鲁棒性**: 不受描述格式变化影响

---

## 注意事项

1. **不要修改 `changeDescriptions` 的生成逻辑** - 它们仅用于日志输出
2. **保持现有的日志输出** - 用户需要看到继电器变化的描述
3. **不要破坏现有业务逻辑** - 只改变检测方式，不改变业务行为
4. **确保索引边界检查** - 防止数组越界异常

---

## 验收标准

- [ ] 所有继电器变化检测使用索引比较，不使用字符串匹配
- [ ] CH1 变化不会触发 CH13 逻辑，反之亦然
- [ ] 所有现有日志正常输出
- [ ] 业务逻辑行为不变
- [ ] 代码通过 TypeScript 类型检查
- [ ] 无运行时错误

---

## 附录：完整代码示例

### 修改后的 `src/business-logic/relay-status-aggregator.ts`

```typescript
export class RelayStatusAggregator {
  private latestChannels: { cabinet?: boolean[]; control?: boolean[] } = {};
  private lastCombined: boolean[] | null = null;
  private lastRaw = new Map<RelayClientId, string>();

  update(clientId: RelayClientId, status: RelayStatus): RelayCombinedUpdate | null {
    this.latestChannels[clientId] = status.channels;
    this.lastRaw.set(clientId, status.raw);

    const cabinetChannels = this.latestChannels.cabinet;
    const controlChannels = this.latestChannels.control;

    if (!cabinetChannels || !controlChannels) {
      return null;
    }

    const combinedState = [...cabinetChannels, ...controlChannels];
    const previousCombined = this.lastCombined;
    const changed = previousCombined ? !this.isSameCombinedState(previousCombined, combinedState) : false;

    const changeDescriptions = changed && previousCombined
      ? combinedState
        .map((on, i) => previousCombined[i] !== on
          ? `CH${i + 1}: ${previousCombined[i] ? '闭合' : '断开'} → ${on ? '闭合' : '断开'}`
          : null)
        .filter(Boolean) as string[]
      : [];

    const allStatusText = combinedState
      .map((on, i) => `CH${i + 1}:${on ? '闭合' : '断开'}`)
      .join(' ');

    const raw = {
      cabinet: this.lastRaw.get('cabinet') ?? '',
      control: this.lastRaw.get('control') ?? '',
    };

    this.lastCombined = [...combinedState];

    return {
      combinedState,
      previousCombined,
      changed,
      changeDescriptions,
      allStatusText,
      raw
    };
  }

  /**
   * 检查指定索引的继电器是否发生变化
   * @param index 继电器索引（0-based）
   * @param combinedUpdate 继电器状态更新对象
   * @returns 如果该继电器状态发生变化返回 true，否则返回 false
   */
  hasIndexChanged(index: number, combinedUpdate: RelayCombinedUpdate): boolean {
    if (!combinedUpdate.previousCombined) {
      return false;
    }
    if (index < 0 || index >= combinedUpdate.combinedState.length) {
      return false;
    }
    return combinedUpdate.previousCombined[index] !== combinedUpdate.combinedState[index];
  }

  private isSameCombinedState(previous: boolean[], current: boolean[]): boolean {
    if (previous.length !== current.length) {
      return false;
    }

    for (let i = 0; i < current.length; i += 1) {
      if (previous[i] !== current[i]) {
        return false;
      }
    }

    return true;
  }
}
```

### 修改后的 `src/index.ts` (相关部分)

```typescript
if (combinedUpdate && combinedUpdate.changed) {
  // 处理申请逻辑
  if (relayAggregator.hasIndexChanged(config.APPLY_INDEX, combinedUpdate)) {
    const isCabinetRelay1Closed = combinedUpdate.combinedState[config.APPLY_INDEX];
    appLogger.debug(`[Logic] CH1 changed. Closed: ${isCabinetRelay1Closed}`);
    if (isCabinetRelay1Closed) {
      appLogger.info('[Logic] Sending apply_request to MainMachine');
      mainActor.send({ type: 'apply_request', priority: EventPriority.P2 });
    } else {
      appLogger.info('[Logic] Sending finish_request to MainMachine');
      mainActor.send({ type: 'finish_request', priority: EventPriority.P2 });
    }
  }

  // 处理授权逻辑
  if (relayAggregator.hasIndexChanged(config.AUTH_INDEX, combinedUpdate)) {
    const isControlRelay5Closed = combinedUpdate.combinedState[config.AUTH_INDEX];
    if (isControlRelay5Closed) {
      mainActor.send({ type: 'authorize_request', priority: EventPriority.P2 });
    } else {
      mainActor.send({ type: 'refuse_request', priority: EventPriority.P2 });
    }
  }

  // 处理门锁逻辑
  if (relayAggregator.hasIndexChanged(config.ELECTRIC_LOCK_OUT_INDEX, combinedUpdate)) {
    const isCabinetRelay2Closed = combinedUpdate.combinedState[config.ELECTRIC_LOCK_OUT_INDEX];
    mainActor.send({
      type: 'cabinet_lock_changed',
      priority: EventPriority.P2,
      isClosed: isCabinetRelay2Closed
    });
  }

  // 日志输出保持不变
  if (combinedUpdate.changeDescriptions.length > 0) {
    appLogger.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
    appLogger.info(
      `[combined] 当前全部十六路状态: ${combinedUpdate.allStatusText} (raw: cabinet=${combinedUpdate.raw.cabinet} control=${combinedUpdate.raw.control})`
    );
  }
}
```

---

**文档结束**
