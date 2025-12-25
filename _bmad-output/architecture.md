# Architecture Documentation - Root Part

## Executive Summary
This project (`node-switch`) is a backend hardware controller service built with **Node.js/Bun** and **TypeScript**. It utilizes **XState** for robust state management to control hardware devices via **UDP/TCP** protocols. The system is designed to handle critical real-time events like key detection and vibration alarms with high reliability.

## Technology Stack

| Category | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js / Bun | >=22.0.0 | Bun preferred for performance |
| **Language** | TypeScript | 5.9.3 | Strict typing enforced |
| **State Management** | XState | 5.12.1 | Core logic engine |
| **Networking** | Native TCP/UDP | - | Direct socket communication |
| **Validation** | Zod | 4.2.1 | Runtime schema validation |
| **Logging** | Pino | 10.1.0 | Structured JSON logging |

## Architecture Pattern
**Event-Driven State Machine Architecture**

The system follows a hierarchical actor model driven by XState:

1.  **Hardware Layer (HAL)**:
    - Receives raw bytes from UDP/TCP.
    - Deserializes packets into `MessagePayload` objects.
    - Dispatches to `HardwareManager`.

2.  **Aggregation Layer**:
    - `RelayStatusAggregator` processes high-frequency status polls.
    - Filters noise and emits clean business events (e.g., `key_detected`, `cabinet_lock_changed`).

3.  **Core Logic Layer (State Machine)**:
    - `MainMachine` receives events.
    - Delegates to child actors:
        - `alarm`: Handles P0 Critical events.
        - `monitor`: Handles P1/P3 System health.
        - `applyAmmo`: Handles P2 Business workflows.

4.  **Action Layer**:
    - State transitions trigger actions.
    - Actions invoke `HardwareManager` to send commands back to devices (e.g., Open Relay, Broadcast Voice).

## Data Architecture
Since there is no persistent database, "Data" refers to:
- **Transient State**: Held in XState context.
- **Hardware State**: Polled from devices (Relays).
- **Configuration**: Loaded from `.env` and `src/config/`.

## Key Components
- **Main Actor**: The central brain.
- **Hardware Manager**: The I/O gateway.
- **Relay Controller**: Protocol builder for switch control.
- **Voice Broadcast Controller**: Protocol builder for audio feedback.

## Deployment Architecture
- Designed to run as a **Systemd Service** (Linux) or standalone process.
- Recommends **Network Isolation** for hardware communication (e.g., VLAN for 192.168.1.x subnet).
