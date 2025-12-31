# Hardware Controller System - Project Documentation

## Project Overview

- **Type:** Multi-Part Project with 3 parts
- **Primary Language:** Go (backend), TypeScript (frontend)
- **Architecture:** Client-Server (REST/WebSocket)
- **Status:** Frontend complete (100%), Backend early (5%)

---

## Quick Reference

### Part Summary

| Part | Type | Tech Stack | Root Path | Status |
|------|------|------------|-----------|--------|
| **Backend** | Backend API | Go 1.21 | `backend/` | 5% |
| **Frontend** | Web Dashboard | React 19, Vite, Tailwind | `frontend/` | 100% |
| **Reference** | Legacy Code | Node.js/TypeScript | `reference/` | Archived |

### Tech Stack Summary

| Category | Backend | Frontend |
|----------|---------|----------|
| **Language** | Go 1.21 | TypeScript 5.9 |
| **Framework** | Standard Library | React 19 |
| **Server** | net/http (planned) | Vite 5.2 |
| **Routing** | - | TanStack Router 1.31 |
| **State** | - | React Query 5.28 |
| **Styling** | - | Tailwind CSS 4.1 |
| **Entry Point** | `cmd/server/main.go` | `src/main.tsx` |

---

## Generated Documentation

### Core Documentation
- [Project Structure](./project-structure.md)
- [Technology Stack](./technology-stack.md)
- [Architecture Patterns](./architecture-patterns.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Comprehensive Analysis](./comprehensive-analysis.md)

### Architecture Documents
- [Architecture - Backend](./architecture-backend.md) _(Go backend architecture)_
- [Architecture - Frontend](./architecture-frontend.md) _(React frontend architecture)_
- [Integration Architecture](./integration-architecture.md) _(Part-to-part communication)_

### API & Components
- [API Contracts - Frontend](./api-contracts-frontend.md) _(All API endpoints)_
- [UI Component Inventory - Frontend](./ui-component-inventory-frontend.md) _(40+ components)_

### Development Guides
- [Development Guide](./development-guide.md) _(Setup, commands, workflow)_

### Supporting Documents
- [Existing Documentation Inventory](./existing-documentation-inventory.md) _(50+ docs in _bmad-output/)_

---

## Existing Documentation (Planning Artifacts)

The project has comprehensive planning documentation in `_bmad-output/`:

### Planning Documents
- [PRD](../_bmad-output/prd.md) - Product Requirements Document
- [Architecture](../_bmad-output/architecture.md) - System architecture
- [Architecture Decisions](../_bmad-output/architecture-decisions.md) - ADR records
- [Epics](../_bmad-output/epics.md) - Epic breakdown
- [User Stories](../_bmad-output/user-stories.md) - User story collection
- [UX Design](../_bmad-output/ux-design-specification.md) - UX specifications

### Implementation Documents
- [Implementation Stories](../_bmad-output/implementation/) - 20+ implementation stories
- [Tech Specs](../_bmad-output/implementation/) - Technical specifications
- [Project Context](../_bmad-output/project-context.md) - AI context file

---

## Getting Started

### Prerequisites
- Go 1.21+ (for backend)
- Node.js 20+ (for frontend)
- pnpm (recommended)

### Quick Start

**Frontend (Functional):**
```bash
cd frontend
pnpm install
pnpm dev
# Opens http://localhost:5173
```

**Backend (Not Implemented):**
```bash
cd backend
# Server implementation needed
# TODO: Implement HTTP server
```

### Development Workflow

1. **Frontend Development**
   - Fully implemented, ready for development
   - All components complete
   - Cannot function without backend

2. **Backend Development** (Priority)
   - Implement HTTP server
   - Implement API routes
   - Implement hardware communication layers

---

## Project Status

### Implementation Progress

| Component | Progress | Notes |
|-----------|----------|-------|
| Frontend | 100% | Complete, ready for integration |
| Backend | 5% | Only type definitions exist |
| Integration | 0% | Backend not functional |
| Hardware Layer | 0% | Not implemented |

### Migration Status

| Component | Original (Node.js) | New (Go) | Status |
|-----------|-------------------|----------|--------|
| Backend | Complete | 5% | In Progress |
| Frontend | Complete | Complete | Migrated |
| Shared Types | Complete | Pending | Blocked by Backend |
| Hardware Layer | Complete | Pending | To Do |
| API Layer | Complete | Pending | To Do |
| WebSocket | Complete | Pending | To Do |

---

## Key Areas

### Authentication
- JWT tokens stored in localStorage
- Bearer token in Authorization header
- 401 auto-redirect to `/login`

### Configuration Management
- Network configuration
- Hardware configuration
- Import/Export functionality
- Real-time validation

### System Features
- Core process status display
- Restart core functionality
- Serial port enumeration
- Network testing
- WebSocket integration (Socket.IO)

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │
│   (React)       │◄───────►│   (Go)          │
│  localhost:5173 │  REST   │ localhost:3000  │
├─────────────────┤  API    ├─────────────────┤
│ TanStack Router │         │ HTTP Server     │
│ React Query     │         │ WebSocket       │
│ Socket.IO       │◄───────►│ Hardware Manager│
└─────────────────┘  WS     └────────┬────────┘
                                     │
                                     │ Serial/TCP/UDP
                                     ▼
                            ┌─────────────────┐
                            │  Hardware Device│
                            │  (Controller)   │
                            └─────────────────┘
```

---

## Next Steps

### High Priority
1. **Implement Backend HTTP Server** - `backend/cmd/server/main.go`
2. **Implement API Routes** - All REST endpoints
3. **Implement Auth Middleware** - JWT validation
4. **Implement WebSocket Server** - Real-time updates

### Medium Priority
5. **Implement Transport Layer** - TCP/UDP clients
6. **Implement Hardware Layer** - Device communication
7. **Implement State Machine** - Application state management

### Integration
8. **Connect Frontend to Backend** - End-to-end testing
9. **Verify WebSocket Communication** - Real-time updates
10. **Hardware Integration Testing** - Full system test

---

## File Structure

```
hardware-controller/
├── backend/              # Go backend
│   ├── cmd/server/       # Entry point
│   ├── internal/         # Private code (empty)
│   └── pkg/types/        # Type definitions
├── frontend/             # React frontend
│   └── src/
│       ├── routes/       # File-based routing
│       ├── components/   # 40+ components
│       ├── services/     # API layer
│       └── hooks/        # 8 custom hooks
├── reference/            # Legacy Node.js
├── docs/                 # This documentation
└── _bmad-output/         # Planning artifacts
```

---

## Additional Resources

### Documentation
- This documentation serves as the **primary reference** for AI-assisted development
- Use `index.md` as the entry point for understanding the project structure

### For Brownfield PRD
When creating new features, reference:
- This `index.md` for current system state
- `architecture-backend.md` for backend architecture
- `architecture-frontend.md` for frontend architecture
- `integration-architecture.md` for part integration

### Planning Documents
See `_bmad-output/` for:
- Product requirements
- Architecture decisions
- Implementation stories
- User stories

---

*Generated: 2025-12-31*
*Scan Level: Exhaustive*
*Workflow: document-project v1.2.0*
