# Source Tree Analysis

## Project Root Structure

```
hardware-controller/
├── backend/              # Go backend (Part: backend) - 5% complete
│   ├── cmd/             # Entry points
│   │   └── server/      # Server binary entry point
│   │       └── main.go  # 🚀 ENTRY POINT - TODO: implement server
│   ├── internal/        # Private application code
│   │   ├── config/      # Configuration management (empty)
│   │   ├── hardware/    # Hardware interface layer (empty)
│   │   ├── relay/       # Relay control logic (empty)
│   │   ├── state/       # State management (empty)
│   │   ├── transport/   # Transport layer (empty)
│   │   └── voice/       # Voice broadcast (empty)
│   ├── pkg/             # Public library code
│   │   ├── types/       # Shared type definitions
│   │   │   └── types.go # Core types: State, DeviceStatus, Config
│   │   └── utils/       # Utilities (empty)
│   ├── go.mod           # Go module definition
│   └── README.md        # Backend documentation
│
├── frontend/            # React frontend (Part: frontend) - 100% complete
│   ├── src/            # Source code
│   │   ├── api/        # API client layer
│   │   │   └── client.ts       # Axios instance with auth interceptors
│   │   ├── components/ # React components
│   │   │   ├── ui/     # Base UI components (Radix)
│   │   │   │   ├── alert.tsx, alert-dialog.tsx
│   │   │   │   ├── badge.tsx, button.tsx, card.tsx
│   │   │   │   ├── dialog.tsx, dropdown-menu.tsx
│   │   │   │   ├── input.tsx, textarea.tsx, select.tsx
│   │   │   │   ├── label.tsx, form.tsx, combobox.tsx
│   │   │   │   ├── tooltip.tsx, popover.tsx, separator.tsx
│   │   │   │   ├── skeleton.tsx, sonner.tsx, command.tsx
│   │   │   │   └── [17 base UI components]
│   │   │   ├── auth/   # Authentication components
│   │   │   │   └── LoginStatusPanel.tsx
│   │   │   ├── config/ # Configuration forms
│   │   │   │   ├── NetworkConfigForm.tsx
│   │   │   │   ├── HardwareConfigForm.tsx
│   │   │   │   ├── AmmoCabinetConfigForm.tsx
│   │   │   │   └── ControlCabinetConfigForm.tsx
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   │   ├── ConfigForm.tsx
│   │   │   │   └── AppConfigCard.tsx
│   │   │   ├── layout/  # Layout components
│   │   │   │   ├── HeaderActions.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── system/  # System components
│   │   │       ├── CoreStatusBadge.tsx
│   │   │       └── RestartCoreButton.tsx
│   │   ├── contexts/  # React Context
│   │   │   └── auth.context.tsx  # Auth state management
│   │   ├── hooks/     # Custom React hooks
│   │   │   ├── useCheckConflict.ts
│   │   │   ├── use-serial-ports.ts
│   │   │   ├── useRestartSystem.ts
│   │   │   ├── useImportExportConfig.ts
│   │   │   ├── useCoreStatus.ts
│   │   │   ├── useApplyNetwork.ts
│   │   │   ├── useUpdateConfig.ts
│   │   │   └── useAutoReconnect.ts
│   │   ├── lib/       # Utilities
│   │   │   ├── api.ts          # apiFetch wrapper
│   │   │   ├── logger.ts       # Logging utility
│   │   │   ├── errors.ts       # ApiError class
│   │   │   ├── formatters.ts   # Data formatters
│   │   │   └── utils.ts        # cn() helper
│   │   ├── routes/    # File-based routing (TanStack Router)
│   │   │   ├── __root.tsx      # 🚀 ROOT ROUTE - Auth check, layout
│   │   │   ├── _auth.tsx       # Auth layout wrapper
│   │   │   ├── _auth.index.tsx # Dashboard page
│   │   │   └── login.tsx       # Login page
│   │   ├── services/  # API service layer
│   │   │   ├── config-api.ts   # Config import/export
│   │   │   ├── system-api.ts   # Status, restart
│   │   │   └── network-api.ts  # Network operations
│   │   ├── main.tsx    # 🚀 ENTRY POINT - React app bootstrap
│   │   └── routeTree.gen.ts    # Generated routes
│   ├── index.html      # HTML template
│   ├── package.json    # Dependencies & scripts
│   ├── vite.config.ts  # Vite configuration
│   ├── vitest.config.ts # Test configuration
│   └── README.md       # Frontend documentation
│
├── reference/          # Legacy Node.js reference (Part: reference)
│   ├── packages/       # Monorepo workspace
│   │   ├── backend/    # Original backend implementation
│   │   ├── core/       # Core logic (state machines, hardware)
│   │   ├── frontend/   # Original frontend (replaced by new frontend/)
│   │   └── shared/     # Shared types and schemas
│   ├── config/         # Build configurations
│   ├── scripts/        # Build scripts
│   └── package.json    # Monorepo root
│
├── docs/               # Generated documentation (this folder)
│   ├── project-structure.md
│   ├── technology-stack.md
│   └── [other docs]
│
├── _bmad-output/       # BMAD workflow artifacts
│   ├── prd.md          # Product Requirements Document
│   ├── architecture.md # System architecture
│   ├── epics.md        # Epic breakdown
│   ├── implementation/ # Implementation stories
│   └── planning/       # Planning documents
│
├── .git/               # Git repository
├── .gitignore          # Git ignore rules
├── README.md           # Project overview
└── config.json5        # Configuration file
```

## Critical Folders Summary

### Backend Critical Paths

| Path | Purpose | Status |
|------|---------|--------|
| `cmd/server/` | Application entry point | 🟡 TODO |
| `internal/config/` | Configuration management | 🔴 Empty |
| `internal/hardware/` | Hardware interface | 🔴 Empty |
| `internal/relay/` | Business logic | 🔴 Empty |
| `internal/state/` | State management | 🔴 Empty |
| `internal/transport/` | TCP/UDP communication | 🔴 Empty |
| `pkg/types/` | Type definitions | ✅ Complete |

### Frontend Critical Paths

| Path | Purpose | Status |
|------|---------|--------|
| `src/routes/` | File-based routing | ✅ Complete |
| `src/components/ui/` | Base components | ✅ Complete (17) |
| `src/components/config/` | Config forms | ✅ Complete |
| `src/services/` | API layer | ✅ Complete |
| `src/hooks/` | Custom hooks | ✅ Complete (8) |
| `src/contexts/` | Global state | ✅ Complete |

## Entry Points

| Part | File | Description |
|------|------|-------------|
| **Backend** | `backend/cmd/server/main.go` | Server binary (TODO) |
| **Frontend** | `frontend/src/main.tsx` | React app mount |
| **Frontend** | `frontend/src/routes/__root.tsx` | Root route, auth check |

## Integration Points

```
Frontend (localhost:5173)
    │
    ├─► /api/* ──────┐
    │                │
    └─► /socket.io ───┤
                       │
                       ▼
              Backend (localhost:3000)
              ❌ NOT IMPLEMENTED
```

**Vite Proxy Configuration:**
```typescript
// frontend/vite.config.ts
proxy: {
  '/api': 'http://localhost:3000',
  '/socket.io': { target: 'http://localhost:3000', ws: true }
}
```

## Multi-Part Organization

The project is organized as **separate parts** that communicate via REST/WebSocket:

| Part | Technology | Purpose | Status |
|------|------------|---------|--------|
| `backend/` | Go | Hardware control, API server | 5% |
| `frontend/` | React | Web UI dashboard | 100% |
| `reference/` | Node.js | Reference implementation | Archived |

## Development Workflow

```
┌─────────────────────────────────────────┐
│           Development                   │
├─────────────────────────────────────────┤
│                                         │
│  1. Backend: cd backend && go run ...  │
│     ❌ Not yet functional              │
│                                         │
│  2. Frontend: cd frontend && npm run dev│
│     ✅ Runs on localhost:5173          │
│     ⚠️  API calls fail (no backend)    │
│                                         │
└─────────────────────────────────────────┘
```

## File Count Summary

| Part | Go Files | TS/TSX Files | Config Files | Total |
|------|----------|--------------|---------------|-------|
| Backend | 2 | 0 | 1 (go.mod) | 3 |
| Frontend | 0 | 48 | 5 | 53 |
| Reference | 0 | 100+ | 10+ | 110+ |
| **Total** | **2** | **150+** | **16+** | **170+** |

## Missing Implementations

### Backend (To Implement)
- [ ] HTTP server setup
- [ ] API route handlers
- [ ] Authentication middleware
- [ ] WebSocket server
- [ ] Hardware communication layers
- [ ] State machine implementation
- [ ] Configuration management

### Shared (To Create)
- [ ] Go-compatible type definitions
- [ ] Protocol buffer schemas (optional)
