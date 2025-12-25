# Source Tree Analysis - Root Part

## Directory Structure

```
node-switch/
├── .agent/                 # AI Agent configuration
├── .bmad/                  # BMad Framework internal state
├── _bmad-output/           # Generated documentation output
├── config/                 # Configuration loading (env vars, schemas)
├── docs/                   # Existing project documentation (protocols, specs)
├── scripts/                # Utility scripts
├── src/                    # Application Source Code
│   ├── business-logic/     # Core business logic (Relay Aggregation)
│   ├── config/             # Config loader source
│   ├── hardware/           # Hardware Communication Managers (TCP/UDP)
│   ├── logger/             # Logging infrastructure (Pino wrapper)
│   ├── relay/              # Relay Control Module (Command Builder)
│   ├── state-machines/     # XState Machine Definitions (Main, Monitor, Alarm)
│   ├── tcp/                # TCP Client implementations
│   ├── types/              # TypeScript Definitions (Events, Protocols)
│   ├── udp/                # UDP Client implementations
│   ├── voice-broadcast/    # Voice Module Driver (CX-815E)
│   └── index.ts            # Application Entry Point
├── test/                   # Vitest Unit Tests
├── package.json            # Dependencies and Scripts
├── tsconfig.json           # TypeScript Configuration
└── README.md               # Project Overview
```

## Critical Folders

### `src/state-machines/`
**Purpose**: Contains the core application logic defined as XState state machines.
**Key Files**:
- `main-machine.ts`: The central orchestrator handling global events (`KeyDetected`, `Vibration`).
- `apply-ammo-machine.ts`: Handles the complex business flow for Ammo Application.
- `monitor-machine.ts`: Periodic health checks.

### `src/hardware/` & `src/relay/` & `src/voice-broadcast/`
**Purpose**: Hardware Abstraction Layers (HAL).
**Role**: These modules isolate the low-level UDP/TCP protocol details (hex codes, string parsing) from the high-level State Machine logic.

### `docs/`
**Purpose**: Contains critical reference specifications.
**Importance**:
- `ETH 设备通信协议说明V42.md` defines the relay control protocol.
- `CX-815E 网口语音播报模块集成指南 (V1.0).md` defines the voice broadcast protocol.

## Entry Points
- `src/index.ts`: Main application bootstrap. Initializes Hardware Manager, Voice Controller, and starts the Main Actor.

## Integration Points
- **UDP**: Used for Relay Control (Port 9005 typically, per standard ETH protocols).
- **TCP**: Used for Voice Broadcast Module.
