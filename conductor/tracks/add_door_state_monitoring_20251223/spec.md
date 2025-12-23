# Specification: Add Door State Monitoring to Apply Ammo Flow

## Overview
Enhance the `ApplyAmmoFlow` and its underlying XState machine to monitor and react to cabinet door state changes (open/close) after authorization is granted. This ensures a complete audit trail and provides voice guidance to the user during the physical ammo retrieval process.

## Functional Requirements
1.  **Extended State Machine:**
    -   Add `authorized` state: Entered after receiving `AUTHORIZED` event. Transitions to `door_open` when `CABINET_DOOR_INDEX` becomes `high`.
    -   Add `door_open` state: Entered when door is opened.
        -   Action: Broadcast voice "已开门，请取弹，取弹后关闭柜门，并复位按键".
        -   Transition: Transitions to `door_closed` when `CABINET_DOOR_INDEX` becomes `low`.
    -   Add `door_closed` state: Entered when door is closed.
        -   Action 1: Broadcast voice "柜门已关闭".
        -   Action 2: Reset Electric Lock (Set `ELECTRIC_LOCK_OUT_INDEX` to `low`).
        -   Transition: Transitions back to `idle` automatically or upon `FINISHED` event logic.

2.  **Hardware Interaction:**
    -   Resetting the lock must be performed by sending a `dooff01` (since channel = 9 - 8 = 1) command via UDP to the `control` client using `HardwareCommunicationManager`.

3.  **Input Handling:**
    -   Update `ApplyAmmoFlow.handleCombinedChange` to detect changes in `CABINET_DOOR_INDEX` and send corresponding events to the state machine.

## Non-Functional Requirements
-   **Traceability:** Ensure all state transitions are logged via `StructuredLogger`.
-   **Reliability:** Hardware commands should be sent asynchronously without blocking the state machine's main loop.

## Acceptance Criteria
-   [ ] State machine includes `authorized`, `door_open`, and `door_closed` states.
-   [ ] Voice broadcast "已开门..." triggers exactly once when door opens after authorization.
-   [ ] Voice broadcast "柜门已关闭" triggers exactly once when door closes.
-   [ ] UDP command to reset the lock is sent to the `control` device when the door is closed.
-   [ ] The system returns to `idle` state after the sequence is complete.

## Out of Scope
-   Handling mechanical lock changes during this specific flow (unless it affects `CABINET_DOOR_INDEX`).
-   Modifying other business flows.
