# 监控报警状态机技术规范

## 概述

在 `packages/core/src/state-machines` 目录下实现设备状态监控报警功能，包含设备连接报警、心跳报警和网络报警三种类型。

## 报警类型

| 类型 | 事件 | 触发条件 | 语音播报 |
|-----|------|---------|---------|
| 设备连接 | `connection` | TCP/串口连接失败或断开 | "设备连接异常" |
| 心跳 | `heartbeat` | 查询开关量返回值非8位16进制格式，连续3次失败 | "设备心跳异常" |
| 网络 | `network` | TCP连接状态变化 | "网络连接异常" |

## 配置参数

| 参数 | 值 | 说明 |
|-----|---|------|
| `HEARTBEAT_INTERVAL_MS` | 30000 | 心跳检测间隔（毫秒） |
| `HEARTBEAT_FAILURE_THRESHOLD` | 3 | 连续失败阈值 |

## 状态机变更

### alarm-machine.ts

#### 新增事件

```typescript
| { type: 'MONITOR_DETECTED'; reason: 'connection' | 'heartbeat' | 'network' }
| { type: 'RECOVER' }
```

#### 新增状态

```typescript
monitor_alarm: {
  entry: 'broadcastMonitorAlarm',
  on: {
    ALARM_CANCEL: {
      actions: ['resetMonitorAlarm', sendParent({ type: 'alarm_cancelled' })],
      target: 'idle'
    },
    RECOVER: {
      actions: ['silentResetMonitorAlarm', sendParent({ type: 'alarm_cancelled' })],
      target: 'idle'
    }
  }
}
```

#### 新增动作

| 动作 | 说明 |
|-----|------|
| `broadcastMonitorAlarm` | 根据reason播报对应语音，开启控制端报警器 |
| `resetMonitorAlarm` | 关闭控制端报警器 + 播报"取消报警" |
| `silentResetMonitorAlarm` | 仅关闭控制端报警器（无语音） |

### monitor-machine.ts

#### Context 新增字段

```typescript
lastHeartbeatTime: number;       // 上次心跳时间
heartbeatFailureCount: number;   // 连续失败次数
isMonitorAlarming: boolean;      // 是否正在监控报警中（防止重复触发）
```

#### 心跳检测逻辑

1. 使用 XState `invoke` 服务定时执行心跳检测
2. 验证收到的数据帧是否为有效的主动上报帧格式（`isActiveReportFrame`）
3. 超过30秒未收到有效帧，`heartbeatFailureCount++`
4. 连续失败3次后发送 `monitor_anomaly` 事件

### main-machine.ts

#### 更新 alarm invoke input

```typescript
trigger: event.type === 'monitor_anomaly' ? event.reason : ...
```

#### 新增事件处理

```typescript
monitor_recover: {
  actions: sendTo('alarm', { type: 'RECOVER' })
}
```

## 与现有报警的区别

| 特性 | 钥匙/振动报警 | 监控报警 |
|-----|-------------|---------|
| 报警器 | 柜体 + 控制端 | **仅控制端** |
| 语音播报 | 柜体 + 控制端 | **仅控制端** |
| 解除方式 | ALARM_CANCEL | ALARM_CANCEL 或 RECOVER |

## 测试用例

1. 监控报警触发时进入 `monitor_alarm` 状态
2. 区分语音播报（connection/heartbeat/network）
3. `ALARM_CANCEL` 解除报警并播报"取消报警"
4. `RECOVER` 静默解除报警
5. 30秒心跳检测间隔
6. 连续3次失败触发报警
