# Architecture - Frontend (React)

## Executive Summary

A modern React 19 dashboard for the hardware controller system. Uses **file-based routing**, **type-safe API calls**, and **component-driven architecture**. Currently **100% implemented** and ready for backend integration.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Language** | TypeScript | 5.9.3 |
| **Framework** | React | 19.0 |
| **Build Tool** | Vite | 5.2.0 |
| **Router** | TanStack Router | 1.31.15 |
| **State Management** | React Query + Context | 5.28.9 |
| **Forms** | React Hook Form | 7.69.0 |
| **Validation** | Zod | 4.2.1 |
| **Styling** | Tailwind CSS | 4.1.17 |
| **UI Components** | Radix UI | - |
| **HTTP Client** | Axios | 1.13.2 |
| **Real-time** | Socket.IO Client | 4.8.3 |

## Architecture Pattern

### Component-Based with File-Based Routing

```
src/
├── routes/          # File-based routing (TanStack Router)
│   ├── __root.tsx   # Root layout with auth check
│   ├── _auth.tsx    # Auth layout wrapper
│   ├── _auth.index.tsx  # Dashboard page
│   └── login.tsx    # Login page
├── components/      # React components
│   ├── ui/          # Base components (Radix UI)
│   ├── auth/        # Authentication components
│   ├── config/      # Configuration forms
│   ├── dashboard/   # Dashboard features
│   ├── layout/      # Layout components
│   └── system/      # System status components
├── hooks/           # Custom React hooks
├── services/        # API service layer
├── contexts/        # React Context (global state)
├── api/             # API client configuration
└── lib/             # Utilities
```

## Routing Architecture

### File-Based Routing (TanStack Router)

| Route | File | Layout | Protected |
|-------|------|--------|-----------|
| `/` | `_auth.index.tsx` | Auth Layout | ✅ |
| `/login` | `login.tsx` | None | ❌ |
| `/*` | `__root.tsx` | Root Layout | ✅ |

**Route Protection:**
```typescript
// __root.tsx
beforeLoad: async ({ location }) => {
  const token = localStorage.getItem('token');
  if (!token && location.pathname !== '/login') {
    throw redirect({ to: '/login' });
  }
}
```

### Layout Hierarchy

```
┌─────────────────────────────────────────┐
│  __root.tsx (Root Layout)               │
│  ┌─────────────────────────────────────┐│
│  │  _auth.tsx (Auth Layout)           ││
│  │  ┌───────────────────────────────┐ ││
│  │  │  _auth.index.tsx (Dashboard)  │ ││
│  │  └───────────────────────────────┘ ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

Alternative (Login):
┌─────────────────────────────────────────┐
│  __root.tsx (Root Layout)               │
│  ┌─────────────────────────────────────┐│
│  │  login.tsx (Login Page)             ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Component Architecture

### Atomic Design Pattern

```
components/
├── ui/              # ATOMS - Base components
├── auth/            # MOLECULES - Feature auth
├── config/          # ORGANISMS - Config forms
├── dashboard/       # TEMPLATES - Dashboard
├── layout/          # STRUCTURE - Layout
└── system/          # FEATURES - System features
```

### Component Communication

```
┌─────────────────┐
│   Routes        │
│   (Pages)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature Components│
│ (dashboard,    │
│  config, etc.)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   UI Components │
│   (ui/*)        │
└─────────────────┘
```

## State Management

### 1. Server State (React Query)

```typescript
// Services layer
src/services/
├── config-api.ts    # Config operations
├── system-api.ts    # System operations
└── network-api.ts   # Network operations
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

### 2. Global State (React Context)

```typescript
// Auth Context
src/contexts/auth.context.tsx

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials) => Promise<void>;
  logout: () => void;
}
```

### 3. Local Form State (React Hook Form)

```typescript
// Form components use React Hook Form
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('fieldName')} />
</form>
```

## Data Flow Architecture

```
┌──────────────┐
│   User Input │
│  (Form/Click)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Custom Hook  │
│ (use*)        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │
│  (API call)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Client  │
│  (Axios)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Backend    │
│  (Go Server) │
└──────────────┘
       │
       ▼ (Response)
┌──────────────┐
│ React Query  │
│  (Cache)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   UI Update  │
│  (Re-render) │
└──────────────┘
```

## API Communication

### Axios Client Configuration

```typescript
// src/api/client.ts
apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token, redirect to login
    }
    return Promise.reject(error);
  }
);
```

### Error Handling

```typescript
// src/lib/errors.ts
class ApiError extends Error {
  statusCode: number;
  data?: any;
}

try {
  await apiFetch('/api/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API error
  }
}
```

## WebSocket Integration

```typescript
// Socket.IO Client (configured in Vite proxy)
import { io } from 'socket.io-client';

const socket = io('/socket.io', {
  autoConnect: false
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('status-update', (data) => {
  // Update React Query cache
  queryClient.setQueryData(['status'], data);
});
```

## Styling Architecture

### Tailwind CSS + Radix UI

```
┌─────────────────────────────────────┐
│         Component                   │
│  ┌───────────────────────────────┐  │
│  │  className="flex items-center  │  │
│  │    gap-2 p-4 rounded-lg       │  │
│  │    bg-white shadow-md"        │  │
│  │                               │  │
│  │  <RadixComponent>             │  │
│  │    {children}                 │  │
│  │  </RadixComponent>            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Theme Support

- Light/Dark mode (next-themes)
- CSS variables for colors
- Tailwind utilities for spacing/layout

## Type Safety

### Shared Types

```typescript
// From: shared/src/schemas/
import { Config, NetworkConfig, HardwareConfig } from 'shared';

// Used throughout:
- API services
- Component props
- Form validation (Zod schemas)
```

## Testing Architecture

### Test Structure

```
src/
├── components/
│   └── **/
│       └── __tests__/
│           └── *.test.tsx
├── lib/
│   └── __tests__/
│       └── *.test.ts
└── test/
    └── setup.ts
```

### Testing Stack

- **Framework:** Vitest
- **Library:** Testing Library
- **Mocks:** Vitest mocks

## Performance Optimizations

### Build Optimizations

```typescript
// vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      pure_funcs: ['console.log']
    }
  },
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[hash].js',  // Hashed filenames
      chunkFileNames: 'assets/[hash].js',   // Code splitting
    }
  }
}
```

### Runtime Optimizations

- React.memo for expensive components
- React Query caching
- Code splitting by route
- Lazy loading for large components

## Security Considerations

### Authentication
- JWT tokens in localStorage (XSS risk)
- Bearer token in Authorization header
- 401 auto-redirect

### Recommendations
1. Use httpOnly cookies for tokens
2. Add CSRF protection
3. Implement content security policy
4. Sanitize user input (Zod validation)

## Deployment Architecture

```
Development:
┌─────────────────────────────────┐
│  Vite Dev Server                │
│  localhost:5173                 │
│  ┌────────────────────────────┐ │
│  │  Proxy /api → localhost:3000│
│  │  Proxy /socket.io → :3000   │
│  └────────────────────────────┘ │
└─────────────────────────────────┘

Production:
┌─────────────────────────────────┐
│  Static Files (dist/)           │
│  ┌────────────────────────────┐ │
│  │  index.html                │ │
│  │  assets/[hash].js          │ │
│  │  assets/[hash].css         │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
         │
         │ (Served by)
         ▼
┌─────────────────────────────────┐
│  Nginx / CDN / Static Server    │
└─────────────────────────────────┘
```

## Implementation Status

| Feature | Status |
|---------|--------|
| Routing | ✅ Complete |
| Components | ✅ Complete (40+) |
| API Services | ✅ Complete |
| Authentication UI | ✅ Complete |
| Forms | ✅ Complete |
| State Management | ✅ Complete |
| WebSocket Client | ✅ Configured |
| Testing | ✅ Partial |
| Documentation | ✅ Complete |

## Integration Readiness

**Frontend is 100% complete** and ready for backend integration.

**Required from Backend:**
- REST API endpoints
- WebSocket server
- Authentication endpoint
- Real-time status updates
