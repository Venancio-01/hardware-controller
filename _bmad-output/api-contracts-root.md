# API Contracts - Root Part

## Overview

As a backend hardware controller, the "API" consists of:
1.  **Event Bus API**: Internal state machine events driven by XState.
2.  **Hardware Protocol**: UDP/TCP commands sent to devices (Relays, Voice Modules).

## Event Bus API (XState)

The system is driven by a `MainMachine` that orchestrates child actors (`monitor`, `alarm`, `applyAmmo`).

### Main Machine
- **ID**: `main`
- **States**: `idle`, `normal`, `alarm`, `error`
- **Transitions**:
    - `idle` → `normal`: On `apply_request`
    - `*` → `alarm`: On `key_detected`, `vibration_detected`, `monitor_anomaly`

### Child Actors
| Actor | Purpose | ID |
| :--- | :--- | :--- |
| `monitor` | Periodic system health check | `monitor` |
| `alarm` | Handle alerts (vibration, unauthorized key) | `alarm` |
| `applyAmmo` | Handle business flow for ammo access | `applyAmmo` |

## Hardware Protocol Interfaces

Defined in `src/types/index.ts`.

### Command Interface
Generic interface for sending signals.

```typescript
interface HardwareCommand {
  command: string;
  expectResponse?: boolean;
}
```

### Connection Status
Status of network sockets.
`'connected' | 'disconnected' | 'connecting' | 'error'`

_(Note: Specific hardware command strings and hex codes are defined in the `hardware/` and `relay/` modules - see Source Tree Analysis for details)_
