# Implementation Plan - Refactor & Modularization

## Phase 1: Preparation & Poller Machine [checkpoint: 4900329]
- [x] Task: Create `PollerMachine` in `src/state-machines/poller-machine.ts` [a9c757b]
    - [x] Create `PollerMachine` using XState
    - [x] Define states: `idle`, `polling`, `waiting`
    - [x] Implement `start`, `stop`, `tick` events
    - [x] Add `queryRelayStatus` action invoking hardware manager
- [x] Task: Unit Test `PollerMachine` [a9c757b]
    - [x] Verify state transitions
    - [x] Verify action invocations (mocking hardware manager)
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Refactor Components
- [x] Task: Extract Hardware & Voice Initialization [3a3b4a8]
    - [x] Create `src/hardware/initializer.ts` (or similar) to handle config-driven setup
    - [x] Create `src/voice-broadcast/initializer.ts`
    - [x] Unit tests for initializers
- [x] Task: Extract Relay Reset Logic [3a3b4a8]
    - [x] Create `src/relay/reset.ts`
    - [x] Unit tests ensuring it sends correct commands to all targets
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Orchestration & Cleanup
- [ ] Task: Update `src/index.ts`
    - [ ] Import and instantiate new initializers
    - [ ] Instantiate `HardwareCommunicationManager`
    - [ ] Instantiate `RelayStatusAggregator` & `ApplyAmmoFlow`
    - [ ] Instantiate `PollerMachine`
    - [ ] Implement `onIncomingData` handler directly in `index.ts` to route packets
    - [ ] Wire up system start/stop signals
- [ ] Task: Verify Integration
    - [ ] Run existing integration tests
    - [ ] Fix any breakages due to refactoring
- [ ] Task: Delete `src/business-logic.ts`
    - [ ] Remove file
    - [ ] Remove references in `package.json` or other config if any
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
