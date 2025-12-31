# Architecture - Backend (Go)

## Executive Summary

The Go backend is a **hardware control server** for managing feeding system hardware (relays, voice broadcasts, state machines). Currently at **5% implementation** - only type definitions exist.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Language** | Go | 1.21 |
| **Standard Library** | net/http, log | - |
| **Architecture** | Standard Go Layout | cmd/internal/pkg |

## Architecture Pattern

### Standard Go Project Layout

```
backend/
├── cmd/              # Entry points
│   └── server/       # Server application
│       └── main.go   # Bootstrap server
├── internal/         # Private code (cannot be imported externally)
│   ├── config/       # Configuration management
│   ├── hardware/     # Hardware interface layer
│   ├── relay/        # Relay control domain logic
│   ├── state/        # State machine management
│   ├── transport/    # Transport layer (TCP/UDP)
│   └── voice/        # Voice broadcast functionality
└── pkg/              # Public library code (can be imported externally)
    ├── types/        # Shared type definitions
    └── utils/        # Shared utilities
```

**Design Principles:**
- **cmd/**: Application entry points only
- **internal/**: Private application code (import protection)
- **pkg/**: Reusable libraries (can be imported by other projects)

## Core Types

### State Machine States

```go
type State string

const (
    StateIdle     State = "idle"      // Not initialized
    StateInit     State = "init"      // Initializing
    StateReady    State = "ready"     // Ready for operation
    StateRunning  State = "running"   // Operating
    StateError    State = "error"     // Error state
    StateShutting State = "shutting"  # Shutting down
    StateShutdown State = "shutdown"  // Fully shut down
)
```

### Device Status

```go
type DeviceStatus struct {
    ID       string `json:"id"`
    Type     string `json:"type"`
    State    State  `json:"state"`
    Online   bool   `json:"online"`
    LastSeen int64  `json:"last_seen"`
}
```

### Configuration

```go
type Config struct {
    ListenAddr string `json:"listen_addr"`
    Debug      bool   `json:"debug"`
}
```

## Planned Module Architecture

### 1. Transport Layer (`internal/transport/`)

**Purpose:** Communication with hardware devices

**Responsibilities:**
- TCP client communication
- UDP client communication
- Connection management
- Message serialization/deserialization

**Interfaces (To Be Implemented):**
```go
type TransportClient interface {
    Connect(addr string) error
    Send(data []byte) error
    Receive() ([]byte, error)
    Close() error
}
```

### 2. Hardware Layer (`internal/hardware/`)

**Purpose:** Hardware abstraction layer

**Responsibilities:**
- Serial communication
- Device discovery
- Hardware protocol handling

### 3. Relay Layer (`internal/relay/`)

**Purpose:** Business logic for relay control

**Responsibilities:**
- Relay state management
- Control operations
- Safety checks

### 4. State Machine (`internal/state/`)

**Purpose:** Application state management

**Responsibilities:**
- State transitions
- Event handling
- State persistence

### 5. Voice Layer (`internal/voice/`)

**Purpose:** Voice broadcast functionality

**Responsibilities:**
- Audio playback control
- Broadcast scheduling
- Voice queue management

### 6. Config Layer (`internal/config/`)

**Purpose:** Configuration management

**Responsibilities:**
- Load/save configuration
- Hot-reload configuration
- Validation

## API Architecture (To Be Implemented)

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | User authentication |
| `/api/status` | GET | System status |
| `/api/restart` | POST | Restart core process |
| `/api/config/export` | GET | Export configuration |
| `/api/config/import` | POST | Import configuration |
| `/api/network/ports` | GET | List serial ports |
| `/api/network/test` | POST | Test network |
| `/api/network/apply` | POST | Apply network config |

### WebSocket Endpoint

| Endpoint | Purpose |
|----------|---------|
| `/socket.io` | Real-time status updates |

## Server Lifecycle

```
┌──────────────┐
│   Start      │
│  main.go     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Load Config  │
│ (internal/   │
│  config/)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Init State   │
│ (internal/   │
│  state/)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Start HTTP   │
│ Server       │
│ (net/http)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Listen for   │
│ Requests     │
└──────────────┘
```

## Error Handling Strategy

```go
// Use idiomatic Go error handling
func handleRequest(w http.ResponseWriter, r *http.Request) {
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}
```

## Concurrency Model

**Go routines** for:
- Hardware communication (non-blocking I/O)
- WebSocket connections
- State machine events
- Voice playback

**Channels** for:
- Event passing
- State synchronization
- Shutdown signals

## Security Considerations

### Authentication
- JWT tokens (from frontend)
- Middleware for protected routes

### Authorization
- Role-based access control (to be defined)

### Input Validation
- Validate all API inputs
- Sanitize configuration data

## Deployment Architecture

```
┌─────────────────────────────────────┐
│         Hardware Device             │
│    (Serial/TCP/UDP Connection)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Go Backend Server              │
│      localhost:3000                 │
│  ┌───────────────────────────────┐  │
│  │  HTTP Server (net/http)      │  │
│  │  - REST API                  │  │
│  │  - WebSocket Server          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Hardware Manager            │  │
│  │  - Transport Layer           │  │
│  │  - State Machine             │  │
│  │  - Relay Control             │  │
│  └───────────────────────────────┘  │
└───────────────┬─────────────────────┘
                │
                │ HTTP/WebSocket
                ▼
┌─────────────────────────────────────┐
│      Frontend (Vite Dev Server)     │
│      localhost:5173                 │
│  ┌───────────────────────────────┐  │
│  │  React Application            │  │
│  │  - TanStack Router            │  │
│  │  - React Query                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Implementation Status

| Module | Status | Priority |
|--------|--------|----------|
| HTTP Server | ❌ Not Started | Critical |
| API Routes | ❌ Not Started | Critical |
| Auth Middleware | ❌ Not Started | Critical |
| WebSocket Server | ❌ Not Started | Critical |
| Transport Layer | ❌ Not Started | High |
| Hardware Layer | ❌ Not Started | High |
| State Machine | ❌ Not Started | High |
| Relay Control | ❌ Not Started | Medium |
| Voice Broadcast | ❌ Not Started | Medium |
| Config Management | ❌ Not Started | Medium |

## Next Steps

1. **Implement HTTP Server** - `cmd/server/main.go`
2. **Add API Routes** - Basic REST endpoints
3. **Implement Auth Middleware** - JWT validation
4. **Add WebSocket Support** - Real-time updates
5. **Implement Transport Layer** - TCP/UDP clients
6. **Implement Hardware Layer** - Device communication
7. **Add State Machine** - Application state management
