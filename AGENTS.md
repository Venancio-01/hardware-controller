# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` is the library entry point; exports the hardware communication manager and core APIs.
- Protocol implementations live in `src/udp/`, `src/tcp/`, and relay logic in `src/relay/`.
- Shared utilities and logging are in `src/utils/` and `src/logger/`.
- Configuration and environment validation live in `src/config/` with Zod schemas in `src/config/schema.ts`.
- Types are centralized in `src/types/`. Build output goes to `dist/`.
- Protocol documentation is stored in `docs/`, and runtime config helpers live in `config/`.

## Build, Test, and Development Commands
- `pnpm dev`: run the library in development with `nodemon` on `src/index.ts`.
- `pnpm build`: compile TypeScript to `dist/` using `tsc`.
- `pnpm start`: execute the compiled entry point (`node dist/index.js`).
- `pnpm test`: run the Vitest test runner (see Testing Guidelines).
- `pnpm test:watch`: run tests in watch mode.
- `pnpm clean`: remove `dist/` artifacts.

## Coding Style & Naming Conventions
- TypeScript, ES module syntax, and explicit `.js` extensions in import paths (per Node ESM).
- 2-space indentation and `strict` TypeScript settings (see `tsconfig.json`).
- Follow the existing file’s semicolon and quote style to keep diffs minimal.
- Prefer descriptive class names like `UDPClient`/`TCPClient` and config keys aligned with `Env` in `src/config/schema.ts`.
- No formatter or linter is configured; keep changes small and consistent.

## Testing Guidelines
- Tests are expected in `src/**/*.test.ts` or `src/**/*.spec.ts`; they are excluded from `tsc` builds.
- The repo currently has no committed unit tests; add new coverage around protocol clients and serialization.
- For quick configuration checks, run `pnpm tsx src/config/test.ts`.

## Commit & Pull Request Guidelines
- No `.git` history is present in this workspace, so no commit convention is detectable.
- If unsure, use Conventional Commits (e.g., `feat: add tcp timeout handling`).
- PRs should include a concise summary, test steps, and mention any hardware dependencies or config changes.

## Configuration & Security Notes
- The app loads `.env.local` first, then `.env`; keep local secrets out of version control.
- Update schemas in `src/config/schema.ts` when adding environment variables.
