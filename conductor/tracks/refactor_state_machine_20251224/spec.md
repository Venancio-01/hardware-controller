# Track Specification: Refactor State Machine Architecture (Main-Sub Mixed SM)

## Overview
Refactor the current state machine architecture from independent, loosely coupled machines to a hierarchical "Main-Sub" structure based on the design document `docs/状态机设计方案.md`. This architecture uses a Main Coordinator to manage global system states (`IDLE`, `NORMAL`, `ALARM`, `ERROR`) and delegates specific logic to sub-machines (Actors) using XState V5's native Actor model.

## Functional Requirements

### 1. Main Coordinator (Main Machine)
- Implement a `main-machine.ts` that manages the top-level system state.
- **States**: `idle`, `normal` (business flow active), `alarm` (any alarm active), `error`.
- **Responsibilities**:
    - Spawn and manage the lifecycle of sub-machines (Actors).
    - Handle global events (P0/P1 events like key detection, vibration) and transition to the `alarm` state.
    - Coordinate transitions between sub-machines (e.g., when `normal` flow finishes, return to `idle`).

### 2. Sub-Machine Refactoring
- **Normal Flow**: Refactor `apply-ammo-machine.ts` to work as a child actor. It should report its completion/status to the parent.
- **Monitor Flow**: Rename `poller-machine.ts` to `monitor-machine.ts`. It will handle hardware polling and health monitoring. It should trigger events to the Main machine when anomalies are detected.
- **Alarm Flow**: Create a skeleton `alarm-machine.ts` in `src/state-machines/` with basic states (`idle`, `active`, `acknowledged`).

### 3. Communication Pattern
- Use XState V5 **Actor Model**.
- Parent (Main) communicates with children via `sendTo`.
- Children communicate with Parent via `enqueue.raise` or by Parent observing child snapshots.
- Use a unified event system for hardware inputs (P0-P3 priorities as defined in the design doc).

## Non-Functional Requirements
- **Maintainability**: Ensure the refactored machines are easier to extend with new alarm types (Sensor, Key).
- **Type Safety**: Use TypeScript to define global events and machine contexts.
- **Reliability**: State transitions must be consistent; critical hardware events must interrupt low-priority business flows.

## Acceptance Criteria
- [ ] A `main-machine.ts` is created and successfully spawns `monitor`, `normal`, and `alarm` actors.
- [ ] `poller-machine.ts` is renamed to `monitor-machine.ts` and integrated.
- [ ] `apply-ammo-machine.ts` logic is preserved but wrapped as a child actor.
- [ ] A "Key Detection" or "Vibration" event successfully transitions the Main machine to the `alarm` state, regardless of the `normal` flow's current state.
- [ ] All existing tests pass after refactoring (or are updated to reflect the new hierarchy).

## Out of Scope
- Full implementation of specific sensor alarm logic (this track creates the *architecture* and *skeletons*).
- Changes to hardware communication protocols (UDP/TCP).
