# 数据模型

> **生成日期**: 2025-12-26

---

## 1. 配置模型 (Config)

```typescript
interface Config {
  deviceId: string;        // 设备ID
  timeout: number;         // 超时时间 (ms)
  retryCount: number;      // 重试次数
  pollingInterval: number; // 轮询间隔 (ms)
  ipAddress: string;       // IP 地址
  subnetMask: string;      // 子网掩码
  gateway: string;         // 网关
  port: number;            // 端口
  dns: string[];           // DNS 服务器列表
}
```

---

## 2. 网络配置 (NetworkConfig)

```typescript
interface NetworkConfig {
  ipAddress: string;       // IPv4 地址
  subnetMask: string;      // 子网掩码
  gateway: string;         // 网关地址
  dns: string[];           // DNS 列表
}
```

---

## 3. 设备状态 (DeviceStatus)

```typescript
interface DeviceStatus {
  connected: boolean;      // 连接状态
  lastSeen: Date;          // 最后响应时间
  relayStatus: boolean[];  // 继电器状态数组
}
```

---

## 4. API 响应类型

```typescript
// 成功响应
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  needsRestart?: boolean;
}

// 错误响应
interface ApiErrorResponse {
  success: false;
  error: string;
  validationErrors?: Record<string, string[]>;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## 5. 状态机事件类型

```typescript
type SystemEvent =
  | { type: 'apply_request'; priority: EventPriority }
  | { type: 'authorize_request' }
  | { type: 'refuse_request' }
  | { type: 'finish_request' }
  | { type: 'cabinet_lock_changed'; isClosed: boolean }
  | { type: 'key_detected' }
  | { type: 'vibration_detected' }
  | { type: 'monitor_tick'; priority: EventPriority }
  | { type: 'monitor_anomaly' }
  | { type: 'alarm_cancel_toggled' }
  | { type: 'alarm_cancelled' }
  | { type: 'operation_complete'; priority: EventPriority };
```

---

## 6. 硬件响应类型

```typescript
interface HardwareResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}
```
