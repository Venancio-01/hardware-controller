# Specification: Codebase Refactor & Modularization

## Overview
Refactor the system architecture by eliminating the bloated `src/business-logic.ts`. Responsibilities will be redistributed into domain-specific modules, and a new XState-based `PollerMachine` will be introduced to manage the hardware polling cycle. `src/index.ts` will serve as the final orchestrator.

## Functional Requirements

### 1. Redistribution of Responsibilities
- **Hardware & Voice Init**: Move the configuration and initialization logic out of `BusinessLogicManager`.
- **Relay Reset**: Implement a standalone relay reset utility to ensure hardware starts in a safe (disconnected) state.
- **Data Routing**: Move the packet parsing and routing logic (mapping raw data to `RelayStatusAggregator` and `ApplyAmmoFlow`) directly into `src/index.ts`.

### 2. Poller Machine (XState)
- Create a new state machine in `src/state-machines/poller-machine.ts`.
- **States**: `idle`, `polling`, `waiting`.
- **Responsibilities**:
    - Manage the `setInterval` logic within a robust state machine.
    - Emit commands to the `HardwareCommunicationManager` to query relay status.
    - Support starting and stopping the loop gracefully.

### 3. Entry Point Orchestration (`src/index.ts`)
- Manually instantiate and wire together:
    - `HardwareCommunicationManager`
    - `RelayStatusAggregator`
    - `ApplyAmmoFlow`
    - `PollerMachine`
- Setup the `onIncomingData` handler to bridge hardware responses to business logic.

### 4. Cleanup
- Permanently remove `src/business-logic.ts`.

## Non-Functional Requirements
- **Maintainability**: Clearer separation of concerns.
- **Robustness**: Use XState for the polling loop to handle edge cases or future complexity (e.g., adaptive polling intervals).
- **Testability**: Individual components should be easier to unit test.

## Acceptance Criteria
- [ ] `src/business-logic.ts` is deleted.
- [ ] The system successfully initializes hardware and voice modules on startup.
- [ ] Relays are reset upon initialization.
- [ ] Polling cycle correctly queries both 'cabinet' and 'control' targets.
- [ ] Status changes correctly trigger `ApplyAmmoFlow` logic.
- [ ] All existing integration tests pass (or are updated to reflect the new structure).
