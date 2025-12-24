# Implementation Plan: Fix Missing apply_request Voice Broadcast on CH1 Closure

## Phase 1: Investigation & Reproduction
- [x] Task: Add detailed debug logs in `src/index.ts` and `src/state-machines/main-machine.ts` to trace the `apply_request` event flow. [37af71c]
- [x] Task: Create a reproduction script `scripts/repro-missing-broadcast.ts` to simulate `dostatus10000000` and observe system behavior. [26d5c3a]
- [x] Task: Analyze why `broadcastApply` is not triggered (Root cause: Event not forwarded during initial state transition). [7dd983b]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Investigation' (Protocol in workflow.md)

## Phase 2: Bug Fix Implementation
- [x] Task: Write a failing integration test in `test/integration/fix-broadcast.test.ts` that reproduces the missing broadcast issue. [7dd983b]
- [x] Task: Implement the fix in `src/index.ts` or `src/state-machines/main-machine.ts` based on Phase 1 findings. [3440a85]
- [x] Task: Verify the fix by running the newly created integration test (Green phase). [3440a85]
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Bug Fix' (Protocol in workflow.md)
- [ ] Task: Verify the fix by running the newly created integration test (Green phase).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Bug Fix' (Protocol in workflow.md)

## Phase 3: Cleanup & Final Verification
- [x] Task: Remove or tone down the extra debug logs added in Phase 1. [f2ed89c]
- [x] Task: Run all existing tests (`CI=true npm test`) to ensure no regressions. [f2ed89c]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Final Verification' (Protocol in workflow.md) [f2ed89c]
