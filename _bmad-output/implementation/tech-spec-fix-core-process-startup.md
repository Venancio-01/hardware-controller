# Tech-Spec: Fix Core Process Startup Failure

**Created:** 2025-12-27
**Status:** Implementation Complete

## Overview

### Problem Statement
When running `npm run dev`, the `core` process fails to start with a `MODULE_NOT_FOUND` error.
Two underlying issues were identified:
1.  **Incorrect Environment**: `packages/backend` does not set `NODE_ENV=development` in its `dev` script, causing it to default to production behavior (looking for `dist/app.js` instead of `src/app.ts`).
2.  **Incorrect Path Resolution**: The `CoreProcessManager` in `packages/backend` resolves the `core` package path using `../../../core`, which incorrectly points to the project root instead of `packages/core`.

### Solution
1.  Update `packages/backend/package.json` to set `NODE_ENV=development` in the `dev` script.
2.  Update `packages/backend/src/index.ts` to use the correct relative path (`../../core`) to locate the `core` package.

### Scope (In/Out)
*   **In**: modifying `packages/backend`.
*   **Out**: modifying `packages/core` (unless verification reveals issues, but manual build passed so `core` is likely fine).

## Context for Development

### Codebase Patterns
- Monorepo with `packages/*`.
- `backend` spawns `core` as a subprocess using `fork`.
- `tsx` is used for running TypeScript in development.

### Files to Reference
- `packages/backend/src/index.ts`: Entry point where `CoreProcessManager` is initialized.
- `packages/backend/package.json`: Scripts definition.
- `packages/core/tsup.config.ts`: (Reference only) Shows build output is `dist`.

### Technical Decisions
- Use `NODE_ENV=development` to trigger the `isDev` logic in `backend`.
- Use `--import tsx` (already present in `index.ts`) to allow spawning `src/app.ts` directly.

## Implementation Plan

### Tasks

- [x] Task 1: Update `packages/backend/package.json` implementation <!-- id: T1 -->
    - Change `"dev": "tsx watch src/index.ts"` to `"dev": "NODE_ENV=development tsx watch src/index.ts"`
- [x] Task 2: Fix path resolution in `packages/backend/src/index.ts` <!-- id: T2 -->
    - Change path resolution from `../../../core` to `../../core`.

### Acceptance Criteria

- [ ] AC 1: `npm run dev` starts without `core` crashing.
- [ ] AC 2: `core` logs indicate it is running from `src/app.ts` (e.g., via `tsx`).
- [ ] AC 3: `backend` correctly identifies `isDev` as true.

## Verification Plan

### Automated Tests
- None applicable directly to process spawning in unit tests (would require integration test spawning processes).

### Manual Verification
- Run `npm run dev` in the root (or `pnpm --recursive run dev`).
- Observe logs.
- Verify "Core process spawned" message appears and NO "Core process exited" crash loop occurs.

## Review Notes
- Adversarial review completed
- Findings: 4 total, 1 fixed, 3 skipped
- Resolution approach: auto-fix
