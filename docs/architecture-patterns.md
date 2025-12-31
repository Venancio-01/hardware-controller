# Architecture Patterns

## Overview

This hardware controller system uses a **Client-Server** architecture with a **Layered Component** pattern on both frontend and backend.

## Backend Architecture Pattern

### Standard Go Project Layout (Layered)

```
backend/
├── cmd/server/       # Application entry points
├── internal/         # Private application code
│   ├── config/       # Configuration layer
│   ├── hardware/     # Hardware interface layer
│   ├── relay/        # Domain logic (relay control)
│   ├── state/        # State management
│   ├── transport/    # Transport layer (TCP/UDP)
│   └── voice/        # Voice broadcast domain
└── pkg/              # Public library code
    ├── types/        # Shared type definitions
    └── utils/        # Shared utilities
```

**Pattern Characteristics:**
- **Separation of Concerns:** clear boundaries between transport, business logic, and hardware layers
- **Dependency Direction:** cmd → internal → pkg
- **Encapsulation:** internal/ packages cannot be imported by external projects

## Frontend Architecture Pattern

### Component-Based with File-Based Routing

```
frontend/
├── src/
│   ├── routes/              # File-based routing (TanStack Router)
│   │   ├── __root.tsx       # Root layout
│   │   ├── _auth.tsx        # Auth layout
│   │   ├── index.tsx        # Home route
│   │   └── login.tsx        # Login route
│   ├── components/          # Reusable components
│   │   ├── ui/              # Base UI components (Radix)
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard features
│   │   ├── config/          # Configuration forms
│   │   ├── system/          # System status components
│   │   └── auth/            # Authentication components
│   ├── api/                 # API client layer
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React Context (global state)
│   ├── services/            # Business logic
│   └── lib/                 # Utilities
```

**Pattern Characteristics:**
- **File-Based Routing:** TanStack Router generates routes from file structure
- **Component Hierarchy:** Atomic design with ui/ as base, feature components above
- **State Management:** React Query (server state) + React Context (global state)
- **Data Flow:** Unidirectional (React hooks → API client → server)

## Integration Architecture

### Client-Server Communication

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │
│   (React)       │         │   (Go)          │
├─────────────────┤         ├─────────────────┤
│ TanStack Router │◄───────►│ HTTP Server     │
│                 │  REST   │ (net/http)      │
│ React Query    │         │                 │
│ Socket.IO      │◄───────►│ WebSocket       │
│ Client         │  WS     │                 │
└─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         └─────── Vite Proxy ────────┘
           (localhost:5173 → 3000)
```

**Integration Points:**
- **REST API:** Configuration, status, control operations
- **WebSocket:** Real-time status updates, hardware events
- **Development Proxy:** Vite proxies /api and /socket.io to backend

## Hardware Integration Pattern

### Hardware Abstraction Layer

```
┌─────────────────────────────────────┐
│         Hardware Controller          │
├─────────────────────────────────────┤
│  internal/hardware/                 │
│  ├── Serial Communication           │
│  ├── Relay Control                  │
│  ├── Voice Broadcast                │
│  └── State Machine                  │
├─────────────────────────────────────┤
│  internal/transport/                │
│  ├── TCP Client                     │
│  └── UDP Client                     │
└─────────────────────────────────────┘
         │
         │ Serial/TCP/UDP
         ▼
┌─────────────────┐
│  Hardware Device│
│  (Controller)   │
└─────────────────┘
```

**Hardware Flow:**
1. **Transport Layer:** TCP/UDP communication with hardware
2. **Hardware Layer:** Device-specific protocol handling
3. **State Machine:** Relay state, ammo workflow, alarm management
4. **API Layer:** Exposes hardware state to frontend
