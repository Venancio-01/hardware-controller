# Development Guide - Root Part

## Prerequisites
- **Runtime**: Node.js (>=22.0.0) or Bun (Latest)
- **Language**: TypeScript (v5.9.3)

## Installation

```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

## Environment Setup
Configuration is loaded from `.env`. See `.env.example` for details.

## Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with file watching (`tsx watch src/index.ts`) |
| `npm run build` | Build for production using `tsup` (Output: `dist/`) |
| `npm start` | Run the built production application |
| `npm test` | Run unit tests via `vitest` |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Clean distribution folder (`rm -rf dist`) |

## Testing
The project uses **Vitest** for testing.
- Test files should be named `*.test.ts`.
- Tests are located in `test/` directory or collocated with source.

## Deployment
- **Build**: Run `npm run build` to generate ES Module output.
- **Run**: Execute `node -r dotenv/config dist/index.js` or use a process manager like PM2.
