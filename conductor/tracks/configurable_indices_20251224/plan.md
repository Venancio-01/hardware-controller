# Plan: Externalize Hardware Indices to Configuration

## Phase 1: Configuration Infrastructure [checkpoint: 9858a30]
- [x] Task: Implement Zod schema validation for Hardware Input and Relay indices in `src/config/index.ts` and update `.env.example`. 1fd6f8a
- [x] Task: Conductor - User Manual Verification 'Configuration Infrastructure' (Protocol in workflow.md) 9858a30

## Phase 2: Refactor Input Constants
- [x] Task: Replace hardcoded input constants in `src/business-logic/apply-ammo-flow.ts` with configuration values. 47db749
- [x] Task: Conductor - User Manual Verification 'Refactor Input Constants' (Protocol in workflow.md)

## Phase 3: Refactor Relay Control
- [x] Task: Replace hardcoded relay indices in `src/state-machines/apply-ammo-machine.ts` with configuration values. [manual-fix]
- [x] Task: Conductor - User Manual Verification 'Refactor Relay Control' (Protocol in workflow.md)
