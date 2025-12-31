# Development Guide

## Prerequisites

### Backend (Go)
- Go 1.21 or higher
- (No additional dependencies yet - backend not implemented)

### Frontend (React)
- Node.js >= 20.0.0
- pnpm (recommended) or npm

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd hardware-controller
```

### 2. Frontend Setup

```bash
cd frontend
pnpm install
```

### 3. Backend Setup

```bash
cd backend
# No dependencies to install yet (go.mod is empty)
```

## Development Commands

### Frontend

```bash
cd frontend

# Start development server
pnpm dev          # Runs on http://localhost:5173

# Build for production
pnpm build        # Outputs to dist/

# Preview production build
pnpm preview

# Run tests
pnpm test         # Vitest UI
pnpm test:run     # CLI mode
pnpm test:ui      # Vitest UI mode

# Lint TypeScript
pnpm lint         # tsc --noEmit

# Clean build artifacts
pnpm clean        # Remove dist/
```

### Backend

```bash
cd backend

# Run server (when implemented)
go run cmd/server/main.go

# Build binary
go build -o bin/server cmd/server/main.go

# Run tests (when implemented)
go test ./...
```

### Reference (Legacy)

```bash
cd reference

# Install dependencies
pnpm install

# Run all packages
pnpm dev

# Build all packages
pnpm build

# Test all packages
pnpm test
```

## Project Structure

```
hardware-controller/
├── backend/          # Go backend (5% complete)
├── frontend/         # React frontend (100% complete)
├── reference/        # Legacy Node.js reference
├── docs/             # Generated documentation
└── _bmad-output/     # Planning artifacts
```

## Development Workflow

### Current State (2025-12-31)

**Frontend:** Fully implemented, ready for development
- All components complete
- API services defined
- Cannot function without backend

**Backend:** Early implementation stage
- Only type definitions exist
- Server implementation needed
- All API endpoints to be implemented

### Starting Development

1. **Frontend Development** (can work independently)
   ```bash
   cd frontend
   pnpm dev
   # Opens http://localhost:5173
   # Will show errors due to missing backend
   ```

2. **Backend Development** (priority)
   ```bash
   cd backend
   # Implement HTTP server in cmd/server/main.go
   # Implement API routes
   # Implement hardware communication
   ```

## Configuration

### Frontend Environment

Create `frontend/.env` (optional):
```
VITE_API_URL=/api
VITE_WS_URL=/socket.io
```

### Backend Environment

Create `backend/.env` (when implemented):
```
LISTEN_ADDR=:3000
DEBUG=false
```

## Testing

### Frontend Tests

```bash
cd frontend
pnpm test          # Watch mode
pnpm test:run      # Single run
```

**Test Coverage:**
- Component tests: `*.test.tsx`
- Utility tests: `*.test.ts`
- Setup: `src/test/setup.ts`

### Backend Tests

Not yet implemented.

## Common Development Tasks

### Add New API Endpoint

1. **Frontend:** Add service function in `src/services/`
   ```typescript
   export async function newEndpoint() {
     return apiFetch<ResponseType>('/api/new', { method: 'POST' });
   }
   ```

2. **Backend:** Add route handler (when backend is implemented)
   ```go
   http.HandleFunc("/api/new", handleNew)
   ```

### Add New Component

1. Create component file in `src/components/[category]/`
2. Add export to `index.ts` if needed
3. Import and use in routes or other components

### Add New Route

1. Create file in `src/routes/` following TanStack Router convention
   - `__root.tsx` - Root layout
   - `new-page.tsx` - `/new-page`
   - `folder.index.tsx` - `/folder`
   - `folder.$id.tsx` - `/folder/:id`

2. Run `pnpm dev` - routes auto-generate in `routeTree.gen.ts`

## Troubleshooting

### Frontend Issues

**Port already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Module resolution errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Backend Issues

Backend is not yet implemented.

## Build & Deployment

### Frontend Production Build

```bash
cd frontend
pnpm build
# Outputs to: dist/
```

**Build Features:**
- Terser minification
- Hash-based filenames
- Source maps disabled (production)
- Console.log removed

### Backend Production Build

```bash
cd backend
go build -ldflags="-s -w" -o bin/server cmd/server/main.go
```

## Additional Resources

- [TanStack Router Docs](https://tanstack.com/router/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
