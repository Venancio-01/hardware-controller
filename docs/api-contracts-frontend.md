# API Contracts - Frontend

## Overview

Frontend uses **Axios** HTTP client with JWT authentication for API communication. All API calls go through `/api` proxy to backend server (localhost:3000).

## API Client Configuration

### Base Client (`src/api/client.ts`)

```typescript
// Axios instance with base configuration
apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: Adds Bearer token from localStorage
// Response interceptor: Handles 401 by clearing token and redirecting to /login
```

## API Services

### Config API (`src/services/config-api.ts`)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/config/export` | GET | Export configuration as JSON file | Required |
| `/api/config/import` | POST | Import configuration from JSON | Required |

**Types:**
- `Config` - Shared configuration type from `shared` package

### System API (`src/services/system-api.ts`)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/status` | GET | Get system status | Required |
| `/api/restart` | POST | Restart core process | Required |

**Functions:**
- `getCoreStatus()` - Fetch core process status
- `restartCore()` - Trigger core process restart

### Network API (`src/services/network-api.ts`)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/network/ports` | GET | List available serial ports | Required |
| `/api/network/test` | POST | Test network connection | Required |
| `/api/network/apply` | POST | Apply network configuration | Required |

**Functions:**
- `getSerialPorts()` - Get available serial ports
- `testConnection(config)` - Test network connectivity
- `applyNetworkConfig(config)` - Apply network settings

## Authentication Flow

```
┌─────────────┐
│   Login     │
│   Page      │
└──────┬──────┘
       │ POST /api/login
       │ { username, password }
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ Returns { token }
       ▼
┌─────────────┐
│ localStorage│
│   .token    │
└──────┬──────┘
       │ Added to headers:
       │ Authorization: Bearer <token>
       ▼
┌─────────────┐
│ API Client  │
│ Interceptor │
└─────────────┘
```

## WebSocket Integration

**Socket.IO Client** is configured for real-time updates:
- Proxied through `/socket.io` → `localhost:3000`
- Used for live status updates and hardware events
- Enabled in Vite config with `ws: true`

## Error Handling

### ApiError (`src/lib/errors.ts`)

```typescript
class ApiError extends Error {
  statusCode: number;
  data?: any;
}
```

**401 Handling:**
- Clear token from localStorage
- Redirect to `/login`
- Clear user data

## API Request Patterns

### Standard API Call (using apiFetch)

```typescript
import { apiFetch } from '@/lib/api';

const response = await apiFetch<ApiResponse<DataType>>('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (!response.success) {
  throw new Error(response.error);
}
```

### File Download (export)

```typescript
const response = await fetch('/api/config/export', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const blob = await response.blob();
// Trigger browser download
```

## Route Protection

**Root Route (`src/routes/__root.tsx`)**

```typescript
beforeLoad: async ({ location }) => {
  const token = localStorage.getItem('token');
  if (!token && location.pathname !== '/login') {
    throw redirect({ to: '/login' });
  }
}
```

All routes except `/login` require authentication.

## Missing API Contracts (To Be Implemented)

The following endpoints are referenced but **not yet implemented** in the Go backend:

- `POST /api/login` - User authentication
- `GET /api/status` - System status
- `POST /api/restart` - Core restart
- `GET /api/network/ports` - Serial port listing
- `POST /api/network/test` - Network test
- `POST /api/network/apply` - Network config apply
- `GET /api/config/export` - Config export
- `POST /api/config/import` - Config import
- WebSocket endpoint for real-time updates
