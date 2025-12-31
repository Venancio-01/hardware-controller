# Technology Stack

## Backend (Go)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| **Language** | Go | 1.21 | High performance, low latency for hardware control |
| **Framework** | Standard Library | - | Minimal dependencies, using net/http for server |
| **Architecture** | Layered | - | cmd/, internal/, pkg/ structure (Go project layout) |
| **Entry Point** | cmd/server/main.go | - | Server binary entry point |

### Backend Modules
- `internal/config` - Configuration management
- `internal/hardware` - Hardware interface layer
- `internal/relay` - Relay control logic
- `internal/state` - State management
- `internal/transport` - Transport layer (TCP/UDP)
- `internal/voice` - Voice broadcast functionality
- `pkg/types` - Shared types
- `pkg/utils` - Utilities

**Status:** Early implementation (main.go has TODO)

## Frontend (React)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| **Language** | TypeScript | 5.9.3 | Type safety, better developer experience |
| **Framework** | React | 19.0 | Latest stable with improved features |
| **Build Tool** | Vite | 5.2.0 | Fast dev server, optimized builds |
| **Router** | TanStack Router | 1.31.15 | File-based routing, type-safe routing |
| **UI Library** | Radix UI | - | Headless, accessible components |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS, rapid UI development |
| **State** | React Query | 5.28.9 | Server state management, caching |
| **Forms** | React Hook Form | 7.69.0 | Performant form handling |
| **Validation** | Zod | 4.2.1 | TypeScript-first schema validation |
| **HTTP Client** | Axios | 1.13.2 | Promise-based HTTP client |
| **Real-time** | Socket.IO Client | 4.8.3 | WebSocket for live updates |
| **Icons** | Lucide React, Tabler Icons | - | Consistent icon sets |
| **Testing** | Vitest, Testing Library | 4.0.16 | Unit testing framework |

### Frontend Structure
```
src/
├── api/          # API client layer
├── components/   # React components
│   ├── auth/     # Authentication components
│   ├── config/   # Configuration forms
│   ├── dashboard/# Dashboard components
│   ├── layout/   # Layout components
│   ├── system/   # System status components
│   └── ui/       # Reusable UI components (Radix)
├── contexts/     # React contexts
├── hooks/        # Custom hooks
├── lib/          # Utilities (api, logger, formatters)
├── routes/       # File-based routes
└── services/     # Business logic services
```

**Architecture Pattern:** Component-based with client-side routing
**State Management:** React Query for server state, React Context for global state

## Reference (Legacy Node.js)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| **Language** | TypeScript | 5.9.3 | Original implementation |
| **Runtime** | Node.js | >=20.0.0 | Original backend runtime |
| **Build Tool** | tsup | 8.5.1 | TypeScript bundler |
| **Testing** | Vitest | 4.0.16 | Testing framework |
| **Package Manager** | pnpm | - | Monorepo workspace |

**Purpose:** Reference implementation for Go rewrite migration

## Architecture Patterns Summary

| Part | Pattern | Description |
|------|---------|-------------|
| **Backend** | Standard Go Layout | Clean architecture with cmd/internal/pkg separation |
| **Frontend** | Component-Based | React 19 with file-based routing (TanStack Router) |
| **Integration** | REST/WebSocket | API proxy to localhost:3000, Socket.IO for real-time |
