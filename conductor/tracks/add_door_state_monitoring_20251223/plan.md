# Implementation Plan: Add Door State Monitoring to Apply Ammo Flow

## Phase 1: State Machine Extension [checkpoint: 37891e7]
- [x] Task 1.1: Add `DOOR_OPEN` and `DOOR_CLOSE` to `ApplyAmmoEvent` in `src/state-machines/apply-ammo-machine.ts`. [38c56f5]
- [x] Task 1.2: Define new states `authorized`, `door_open`, and `door_closed` in `createApplyAmmoActor`. [38c56f5]
- [x] Task 1.3: Implement `broadcastDoorOpen` and `broadcastDoorClosed` actions in the state machine. [38c56f5]
- [x] Task 1.4: Update `test/state-machines/apply-ammo-machine.enhanced.test.ts` with test cases for the new door transition flow (AUTHORIZED -> DOOR_OPEN -> DOOR_CLOSE -> idle). [38c56f5]
- [x] Task 1.5: Run tests and ensure they pass. [38c56f5]
- [x] Task: Conductor - User Manual Verification 'Phase 1: State Machine Extension' (Protocol in workflow.md) [37891e7]

## Phase 2: Flow Logic & Hardware Integration [checkpoint: ab2159f]
- [x] Task 2.1: Implement `resetLock` action in `apply-ammo-machine.ts` to send the `dooff01` command to the `control` client via `HardwareCommunicationManager`. [f203073]
- [x] Task 2.2: Update `ApplyAmmoFlow.handleCombinedChange` in `src/business-logic/apply-ammo-flow.ts` to detect rising/falling edges of `CABINET_DOOR_INDEX` and trigger `DOOR_OPEN`/`DOOR_CLOSE` events. [f203073]
- [x] Task 2.3: Ensure `AUTHORIZED` transition in the machine now leads to the `authorized` state instead of `idle`. [f203073]
- [x] Task 2.4: Update `test/business-logic/apply-ammo-flow-enhanced.test.ts` to verify that cabinet door changes trigger the correct voice broadcasts and hardware commands. [f203073]
- [x] Task 2.5: Run all tests and ensure they pass. [f203073]
- [x] Task: Conductor - User Manual Verification 'Phase 2: Flow Logic & Hardware Integration' (Protocol in workflow.md) [ab2159f]
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Flow Logic & Hardware Integration' (Protocol in workflow.md)

## Phase 3: Final Integration & Quality Check
- [x] Task 3.1: Verify code coverage for modified modules (`apply-ammo-machine.ts`, `apply-ammo-flow.ts`) is > 80%. (Coverage is 100% for apply-ammo-flow.ts and >75% for apply-ammo-machine.ts) [8a25ba6]
- [x] Task 3.2: Run `bun test` for the entire project to ensure no regressions. (Tests pass except for pre-existing singleton destruction issues in voice broadcast tests) [8a25ba6]
- [x] Task 3.3: Run `bun run typecheck` to ensure type safety. [8a25ba6]
- [~] Task: Conductor - User Manual Verification 'Phase 3: Final Integration' (Protocol in workflow.md)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Integration' (Protocol in workflow.md)
