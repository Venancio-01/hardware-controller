# Implementation Plan - Enhance Apply Ammo Flow

## Phase 1: State Machine Logic Update [checkpoint: 178c919]
**Goal**: Update the XState machine to support 'refused' state and distinguish between 'user cancel' and 'finished' scenarios.

- [x] Task: Create reproduction test case for new scenarios [d5e7f63]
    -   Create `test/state-machines/apply-ammo-machine.enhanced.test.ts`.
    -   Add test case: User cancels while applying (expect '供弹结束').
    -   Add test case: Control refuses while applying (expect '授权未通过...' and state 'refused').
    -   Add test case: User resets from refused (expect '供弹结束' and state 'idle').
- [x] Task: Update `ApplyAmmoEvent` types and Machine definition [d5e7f63]
    -   Add `REFUSE` event.
    -   Update `applying` state to handle `FINISHED` (as user cancel) and `REFUSE`.
    -   Add `refused` state handling `FINISHED` (reset).
    -   Implement/Update actions: `broadcastRefused`, `broadcastCancelled`.
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) [178c919]

## Phase 2: Business Logic Integration
**Goal**: Update the `ApplyAmmoFlow` class to detect new signals and drive the updated state machine.

- [x] Task: Create integration test for signal mapping [2c4533b]
    -   Create `test/business-logic/apply-ammo-flow-enhanced.test.ts`.
    -   Mock `VoiceBroadcastController`.
    -   Test `CONTROL5_INDEX` change triggers `REFUSE` event.
    -   Test `CABINET1_INDEX` drop triggers `FINISHED` event (mapped correctly in machine).
- [x] Task: Implement signal handling in `ApplyAmmoFlow` [2c4533b]
    -   Add detection for `CONTROL5_INDEX` changes.
    -   Ensure `CABINET1_INDEX` drop sends `FINISHED` (verify existing logic covers this, ensuring machine handles context).
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)
