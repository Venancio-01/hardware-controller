# Plan: Independent Voice Broadcast Configuration and Initialization

## Phase 1: Configuration & Type Definitions [checkpoint: 4e57cb9]
- [x] Task: Update `.env.example` with new volume and speed variables for Cabinet and Control.
- [x] Task: Update `src/config/index.ts` to include Zod schema validation for the new variables.
- [x] Task: Update `src/types/index.ts` or relevant type files to define the `BroadcastOptions` and `VoiceClientConfig`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Configuration & Type Definitions' (Protocol in workflow.md)

## Phase 2: Core Controller Enhancement (TDD) [checkpoint: ea97cbe]
- [x] Task: Create/Update unit tests in `test/voice-broadcast/controller.test.ts` for independent module settings.
- [x] Task: Update `VoiceBroadcastController` to store and manage independent `volume` and `speed` for each client.
- [x] Task: Create/Update unit tests for the `broadcast` method with optional overrides.
- [x] Task: Implement the tag injection and override logic in `VoiceBroadcastController.broadcast`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Core Controller Enhancement' (Protocol in workflow.md)

## Phase 3: Business Logic Integration [checkpoint: 3ef133c]
- [x] Task: Update `src/business-logic.ts` to pass the new configuration values during `VoiceBroadcastController.initialize`.
- [x] Task: Verify that `BusinessLogicManager.initialize` correctly triggers the setup for both modules.
- [x] Task: Add an integration test in `test/integration/business-logic-relay.test.ts` (or a new one) to verify end-to-end configuration application.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Business Logic Integration' (Protocol in workflow.md)

## Phase 4: Final Verification & Cleanup
- [~] Task: Run all tests to ensure no regressions in relay or other voice functions.
- [ ] Task: Verify log output for correct initialization messages.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification & Cleanup' (Protocol in workflow.md)
