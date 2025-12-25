# Data Models - Root Part

## Overview

This project uses TypeScript interfaces to define data structures for hardware communication, network configuration, and state machine events. It does not use a traditional database (SQL/NoSQL) but relies on **in-memory state management** via XState and transient message payloads.

## State Machine Events

Defined in `src/types/state-machine.ts`.

| Event Type | Priority | Description | Payload |
| :--- | :--- | :--- | :--- |
| `key_detected` | P0 (Critical) | Mechanical key usage detected | - |
| `vibration_detected` | P0 (Critical) | Forced entry/vibration detected | - |
| `monitor_anomaly` | P1 (High) | Monitor system anomaly | `data: any` |
| `apply_request` | P2 (Normal) | User requests ammo application | - |
| `authorize_request` | P2 (Normal) | Remote authorization granted | - |
| `refuse_request` | P2 (Normal) | Remote authorization refused | - |
| `finish_request` | P2 (Normal) | Operation finished by user | - |
| `operation_complete` | P2 (Normal) | Full cycle complete | - |
| `cabinet_lock_changed`| P2 (Normal) | Cabinet door status change | `isClosed: boolean` |
| `monitor_tick` | P3 (Low) | Periodic monitoring tick | - |

## Network & Hardware Models

Defined in `src/types/index.ts`.

### Network Config
Configuration for TCP/UDP connections.

```typescript
interface NetworkConfig {
  host: string;
  port: number;
  framing?: boolean; // Default true
  heartbeatInterval?: number; // 30s default
}
```

### Hardware Command
Structure for sending commands to generic hardware.

```typescript
interface HardwareCommand {
  command: string;
  parameters?: Record<string, unknown>;
  expectResponse?: boolean;
}
```

### Message Payload
Raw data structure for network IO.

```typescript
interface MessagePayload {
  data: Uint8Array | string;
  timestamp: number;
  id?: string;
}
```
