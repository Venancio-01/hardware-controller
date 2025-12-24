# Implementation Plan: Door Open Timeout Alarm

## Phase 1: Configuration Update [checkpoint: da924a0]
- [x] Task: Update `src/config/index.ts` to include `DOOR_OPEN_TIMEOUT_MS` in `envSchema` with a default of 30000. c310296
- [x] Task: Update `.env.example` with the new configuration variable. c310296
- [x] Task: Verify configuration loading with a unit test in `test/config-validation.test.ts`. c310296
- [x] Task: Conductor - User Manual Verification 'Phase 1: Configuration Update' (Protocol in workflow.md)

## Phase 2: State Machine Logic Enhancement [checkpoint: 981716c]
- [x] Task: Define the new `door_open_timeout` state in `src/state-machines/apply-ammo-machine.ts`. 4f4f8ef
- [x] Task: Implement the delayed transition from `door_open` to `door_open_timeout` using XState `after` property. 4f4f8ef
- [x] Task: Implement the transition from `door_open_timeout` to `door_closed` upon `DOOR_CLOSED` event. 4f4f8ef
- [x] Task: Write unit tests in `test/state-machines/apply-ammo-machine.enhanced.test.ts` to verify the state transitions and timing. 4f4f8ef
- [x] Task: Conductor - User Manual Verification 'Phase 2: State Machine Logic Enhancement' (Protocol in workflow.md)

## Phase 3: Hardware Actions Integration [checkpoint: b8bf857]
- [x] Task: Define entry actions for `door_open_timeout` in `ApplyAmmoMachine` to trigger relay alarms (High) and voice broadcast. b8bf857
- [x] Task: Define exit actions (or entry actions for `door_closed` coming from timeout) to reset relay alarms (Low). b8bf857
- [x] Task: Integrate the actions into the flow in `src/business-logic/apply-ammo-flow.ts` (or where actions are mapped). b8bf857
- [x] Task: Write integration tests in `test/business-logic/apply-ammo-flow-enhanced.test.ts` to verify relay commands and voice broadcast calls are triggered correctly. b8bf857
- [x] Task: Conductor - User Manual Verification 'Phase 3: Hardware Actions Integration' (Protocol in workflow.md)
