# Track Specification: Door Open Timeout Alarm

## Overview
Enhance the `ApplyAmmoMachine` state machine to monitor the duration the door remains open. If the door stays open beyond a configurable timeout, trigger an audible/visual alarm by setting specific relays to "High" and broadcasting a voice warning.

## Functional Requirements

### 1. Configuration
- Add `DOOR_OPEN_TIMEOUT_MS` to the environment variables (`.env`) and Zod schema.
- **Default Value:** 30000 (30 seconds).
- **Unit:** Milliseconds (ms).

### 2. State Machine Enhancement (`ApplyAmmoMachine`)
- **Timeout Logic:** Upon entering the `door_open` state, start a timer based on `DOOR_OPEN_TIMEOUT_MS`.
- **State Transition:** If the `door_closed` event is NOT received before the timer expires, transition to a new state: `door_open_timeout`.
- **Alarm Trigger (Entry Action):** When entering the `door_open_timeout` state:
    1.  Send "High" commands to:
        -   Cabinet UDP Client: Relay 8
        -   Control UDP Client: Relay 1
    2.  **Voice Broadcast:** Trigger a voice broadcast with the message: "柜门超时未关" (Door open timeout).
- **Alarm Recovery:** When a `door_closed` event is received while in the `door_open_timeout` state:
    - Transition to the `door_closed` state.
    - **Exit Action:** Send "Low" commands to the same relays (Cabinet 8, Control 1) to stop the alarm.

## Non-Functional Requirements
- **Reliability:** Ensure the alarm is reliably turned off when the door closes, even if multiple state transitions occur.
- **Observability:** Log the start of the timeout, the triggering of the alarm (relays + voice), and the clearing of the alarm using Pino.

## Acceptance Criteria
- [ ] `DOOR_OPEN_TIMEOUT_MS` is correctly parsed from `.env`.
- [ ] If the door closes before the timeout, no alarm is triggered.
- [ ] If the door remains open past the timeout, the machine enters `door_open_timeout`.
- [ ] Upon entering `door_open_timeout`, the 4 specific relays are set to "High".
- [ ] Upon entering `door_open_timeout`, the voice message "柜门超时未关" is broadcast.
- [ ] Closing the door while in `door_open_timeout` transitions the machine to `door_closed` and sends 4 "Low" relay commands.
- [ ] Unit tests cover the timeout transition, relay command execution, and voice broadcast trigger.

## Out of Scope
- Modifying the hardware polling frequency.
- Adding physical reset buttons for the alarm (software-only reset via door closure).
