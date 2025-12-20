# Implementation Plan - Apply for Ammo Strategy

## Phase 1: Infrastructure & Core Logic [checkpoint: a478310]
- [x] Task: Update `RelayStrategy` Interface [5cb9f4a]
    - [ ] Modify `src/relay-strategies/index.ts` to support passing `previousState` (or manage state within context).
    - [ ] Update `RelayContext.updateState` to maintain `lastCombinedState` and pass it to `strategy.execute` (or `match`).
    - [ ] Update existing strategy implementations (if any) to match new interface signature.
- [x] Task: Create ApplyAmmoStrategy [7eb4eba]
    - [ ] Create `src/relay-strategies/apply-ammo.ts`.
    - [ ] Implement `match` logic (Cabinet 1 closed).
    - [ ] Implement `execute` logic with edge detection:
        - Detect rising edge of Cabinet 1 -> Broadcast "已申请...".
        - Detect change of Control 4 (while Cabinet 1 is high) -> Broadcast "授权通过...".
- [x] Task: Register Strategy [f1758cf]
    - [ ] Update `src/business-logic.ts` to register `ApplyAmmoStrategy` into `RelayContext`.

## Phase 2: Testing
- [ ] Task: Unit Tests for ApplyAmmoStrategy
    - [ ] Create `test/relay-strategies/apply-ammo.test.ts`.
    - [ ] Test Case: Cabinet 1 Rising Edge -> Should broadcast "Apply".
    - [ ] Test Case: Cabinet 1 High, Control 4 Toggle -> Should broadcast "Authorized".
    - [ ] Test Case: Cabinet 1 Low -> No broadcast.
    - [ ] Test Case: No state change -> No broadcast (Debounce check).
- [ ] Task: Integration Verification
    - [ ] Verify `RelayContext` correctly triggers the strategy with mocked VoiceBroadcastController.
- [ ] Task: Conductor - User Manual Verification 'Testing' (Protocol in workflow.md)
