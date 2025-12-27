# Tech-Spec: UI Adjustments and DNS Removal

**Created:** 2025-12-27
**Status:** Implementation Complete

## Overview

### Problem Statement
The current frontend interface displays duplicate status information (Core Status and Device Status). The bottom action bar in the configuration form has an unnecessary "Restart Immediately" button. Additionally, the DNS modification functionality needs to be removed from both frontend and backend as it is no longer supported.

### Solution
1.  **Frontend Layout**:
    *   Refactor the `Sidebar` to remove the "Device Status" panel.
    *   Rename the "Core Status" panel to "Program Status" (程序状态).
2.  **Action Buttons**:
    *   In `ConfigForm`, remove the "Restart Immediately" button.
    *   Ensure the "Restart Core" button is present (or replaces the immediate restart).
    *   Rename the "Restart Core" button text to "Restart Program" (重启程序).
3.  **DNS Removal**:
    *   Remove DNS configuration fields from the `NetworkConfigForm`.
    *   Remove DNS validation from the shared `networkSchema`.

### Scope (In/Out)
**In Scope:**
*   Frontend `Sidebar` component updates.
*   Frontend `ConfigForm` component updates.
*   Frontend `RestartCoreButton` updates.
*   Frontend `NetworkConfigForm` updates.
*   Shared `networkSchema` updates.
*   Related unit tests updates.

**Out Scope:**
*   Backend core start/restart logic (only button text/UI changes).
*   Other configuration fields (IP, Port, etc.) remain unchanged.

## Context for Development

### Codebase Patterns
*   **Frontend**: React + Tailwind CSS + Shadcn UI.
*   **State Management**: React Query, React Hook Form + Zod.
*   **Validation**: Shared Zod schemas in `packages/shared`.
*   **Testing**: Vitest + React Testing Library.

### Files to Reference
*   `packages/frontend/src/components/layout/Sidebar.tsx`
*   `packages/frontend/src/components/dashboard/ConfigForm.tsx`
*   `packages/frontend/src/components/system/RestartCoreButton.tsx`
*   `packages/frontend/src/components/system/RestartButton.tsx` (To be removed/unused)
*   `packages/frontend/src/components/config/NetworkConfigForm.tsx`
*   `packages/shared/src/schemas/network.schema.ts`

### Technical Decisions
*   **Button Replacement**: In `ConfigForm`, the `RestartButton` (which calls `useRestartSystem` / `/api/system/restart`) will be replaced by `RestartCoreButton` (which calls `restartCore` / `/api/core/restart`). This aligns with the requirement to "Only keep [Restart Core] button".
*   **Global Rename**: `RestartCoreButton` will be updated to display "Restart Program" (重启程序) to be consistent across the app (Sidebar and ConfigForm).

## Implementation Plan

### Tasks

- [x] **Task 1: Update Shared Validation Schema**
    - Modify `packages/shared/src/schemas/network.schema.ts` to remove `dns` field.
    - Update `packages/shared/test/schemas/network.schema.test.ts` to remove DNS related tests.

- [x] **Task 2: Update Frontend Network Form**
    - Modify `packages/frontend/src/components/config/NetworkConfigForm.tsx` to remove the DNS section (field array).
    - Update `packages/frontend/src/components/config/__tests__/NetworkConfigForm.test.tsx` to remove DNS related tests.

- [x] **Task 3: Update Sidebar Status Panel**
    - Modify `packages/frontend/src/components/layout/Sidebar.tsx`.
    - Remove the "Device Status" card.
    - Rename "Core Status" card title to "程序状态" (Program Status).

- [x] **Task 4: Update Restart Buttons**
    - Modify `packages/frontend/src/components/system/RestartCoreButton.tsx` to change button text from "重启 Core" to "重启程序" (Restart Program).
    - Modify `packages/frontend/src/components/dashboard/ConfigForm.tsx`:
        - Remove `<RestartButton />`.
        - Add `<RestartCoreButton />` in its place (or ensure it's present in the button group).
    - (Optional) Remove `packages/frontend/src/components/system/RestartButton.tsx` if unused.

### Acceptance Criteria

- [x] **AC 1: Status Panel Display**
    - Given I am on the dashboard
    - Then I should see a "程序状态" (Program Status) panel in the sidebar
    - And I should NOT see a separate "Device Status" panel
    - And the Program Status panel should show the core connection/process status.

- [x] **AC 2: Restart Action**
    - Given I am on the Configuration form
    - Then I should see a "重启程序" (Restart Program) button at the bottom
    - And I should NOT see "立即重启" (Restart Immediately) button
    - When I click "重启程序", it should trigger the Core restart (not full system restart).

- [x] **AC 3: DNS Removal**
    - Given I am editing Network Configuration
    - Then I should NOT see any DNS configuration fields
    - And the validation should not accept/require DNS fields.

## Additional Context

### Dependencies
*   None.

### Testing Strategy
*   **Unit Tests**: Run `pnpm test` to ensure updated schemas and components pass.
*   **Manual**: Verify UI changes in browser (Sidebar labels, Button text/action, Form fields).

### Notes
*   Ensure the `RestartCoreButton` style matches the other buttons in `ConfigForm` if necessary (e.g., size, variant). Currently `ConfigForm` buttons use `size="lg"`. `RestartCoreButton` uses `size="sm"` by default. Might need to pass props to adjust size.
