# Story 3.5: Handle Validation & System Errors

Status: done

## Story

As a **User**,
I want **specific error messages if saving fails**,
so that **I can fix the underlying issue**.

## Acceptance Criteria

1. **Given** The server rejects a configuration (e.g., port conflict)
   **When** The API returns a 400 Bad Request
   **Then** The frontend highlights the specific field causing the error
   **And** Displays the server-provided error message suitable for humans

2. **Given** A system-level error occurs (e.g., database failure)
   **When** The API returns a 500 Internal Server Error
   **Then** A global error notification (Toast) is displayed with the error details

## Tasks / Subtasks

- [x] Task 1: Enhance API Error Handling Logic (AC: #1, #2)
  - [x] 1.1 Create `ApiError` class in `packages/frontend/src/lib/errors.ts` (or `api.ts`) to encapsulate status, message, and `validationErrors`.
  - [x] 1.2 Update `apiFetch` in `packages/frontend/src/lib/api.ts` to throw `ApiError` with parsed JSON body when response is not OK (especially 400).
  - [x] 1.3 Ensure `validationErrors` from backend Zod responses are correctly mapped into the `ApiError` object.

- [x] Task 2: Integrate Server-Side Validation with ConfigForm (AC: #1)
  - [x] 2.1 Update `ConfigForm.tsx` `onSubmit` handler to catch `ApiError`.
  - [x] 2.2 Implement logic to iterate over `error.validationErrors` and call `form.setError` for each field.
  - [x] 2.3 Ensure nested fields (e.g., `network.ipAddress`) are correctly targeted by `setError`.

- [x] Task 3: Refine Config Update Hook (AC: #2)
  - [x] 3.1 Update `useUpdateConfig.ts` to ensure it propagates `ApiError` to the component for handling.
  - [x] 3.2 Review `toast.error` logic in `useUpdateConfig` to prevent double-alerting if the error is already handled by form fields (optional: suppress toast if `validationErrors` exist).

- [x] Task 4: Unit Testing (AC: #1)
  - [x] 4.1 Update `ConfigForm.test.tsx` to simulate a 400 Bad Request with `validationErrors`.
  - [x] 4.2 Verify that the form fields display the server-provided error messages (red border + helper text).
  - [x] 4.3 Verify that 500 errors still trigger the global Toast notification.

## Dev Notes

- **API Architecture**: The backend uses Zod for validation and returns 400 with a standard body structure: `{ success: false, error: "...", validationErrors: { "field": ["msg"] } }`. The frontend must match this contract.
- **Error Propagation**: `react-query`'s `useMutation` allows `mutateAsync` to throw errors. `ConfigForm` should use `mutateAsync` and a `try/catch` block to handle specific validation errors, while letting generic errors fall through or be handled by global handlers.
- **ApiError Class**: A simple extension of `Error` is sufficient:
  ```typescript
  export class ApiError extends Error {
    constructor(message: string, public status: number, public data: any) {
      super(message);
      this.name = 'ApiError';
    }
    get validationErrors() { return this.data?.validationErrors; }
  }
  ```
- **Testing Strategy**: Mock `fetch` or `apiFetch` to reject with the specific JSON structure. `ConfigForm` tests should assert `screen.getByText("server error message")` is visible.

### Existing Implementation Analysis
- **Current State**: `api.ts` currently swallows the JSON body of error responses, throwing only `error.message`. This prevents access to `validationErrors`.
- **Form State**: `ConfigForm` relies purely on client-side Zod validation. It needs to accept server-side errors which might involve complex business logic (e.g., port conflicts not checkable by client regex).

### Architecture Compliance
- **Shared Schemas**: Ensure frontend uses the same field names as the backend/shared schemas to ensure `validationErrors` keys match form field names.
- **Error Handling**: Follows the pattern of "Fast Fail" and specific user feedback.

### Library/Framework Requirements
- **react-hook-form**: Use `setError` method.
- **zod**: Backend already uses it; frontend just consumes the error output.

### File Structure Notes

**Key Files**:
- `packages/frontend/src/lib/api.ts` (Enhancement target)
- `packages/frontend/src/components/dashboard/ConfigForm.tsx` (Integration target)
- `packages/frontend/src/hooks/useUpdateConfig.ts` (Logic refinement)

**Test Files**:
- `packages/frontend/src/components/dashboard/__tests__/ConfigForm.test.tsx`

### Git Intelligence
- No major recent changes to `api.ts`.
- `ConfigForm.tsx` was recently modified for Restart flow; ensure new validation logic doesn't break the restart alert flow.

## References

- [Source: epics.md#Story 3.5](file:///home/liqingshan/workspace/frontend/hardware-controller/_bmad-output/epics.md)
- [Source: api.ts](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/frontend/src/lib/api.ts)
- [Source: config.routes.ts](file:///home/liqingshan/workspace/frontend/hardware-controller/packages/backend/src/routes/config.routes.ts)

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

- ✅ Created `ApiError` class in `packages/frontend/src/lib/errors.ts` (new file)
- ✅ Updated `apiFetch` to throw `ApiError` with parsed error data including `validationErrors`
- ✅ Updated `ConfigForm.tsx` to catch `ApiError` and display validation errors on form fields
- ✅ Updated `useUpdateConfig.ts` to suppress toast for validation errors (only show toast for non-validation errors like 500)
- ✅ Added 3 new test cases for Story 3.5: 400 validation errors, 500 system errors, and toast suppression behavior

### File List
- packages/frontend/src/lib/api.ts (modified)
- packages/frontend/src/lib/errors.ts (already existed)
- packages/frontend/src/components/dashboard/ConfigForm.tsx (modified)
- packages/frontend/src/hooks/useUpdateConfig.ts (modified)
- packages/frontend/src/components/dashboard/__tests__/ConfigForm.test.tsx (modified)

### Change Log
- 2025-12-27: Implemented Story 3.5 - Handle Validation & System Errors
  - Enhanced API error handling to preserve validation error details
  - Integrated server-side validation errors with form fields
  - Prevented double-alerting by suppressing toast for validation errors
  - Added comprehensive tests for validation error handling

## Senior Developer Review (AI)

_Reviewer: 青山 on 2025-12-27_

### Findings
- **Medium**: `packages/frontend/src/lib/errors.ts` was untracked/new but described as "already existed".
- **Low**: Type safety issue in `ConfigForm.tsx` (`as any` cast).

### Actions
- [x] Fixed type safety in `ConfigForm.tsx`.
- [x] Corrected "Completion Notes" to reflect `errors.ts` is a new file.
- [x] Confirmed `errors.ts` is correctly implemented.

### Outcome
**Approve** with auto-fixes applied.
