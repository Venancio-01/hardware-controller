# 数据模型 - 根部分

## 概述

该项目使用 TypeScript 接口定义硬件通信、网络配置和状态机事件的数据结构。它不使用传统数据库（SQL/NoSQL），而是依赖于通过 XState 进行的 **内存中状态管理** 和临时消息负载。

## 状态机事件

在 `src/types/state-machine.ts` 中定义。

| 事件类型 | 优先级 | 描述 | 负载 |
| :--- | :--- | :--- | :--- |
| `key_detected` | P0 (严重) | 检测到机械按键使用 | - |
| `vibration_detected` | P0 (严重) | 检测到强制进入/振动 | - |
| `monitor_anomaly` | P1 (高) | 监控系统异常 | `data: any` |
| `apply_request` | P2 (普通) | 用户请求弹药申请 | - |
| `authorize_request` | P2 (普通) | 远程授权已授予 | - |
| `refuse_request` | P2 (普通) | 远程授权被拒绝 | - |
| `finish_request` | P2 (普通) | 用户完成操作 | - |
| `operation_complete` | P2 (普通) | 完整周期完成 | - |
| `cabinet_lock_changed`| P2 (普通) | 柜门状态变化 | `isClosed: boolean` |
| `monitor_tick` | P3 (低) | 定期监控滴答 | - |

## 网络和硬件模型

在 `src/types/index.ts` 中定义。

### 网络配置
TCP/UDP 连接的配置。

```typescript
interface NetworkConfig {
  host: string;
  port: number;
  framing?: boolean; // 默认为 true
  heartbeatInterval?: number; // 默认 30 秒
}
```

### 硬件命令
向通用硬件发送命令的结构。

```typescript
interface HardwareCommand {
  command: string;
  parameters?: Record<string, unknown>;
  expectResponse?: boolean;
}
```

### 消息负载
网络 IO 的原始数据结构。

```typescript
interface MessagePayload {
  data: Uint8Array | string;
  timestamp: number;
  id?: string;
}
```