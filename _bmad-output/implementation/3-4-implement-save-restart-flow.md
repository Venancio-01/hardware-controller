# Story 3.4: Implement Save & Restart Flow

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **to know when my changes are saved and applied**,
so that **I can be sure the system is updated**.

## Acceptance Criteria

1. **Given** I have modified the configuration
   **When** I click "Save Changes"
   **Then** The button shows a loading spinner
   **And** A Toast notification appears: "Configuration Saved"
   **And** A persistent Alert bar appears: "Restart Required to apply changes" with a "Restart Now" button

2. **Given** The "Restart Required" alert is visible
   **When** I click "Restart Now" inside the alert
   **Then** The system restart flow is triggered (confirmation dialog -> restart)

## Tasks / Subtasks

- [x] Task 1: Update ConfigForm Alert with Restart Action (AC: #1, #2)
  - [x] 1.1 Modify `ConfigForm.tsx` to import `RestartButton`
  - [x] 1.2 Update the `needsRestart` Alert component to include the `RestartButton` (aligned to the right or inline)
  - [x] 1.3 Ensure the Alert styling highlights the importance (e.g., proper spacing between text and button)

- [x] Task 2: Verify Toast Notification Logic (AC: #1)
  - [x] 2.1 Verify `useUpdateConfig` triggers `toast.success` correctly (already implemented, verify behavior)
  - [x] 2.2 Ensure Toast does not conflict with the persistent Alert

- [x] Task 3: Update Unit Tests (AC: #1)
  - [x] 3.1 Update `ConfigForm.test.tsx` to verify that the Alert contains a Restart button when `needsRestart` is true
  - [x] 3.2 Verify that clicking the button inside the Alert calls the restart handler

## Dev Notes

### Existing Implementation Analysis
- **Core Logic Exists**: `ConfigForm.tsx` already handles the `needsRestart` state and displays an Alert. `useUpdateConfig.ts` already triggers the Toast notification.
- **Component Reuse**: `RestartButton.tsx` is already implemented and used in the footer. It can be directly reused inside the Alert.
- **Hook Reuse**: `useUpdateConfig` already returning `needsRestart` boolean.

### Architecture Compliance
- **Shadcn UI**: Continue using `Alert` and `Button` components from `@/components/ui`.
- **Reusable Components**: Reuse `RestartButton` for consistent behavior (dialog, api call).

### Critical Design Decisions
- **Alert Placement**: The Alert is currently at the top of the form. The button should be placed inside the Alert for immediate action context.
- **Button Styling**: The button inside the Alert might need to be strictly sized (e.g., `size="sm"`) to fit well within the Alert layout without making it too tall.

### Library/Framework Requirements
- **lucide-react**: For icons in the Alert.
- **sonner**: For Toast notifications (already used).

### File Structure Notes

**Key Files**:
- `packages/frontend/src/components/dashboard/ConfigForm.tsx` (Target for modification)
- `packages/frontend/src/components/system/RestartButton.tsx` (Reusable component)
- `packages/frontend/src/hooks/useUpdateConfig.ts` (Logic verification)

**Test Files**:
- `packages/frontend/src/components/dashboard/__tests__/ConfigForm.test.tsx`

### Git Intelligence
- Previous commits established the `ConfigForm` and `RestartButton`.
- `RestartButton` handles the confirmation dialog internally, so placing it in the Alert is safe and will encompass the full confirmation flow automatically.

## References

- [Source: epics.md#Story 3.4](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md)
- [Source: ConfigForm.tsx](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/frontend/src/components/dashboard/ConfigForm.tsx)
- [Source: RestartButton.tsx](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/frontend/src/components/system/RestartButton.tsx)

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro (Claude Antigravity)

### Debug Log References

### Completion Notes List

### File List
- packages/frontend/src/components/dashboard/ConfigForm.tsx
- packages/frontend/src/components/dashboard/__tests__/ConfigForm.test.tsx
