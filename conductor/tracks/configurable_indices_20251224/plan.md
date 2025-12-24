# Plan: Externalize Hardware Indices to Configuration

## Phase 1: Configuration Infrastructure
- [x] Task: Implement Zod schema validation for Hardware Input and Relay indices in `src/config/index.ts` and update `.env.example`. 1fd6f8a
    - **Goal**: Ensure all hardware indices are configurable via environment variables and strictly validated.
    - **TDD Steps**:
        1. Update `test/config-validation.test.ts` to define expected schema for `hardware.inputs` (e.g., `APPLY_INDEX`) and `hardware.relays` (e.g., `RELAY_LOCK_INDEX`). Assert it fails without implementation.
        2. Update `src/config/index.ts` to include these new fields in the Zod schema with default values matching current constants.
        3. Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Configuration Infrastructure' (Protocol in workflow.md)

## Phase 2: Refactor Input Constants
- [ ] Task: Replace hardcoded input constants in `src/business-logic/apply-ammo-flow.ts` with configuration values.
    - **Goal**: Make input signal processing dynamic based on config.
    - **TDD Steps**:
        1. Run existing `test/business-logic/apply-ammo-flow-enhanced.test.ts` to establish baseline.
        2. Modify `src/business-logic/apply-ammo-flow.ts` to import `config` and use `config.hardware.inputs.APPLY_INDEX` etc. instead of local constants.
        3. Verify all tests still pass (Regression Testing).
- [ ] Task: Conductor - User Manual Verification 'Refactor Input Constants' (Protocol in workflow.md)

## Phase 3: Refactor Relay Control
- [ ] Task: Replace hardcoded relay indices in `src/state-machines/apply-ammo-machine.ts` with configuration values.
    - **Goal**: Make relay control commands dynamic based on config.
    - **TDD Steps**:
        1. Run existing `test/state-machines/apply-ammo-machine.enhanced.test.ts` to establish baseline.
        2. Modify `src/state-machines/apply-ammo-machine.ts` to use `config.hardware.relays.RELAY_LOCK` etc.
        3. Verify all tests still pass (Regression Testing).
- [ ] Task: Conductor - User Manual Verification 'Refactor Relay Control' (Protocol in workflow.md)
