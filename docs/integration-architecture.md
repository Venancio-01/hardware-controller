# Integration Architecture

## Overview

The hardware controller system consists of **three parts** that communicate via REST API and WebSocket:

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │
│   (React)       │         │   (Go)          │
│  localhost:5173 │◄───────►│ localhost:3000  │
├─────────────────┤  REST   ├─────────────────┤
│ TanStack Router │  API    │ HTTP Server     │
│ React Query     │         │ WebSocket       │
│ Socket.IO       │◄───────►│ Hardware Manager│
│ Client          │  WS     │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ Serial/TCP/UDP
                                     ▼
                            ┌─────────────────┐
                            │  Hardware Device│
                            │  (Controller)   │
                            └─────────────────┘
```

## Part-to-Part Communication

### Frontend → Backend

| Type | Protocol | Endpoint(s) | Purpose |
|------|----------|-------------|---------|
| REST | HTTP | `/api/*` | Configuration, control, status |
| WebSocket | Socket.IO | `/socket.io` | Real-time updates |
| Static Assets | HTTP | `/` | Frontend files (production) |

### Backend → Hardware

| Type | Protocol | Purpose |
|------|----------|---------|
| Serial | RS-232/USB | Direct hardware control |
| TCP | TCP/IP | Networked hardware |
| UDP | UDP/IP | Broadcast commands |

## Integration Points

### 1. Authentication Flow

```
┌──────────────┐
│ Frontend     │
│ login.tsx    │
└──────┬───────┘
       │ POST /api/login
       │ { username, password }
       ▼
┌──────────────┐
│ Backend      │
│ (Go)         │
└──────┬───────┘
       │ { token, user }
       ▼
┌──────────────┐
│ Frontend     │
│ localStorage │
│ .token       │
└──────────────┘
```

### 2. Configuration Update Flow

```
┌──────────────┐
│ Frontend     │
│ Config Form  │
└──────┬───────┘
       │ POST /api/config/update
       │ { config }
       ▼
┌──────────────┐
│ Backend      │
│ Validate     │
└──────┬───────┘
       │ Save to config.json5
       │
       ▼
┌──────────────┐
│ Backend      │
│ Apply Config │
└──────┬───────┘
       │ Send to Hardware
       ▼
┌──────────────┐
│ Hardware     │
│ Update       │
└──────────────┘
```

### 3. Real-time Status Updates

```
┌──────────────┐
│ Hardware     │
│ State Change │
└──────┬───────┘
       │ Event
       ▼
┌──────────────┐
│ Backend      │
│ State Machine│
└──────┬───────┘
       │ Emit 'status-update'
       ▼
┌──────────────┐
│ WebSocket    │
│ Server       │
└──────┬───────┘
       │ Broadcast
       ▼
┌──────────────┐
│ Frontend     │
│ Socket.IO    │
│ Client       │
└──────┬───────┘
       │ Update React Query Cache
       ▼
┌──────────────┐
│ UI Re-render │
└──────────────┘
```

## API Contract

### Authentication Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/login` | POST | `{ username, password }` | `{ token, user }` |

### Configuration Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/config` | GET | - | `{ config }` |
| `/api/config/update` | POST | `{ config }` | `{ success }` |
| `/api/config/export` | GET | - | File download |
| `/api/config/import` | POST | `{ config }` | `{ config }` |

### System Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/status` | GET | - | `{ status }` |
| `/api/restart` | POST | `{ force? }` | `{ success }` |

### Network Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/network/ports` | GET | - | `{ ports[] }` |
| `/api/network/test` | POST | `{ config }` | `{ success, latency }` |
| `/api/network/apply` | POST | `{ config }` | `{ success }` |

### WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `connect` | Client → Server | - |
| `disconnect` | Client → Server | - |
| `status-update` | Server → Client | `{ status }` |
| `hardware-event` | Server → Client | `{ event, data }` |
| `config-changed` | Server → Client | `{ config }` |

## Data Formats

### Configuration Object

```typescript
interface Config {
  network: NetworkConfig;
  hardware: HardwareConfig;
  ammoCabinet: AmmoCabinetConfig;
  controlCabinet: ControlCabinetConfig;
}
```

### Status Object

```typescript
interface Status {
  state: 'idle' | 'running' | 'error' | 'shutting';
  coreProcess: 'running' | 'stopped' | 'crashed';
  hardwareConnected: boolean;
  lastUpdate: number;
}
```

## Error Handling

### Error Response Format

```typescript
interface ApiError {
  error: string;
  statusCode: number;
  details?: any;
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (config validation) |
| 500 | Server Error |

## Development Proxy Configuration

```typescript
// frontend/vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true,
  },
}
```

## Production Deployment

```
┌─────────────────────────────────────┐
│         Nginx / Reverse Proxy       │
├─────────────────────────────────────┤
│  /          → Frontend (static)     │
│  /api/*     → Backend (Go server)   │
│  /socket.io → Backend (WebSocket)   │
└─────────────────────────────────────┘
```

## Implementation Status

| Integration Point | Frontend | Backend | Status |
|-------------------|----------|---------|--------|
| Authentication | ✅ | ❌ | Blocked |
| REST API | ✅ | ❌ | Blocked |
| WebSocket | ✅ | ❌ | Blocked |
| Hardware Comm | - | ❌ | Blocked |

## Next Steps for Integration

1. **Implement Backend HTTP Server**
   - Set up net/http server
   - Implement all REST endpoints
   - Add authentication middleware

2. **Implement WebSocket Server**
   - Integrate Socket.IO Go library
   - Set up event broadcasting
   - Handle client connections

3. **Implement Hardware Layer**
   - Serial communication
   - TCP/UDP clients
   - State machine integration

4. **End-to-End Testing**
   - Test all API endpoints
   - Verify WebSocket communication
   - Test hardware integration
