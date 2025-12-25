# Project Overview

## hardware-controller

**Description**: Bun + TypeScript hardware communication service.

A robust backend service designed to control hardware devices (Relays, Voice Modules) through network protocols (UDP/TCP). It uses **XState** for deterministic state management, ensuring reliable operation for critical events like unauthorized access (Vibration/Keys) and business flows (Ammo Application).

## Quick Facts

- **Type**: Backend Service (Monolith)
- **Primary Language**: TypeScript
- **Core Framework**: XState
- **Architecture**: Event-Driven State Machine
- **Communication**: UDP / TCP

## Documentation Map

| Document | Description |
| :--- | :--- |
| [Architecture](./architecture.md) | High-level design, components, and data flow |
| [Source Tree](./source-tree-analysis.md) | Directory structure and code organization |
| [API Contracts](./api-contracts-root.md) | Event definitions and Hardware Protocols |
| [Data Models](./data-models-root.md) | TypeScript interfaces and schemas |
| [Components](./component-inventory-root.md) | Hardware controllers and Logic modules |
| [Development](./development-guide.md) | Setup, testing, and deployment guide |

## Existing References (in `docs/`)
- `ETH 设备通信协议说明V42.md`: Relay control protocol reference.
- `CX-815E 网口语音播报模块集成指南 (V1.0).md`: Voice module reference.

## Repository Structure
The project is a **Monolith** containing all logic within `src/` and tests in `test/`.
