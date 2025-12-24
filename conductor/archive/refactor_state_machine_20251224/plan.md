# Implementation Plan: Refactor State Machine Architecture (Main-Sub Mixed SM)

## Phase 1: Foundation & Refactoring Preparation [checkpoint: 20fe256]
- [x] Task: Rename `poller-machine.ts` to `monitor-machine.ts` and update all existing imports/references. [f18d39b]
- [x] Task: Define global types and prioritized event schemas in `src/types/state-machine.ts` (P0-P3 priorities). [e32ed94]
- [x] Task: Create a skeleton `alarm-machine.ts` in `src/state-machines/` with basic states (`idle`, `active`, `acknowledged`). [17097cd]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md) [20fe256]

## Phase 2: Main Coordinator Implementation [checkpoint: 92297e7]
- [x] Task: Write TDD tests for `MainMachine` (verifying actor spawning and global state transitions from IDLE to ALARM/NORMAL). [37af71c]
- [x] Task: Implement `MainMachine` in `src/state-machines/main-machine.ts` using XState V5 Actor model. [37af71c]
- [x] Task: Conductor - User Manual Verification 'Phase 2: Main Coordinator' (Protocol in workflow.md) [92297e7]

## Phase 3: Sub-machine Integration [checkpoint: 5bc7c39]
- [x] Task: Refactor `monitor-machine.ts` (formerly poller) to act as a child actor and raise anomaly events to the parent. [499bffa]
- [x] Task: Refactor `apply-ammo-machine.ts` to act as a child actor and notify parent of completion/cancellation. [c78321b]
- [x] Task: Update the hardware initializer/manager to use the new `MainMachine` as the single point of entry for state. [1bfc270]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Integration' (Protocol in workflow.md) [5bc7c39]

## Phase 4: Final Verification & Cleanup [checkpoint: 7dd983b]
- [x] Task: Update existing integration tests (`test/integration/`) and orchestration tests to work with the new hierarchy. [e0160ef]
- [x] Task: Final verification of P0 event interruption (Key/Vibration interrupting a normal flow). [26d5c3a]
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Verification' (Protocol in workflow.md) [7dd983b]
