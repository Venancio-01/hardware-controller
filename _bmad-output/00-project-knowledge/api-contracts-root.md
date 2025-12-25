# API 合约 - 根部分

## 概述

作为后端硬件控制器，"API" 包括：
1.  **事件总线 API**: 由 XState 驱动的内部状态机事件。
2.  **硬件协议**: 发送到设备（继电器、语音模块）的 UDP/TCP 命令。

## 事件总线 API (XState)

系统由 `MainMachine` 驱动，该机器协调子 Actor（`monitor`, `alarm`, `applyAmmo`）。

### 主状态机
- **ID**: `main`
- **状态**: `idle`, `normal`, `alarm`, `error`
- **转换**:
    - `idle` → `normal`: 在 `apply_request` 时
    - `*` → `alarm`: 在 `key_detected`, `vibration_detected`, `monitor_anomaly` 时

### 子 Actor
| Actor | 用途 | ID |
| :--- | :--- | :--- |
| `monitor` | 定期系统健康检查 | `monitor` |
| `alarm` | 处理警报（振动、未授权按键） | `alarm` |
| `applyAmmo` | 处理弹药访问的业务流程 | `applyAmmo` |

## 硬件协议接口

在 `src/types/index.ts` 中定义。

### 命令接口
用于发送信号的通用接口。

```typescript
interface HardwareCommand {
  command: string;
  expectResponse?: boolean;
}
```

### 连接状态
网络套接字的状态。
`'connected' | 'disconnected' | 'connecting' | 'error'`

_（注意：特定硬件命令字符串和十六进制代码在 `hardware/` 和 `relay/` 模块中定义 - 详情请参见源码树分析）_