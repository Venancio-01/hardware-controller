---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - prd.md
  - project-planning-artifacts/ux-design-specification.md
  - project-context.md
workflowType: 'architecture'
project_name: 'node-switch'
user_name: '青山'
date: '2025-12-25'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Project Nature:**
This is a **local web configuration interface for industrial equipment** (node-switch hardware controller), similar to router admin panels or printer configuration interfaces. The system runs locally on the device, accessed via browser in a one-to-one single-machine deployment scenario.

**Functional Requirements:**

The project delivers a web-based configuration tool that replaces direct JSON file editing with an intuitive interface. Key functional areas include:

1. **Configuration Management (Core)**
   - Display current system and application configuration in readable format
   - Allow modification of application-level settings (timeouts, network params, hardware settings)
   - Allow modification of system-level network settings (IP address, subnet, gateway, DNS)
   - Save configuration changes to config.json file
   - Provide visual feedback during save operations

2. **Validation & Safety**
   - Real-time input validation during configuration entry
   - Validate configuration changes before saving
   - Optional network connectivity testing before applying changes
   - Prevent invalid configurations from being saved

3. **User Experience**
   - Clear saved/unsaved status indication
   - Success confirmation after save operations
   - Prominent restart requirement notification (config changes require system restart)
   - Optional immediate restart functionality

4. **Device Status Visibility**
   - Display device connection status (online/offline)
   - Show current network configuration (IP, port, protocol)
   - Real-time status updates (polling or WebSocket)

**Non-Functional Requirements:**

| Category | Requirement | Architectural Implication |
|----------|-------------|---------------------------|
| **Performance** | Interface loads in <3 seconds | Optimized bundle, lazy loading, efficient component rendering |
| **Validation Accuracy** | 100% config validation accuracy | Dual-layer validation: frontend (Zod) + backend (Zod schema) |
| **System Availability** | 99.9% during operation | Robust error handling, graceful degradation |
| **Technology Compatibility** | TypeScript 5.9.3, Node.js >=22.0.0, Zod 4.2.1, XState 5.12.1 | Must integrate with existing backend stack |
| **Integration** | Existing config.json, XState system, UDP/TCP hardware communication | Requires backend API layer for config I/O and hardware state queries |
| **Accessibility** | WCAG 2.1 AA compliance | shadcn/ui components provide ARIA-compliant patterns |

**UX Complexity & Technical Requirements:**

**Design System:** shadcn/ui + Tailwind CSS
- Component library: Form, Input, Button, Card, Toast, Alert, Badge
- Real-time validation: shadcn/ui Form integrated with Zod schemas
- State management: Form state + device state (polling or WebSocket)

**Key UX Requirements:**
1. **Real-time Form Validation**: Immediate format feedback (✓ or ✗) as user types
2. **Status Visibility**: Left sidebar dashboard (1/3 width) showing device status
3. **Clear Feedback**: Toast notifications + Alert banners (restart reminder non-dismissible)
4. **Responsive Layout**: 1080p baseline, supports 1366x768 (laptops)
5. **Accessibility Compliance**: WCAG 2.1 AA standard (keyboard nav, screen reader support, color contrast)

**Platform Strategy:**
- Primary: Chrome browser on PC
- Mobile: Not supported (phone/tablet excluded)
- Resolution: 1920x1080 (baseline), 1366x768 (minimum)

**Scale & Complexity:**

- **Primary domain**: Full-stack web application (frontend-heavy + lightweight backend API)
- **Complexity level**: **Low-Medium** (local deployment, simplified security, direct file access)
- **Estimated architectural components**: **6-8 components**
  - Frontend: Form components, dashboard component, API client
  - Backend: HTTP server, config read/write APIs, restart controller, status query API

**Complexity Indicators:**

| Indicator | Rating | Explanation |
|-----------|--------|-------------|
| Real-time features | 🟡 Medium | Device status polling, optional WebSocket |
| Multi-tenancy | 🟢 Low | Single-system, shared access (no user accounts) |
| Security | 🟢 Low | Local LAN, optional simple password protection |
| Compliance | 🟢 Low | No regulatory requirements, optional audit logging |
| Integration complexity | 🟡 Medium | Requires backend API layer for existing XState + UDP/TCP system |
| User interaction | 🟢 Low | Standard CRUD + form validation patterns |
| Data complexity | 🟢 Low | Configuration data (JSON), small dataset |

### Technical Constraints & Dependencies

**Existing System Integration:**

The node-switch backend system is already operational with:
- **Runtime**: Node.js >=22.0.0 (Bun preferred for performance)
- **Language**: TypeScript 5.9.3 (strict mode)
- **State Management**: XState v5.12.1 (event-driven state machine architecture)
- **Validation**: Zod v4.2.1 (environment variable and data validation)
- **Logging**: Pino v10.1.0 (structured JSON logging)
- **Hardware Communication**: Native TCP/UDP sockets
- **Architecture**: Event-driven state machine with hierarchical actor model

**Backend Requirements:**

This project needs to add a web interface layer to the existing system:

1. **HTTP Server**: Lightweight web server to serve frontend and handle API requests
2. **Configuration API**: Read/write config.json file operations
3. **Hardware State API**: Query device status from existing hardware manager
4. **Restart Controller**: Safely restart Node.js process after config changes
5. **Static File Serving**: Serve frontend web assets (HTML/CSS/JS)

**Project Context Rules (25 AI Agent Rules):**

From `project-context.md`, implementation must follow:
- **TypeScript Configuration**: Strict mode, ES2022 target, explicit `.js` extensions in imports
- **XState Patterns**: setup/createActor pattern, actor model for complex state, invoke for child state machines
- **Zod Validation**: Runtime schema validation, fail-fast principle (process.exit(1) on invalid config)
- **Testing**: vitest framework, mock hardware communication for unit tests
- **Error Handling**: Centralized error logging, Pino logger, appropriate error levels
- **File Structure**: Feature-based directories (logger/, relay/, voice-broadcast/, hardware/, state-machines/)
- **Documentation**: JSDoc comments for complex functions, Chinese for business logic, English for technical variables

**Technology Stack Compatibility:**

The web interface must integrate seamlessly with existing stack:
- No conflicts with existing XState state machines
- Zod schemas shared between frontend and backend (dual-layer validation)
- Pino logging for both frontend (browser console) and backend (server logs)
- tsup build process extended for frontend assets

### Cross-Cutting Concerns Identified

**1. Validation Layer (Critical)**

- **Frontend**: shadcn/ui Form + Zod (real-time validation during user input)
- **Backend**: Zod schema validation (API request validation)
- **File System**: config.json validation before write operations
- **Shared Schemas**: Single source of truth for configuration structure

**2. State Synchronization**

- **Frontend Form State**: React Hook Form / shadcn/ui Form state management
- **Device State**: Polling or WebSocket for real-time hardware status updates
- **Backend Config State**: Current config.json content
- **Saved/Unsaved Status**: Track modified state vs. persisted state

**3. Error Handling & User Communication**

- **Friendly Error Messages**: Non-technical language, actionable guidance
- **Network Error Recovery**: Graceful handling of API failures
- **Config Error Rollback**: Backup/restore mechanism for invalid configurations
- **Restart Communication**: Clear indication of "saved but needs restart" vs. "applied and running"

**4. Simplified Security (Local Deployment)**

- **Optional Authentication**: Simple password protection (optional, not required)
- **Local Network Only**: No need for HTTPS (HTTP acceptable on LAN)
- **Direct File Access**: No user-based access control needed
- **Process Restart**: Can directly restart Node.js process (no permission restrictions)

**5. Testing Strategy**

- **Frontend Unit Tests**: Component tests with vitest, mock API responses
- **Backend Unit Tests**: API endpoint tests, mock file system operations
- **Integration Tests**: Frontend + backend API integration, mock hardware manager
- **Hardware Communication Mocks**: Mock existing UDP/TCP hardware layer for testing

**6. Build & Deployment**

- **Unified Build Process**: tsup extended to bundle both backend and frontend
- **Single Executable**: One Node.js process serving both HTTP API and hardware control
- **Asset Serving**: Static file serving for frontend bundled code
- **Development Mode**: Hot reload for frontend development, separate from hardware system

---

## Starter Template Evaluation

### Primary Technology Domain

Based on project requirements analysis (local web configuration interface for industrial equipment), the primary technology domain is **Frontend-Heavy Full-Stack Web Application** with the following characteristics:

- **Frontend**: Single Page Application (SPA) with form-based interactions
- **Backend Integration**: Lightweight HTTP API layer for existing Node.js system
- **Deployment**: Local device deployment (single-machine, local network access)
- **Complexity**: Low-Medium (standard CRUD + form validation + device status polling)

### Starter Options Considered

**Option 1: Community Starter Templates**
- **Examples**: react-vite-shadcn-template, ts-react-shadcn-template
- **Pros**: Pre-configured with all dependencies
- **Cons**:
  - Maintenance status uncertain
  - May include unnecessary tools (Prettier, Husky)
  - Potentially outdated versions
  - Less control over project structure
- **Verdict**: Not recommended for production-critical industrial equipment

**Option 2: Full-Stack Frameworks (Next.js, Remix)**
- **Pros**: Integrated routing, SSR capabilities
- **Cons**:
  - Over-engineered for local configuration interface
  - SSR not needed (single-device deployment)
  - Heavier build footprint
  - More complex integration with existing Node.js backend
- **Verdict**: Not suitable for this use case

**Option 3: Manual Vite Setup (Recommended)**
- **Approach**: Create Vite React + TypeScript project, then add shadcn/ui manually
- **Pros**:
  - Official, well-maintained path
  - Full control over dependencies
  - Latest versions guaranteed
  - Lightweight and fast
  - Easy integration with existing backend build process
- **Cons**: Requires manual configuration steps (15-20 minutes)
- **Verdict**: **✅ RECOMMENDED** - Best balance of control, simplicity, and maintainability

### Selected Starter: Vite + React + TypeScript (with shadcn/ui)

**Rationale for Selection:**

1. **Project Nature Alignment**: This is a frontend interface for an existing backend system, not a full-stack application. Vite provides the perfect lightweight foundation.

2. **Official Support**: Both Vite and shadcn/ui officially recommend this path, ensuring long-term maintenance and up-to-date documentation.

3. **Simplicity**: No unnecessary features (SSR, API routes, file-based routing) that would complicate the architecture.

4. **Integration Ease**: Vite's build output can be easily integrated into the existing tsup-based backend build process.

5. **Development Experience**: Fast HMR (Hot Module Replacement) for rapid frontend development iterations.

6. **Technology Consistency**: Aligns with existing project context rules (TypeScript strict mode, vitest testing).

**Initialization Command:**

```bash
# Step 1: Create Vite React + TypeScript project
npm create vite@latest web-ui -- --template react-ts

# Step 2: Navigate to project
cd web-ui

# Step 3: Install dependencies
npm install

# Step 4: Install shadcn/ui dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Step 5: Initialize shadcn/ui
npx shadcn@latest init

# Step 6: Install required shadcn/ui components
npx shadcn@latest add form input button card toast alert badge

# Step 7: Install additional dependencies
npm install react-router-dom zod @hookform/resolvers react-hook-form
npm install -D @types/node

# Step 8: Install testing utilities (optional, aligns with project context)
npm install -D @vitest/ui jsdom
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.9.3 (strict mode enabled)
- React 18.x (latest stable)
- Vite 6.x (build tool and dev server)
- Target: ES2022, module system: ESNext

**Styling Solution:**
- Tailwind CSS 4.x (utility-first CSS)
- PostCSS + Autoprefixer
- shadcn/ui component system (copy-paste components to project)
- CSS modules or styled-components not needed

**Build Tooling:**
- Vite for development (HMR, fast refresh)
- Vite for production build (optimized static assets)
- Output: dist/ directory (static HTML/CSS/JS)
- Integration: Backend serves static files from dist/

**Testing Framework:**
- vitest (unit testing, aligned with project context)
- @testing-library/react (component testing)
- jsdom (DOM simulation)
- @vitest/ui (visual test runner)

**Code Organization:**
```
web-ui/
├── src/
│   ├── components/     # shadcn/ui components
│   ├── lib/            # Utility functions (cn from shadcn)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components (ConfigPage, etc.)
│   ├── services/       # API client, state fetching
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Root component with routing
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind configuration
└── components.json     # shadcn/ui configuration
```

**Development Experience:**
- **Dev Server**: `npm run dev` (Vite dev server on port 5173)
- **Build**: `npm run build` (outputs to dist/)
- **Preview**: `npm run preview` (preview production build)
- **Testing**: `npm run test` (vitest)
- **Type Checking**: `npm run type-check` (tsc --noEmit)
- **Linting**: Can add ESLint if needed (not required)

**Integration with Existing Backend:**

The frontend (web-ui/) will be integrated into the existing node-switch backend:

1. **Development Mode**: Frontend runs on Vite dev server (port 5173), proxies API requests to backend
2. **Production Build**: `npm run build` generates dist/ directory
3. **Backend Serves Frontend**: Existing HTTP server serves static files from dist/
4. **Unified Build Process**: Extend package.json scripts to build both backend and frontend

**Note:** Project initialization using these commands should be the first implementation story. The frontend will be developed as a separate directory (web-ui/) within the project, with eventual integration into the existing backend build process.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- HTTP server selection (Express)
- API design pattern (REST + JSON + Zod validation)
- Backend integration architecture (Service layer abstraction)
- Frontend routing (TanStack Router with file-based routing)
- State management (TanStack Query + react-hook-form)
- Monorepo structure (pnpm workspaces)

**Important Decisions (Shape Architecture):**
- Configuration backup strategy (automatic backup before save)
- Device status polling interval (5 seconds)
- Static file serving (Express serves frontend build output)

**Deferred Decisions (Post-MVP):**
- Optional authentication (simple password protection)
- Configuration history/rollback (can be added later)
- WebSocket vs polling for device status (polling sufficient for MVP)

### Data Architecture

**Configuration Storage Strategy:**

- **Primary Storage**: `config.json` file in project root
- **Backup Strategy**: Automatic backup to `config.backup.json` before each save
- **Validation**: Dual-layer validation
  - Frontend: shadcn/ui Form + Zod (real-time validation during user input)
  - Backend: Zod schema validation in ConfigService before file write
- **Atomic Writes**: Use write-then-rename pattern to prevent corruption
- **Rollback Mechanism**: Manual restore from backup file (MVP), automatic rollback (post-MVP)

**Data Validation Strategy:**

- **Shared Schemas**: Zod schemas defined in `packages/shared/src/schemas/`
  - `config.schema.ts`: Complete configuration structure validation
  - Exported to both frontend and backend packages
  - Single source of truth for configuration shape
- **Validation Flow**:
  1. Frontend: User input validated by react-hook-form + Zod (real-time feedback)
  2. Backend: API request validated by ConfigService using same Zod schema
  3. File System: Final validation before write operation
- **Error Handling**: Friendly error messages, specific validation feedback

**Data Access Pattern:**

- **Service Layer Abstraction**: `ConfigService` class encapsulates all config operations
  - `getConfig()`: Read and parse config.json
  - `saveConfig(data)`: Validate, backup, and write config
  - `validateConfig(data)`: Validate without saving (for "test connection" feature)
- **Direct File Access**: Use Node.js `fs` module with promises
  - `fs.readFile()`: Read config.json
  - `fs.writeFile()`: Write config.json
  - `fs.copyFile()`: Create backup before save
- **No Database**: Configuration data stored as JSON, no database needed

### Authentication & Security

**Simplified Security (Local Deployment):**

- **Authentication**: Optional simple password protection (MVP may skip)
  - If implemented: Basic Auth or simple API key header
  - No user accounts or sessions needed
  - Single shared access for device configuration
- **Network Security**: HTTP acceptable on local LAN (HTTPS optional)
  - No TLS/SSL required for local network deployment
  - HTTPS can be added post-MVP if needed
- **Access Control**: No role-based access control needed
  - All users have full configuration access
  - No permission restrictions
- **Input Validation**: Zod schemas provide security against injection attacks
  - All inputs validated and sanitized
  - Type-safe parsing prevents code injection

**Data Protection:**

- **Sensitive Values**: Config file may contain sensitive data (API keys, passwords)
  - Optional: Encrypt sensitive fields in config.json (post-MVP)
  - MVP: Store in plain text (acceptable for local device)
- **Audit Logging**: Optional (deferred to post-MVP)
  - Track who changed configuration and when
  - Not critical for single-device deployment

### API & Communication Patterns

**API Design: REST + JSON**

- **Protocol**: HTTP/1.1 over TCP
- **Request Format**: JSON with `Content-Type: application/json`
- **Response Format**: JSON envelope with success/error indication
- **HTTP Status Codes**: Standard codes (200, 400, 500, etc.)

**API Endpoints:**

**Configuration Management:**
```
GET /api/config
Response: { success: true, data: { ipAddress, subnetMask, gateway, port, deviceId } }

PUT /api/config
Request: { ipAddress, subnetMask, gateway, port, deviceId }
Response: { success: true, message: "配置已保存，需要重启系统才能生效", needsRestart: true }

POST /api/config/validate
Request: { ipAddress, subnetMask, gateway, port }
Response: { success: true, valid: true }
```

**Device Status:**
```
GET /api/status
Response: {
  success: true,
  data: {
    online: true,
    ipAddress: "192.168.1.100",
    port: 8080,
    protocol: "UDP"
  }
}

GET /api/status/network
Response: {
  success: true,
  data: {
    subnetMask: "255.255.255.0",
    gateway: "192.168.1.1",
    dns: ["8.8.8.8", "8.8.4.4"]
  }
}
```

**System Control:**
```
POST /api/system/restart
Response: { success: true, message: "系统正在重启..." }

POST /api/system/test-connection
Request: { ipAddress, port }
Response: { success: true, reachable: true, latency: 5 }
```

**Static Files:**
```
GET / → Serve index.html (SPA entry point)
GET /assets/* → Serve frontend static assets
GET * → Fallback to index.html (SPA routing)
```

**Error Handling Standards:**

- **Validation Errors**: HTTP 400 + detailed error message
  ```json
  {
    "success": false,
    "error": "配置验证失败",
    "validationErrors": {
      "ipAddress": "IP 地址格式无效，请输入如 192.168.1.100 的格式"
    }
  }
  ```
- **Server Errors**: HTTP 500 + generic error message
  ```json
  {
    "success": false,
    "error": "服务器错误，请稍后重试"
  }
  ```
- **Not Found**: HTTP 404 (for API endpoints only)
- **Friendly Messages**: Use Chinese, avoid technical jargon

**Rate Limiting:**

- **Not Required**: Local deployment, single-user scenario
- **Optional Post-MVP**: Basic rate limit if abuse detected

### Frontend Architecture

**Routing Strategy: TanStack Router (File-Based Routing)**

- **Router Package**: `@tanstack/react-router` (latest stable)
- **Configuration**: File-based routing (automatic route generation)
- **File Structure**:
  ```
  packages/frontend/src/routes/
    ├── __root.tsx          # Root layout (optional)
    └── index.tsx           # / → Config page (main interface)
  ```
- **Features**:
  - Type-safe route parameters
  - Automatic code splitting
  - Link preloading (optional)
- **Simple SPA**: Single page application (config interface only)

**State Management: TanStack Query + react-hook-form**

- **Server State (Device Status, Config)**: TanStack Query
  - Package: `@tanstack/react-query` (latest version)
  - Features:
    - Automatic caching and revalidation
    - Built-in loading and error states
    - Polling with `refetchInterval`
  - Usage Example:
    ```typescript
    const { data: status, isLoading, error } = useQuery({
      queryKey: ['device-status'],
      queryFn: fetchDeviceStatus,
      refetchInterval: 5000, // Poll every 5 seconds
    })
    ```
- **Form State (User Input)**: react-hook-form + Zod
  - Package: `react-hook-form` + `@hookform/resolvers`
  - Integrated with shadcn/ui Form component
  - Real-time validation using Zod schemas
  - Benefits:
    - Minimal re-renders
    - Type-safe form values
    - Easy validation error display

**API Client Architecture:**

- **Fetch-based Client**: Use native `fetch` API with TanStack Query
  - No additional API client library needed
  - TanStack Query handles caching, retry, loading states
  - Example:
    ```typescript
    async function fetchDeviceStatus() {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Failed to fetch status')
      return res.json()
    }
    ```
- **Error Handling**: Centralized error handling in TanStack Query query config
- **Request Interceptors**: Can add authentication headers post-MVP if needed

**Component Architecture:**

- **Component Library**: shadcn/ui (copy-paste components)
  - Location: `packages/frontend/src/components/ui/`
  - Components: Form, Input, Button, Card, Toast, Alert, Badge
- **Page Components**:
  - `ConfigPage`: Main configuration form page
  - `DeviceStatusDashboard`: Left sidebar showing device status
- **Layout Components**:
  - Root layout with global providers (QueryClient, Router)
  - Responsive grid layout (1/3 dashboard, 2/3 form)

**Performance Optimization:**

- **Code Splitting**: TanStack Router automatic splitting
- **Lazy Loading**: Load heavy components on demand
- **Bundle Optimization**: Vite tree-shaking and minification
- **Image Optimization**: Use appropriate formats (SVG for icons)
- **Target Bundle Size**: <500 KB (gzipped) for initial load

### Infrastructure & Deployment

**Monorepo Structure: pnpm Workspaces**

- **Workspace Tool**: pnpm (latest stable)
- **Configuration File**: `pnpm-workspace.yaml`
  ```yaml
  packages:
    - 'packages/*'
  ```
- **Packages**:
  - `packages/backend`: Express server, XState integration, ConfigService
  - `packages/frontend`: Vite + React + TanStack Router + shadcn/ui
  - `packages/shared`: Zod schemas, TypeScript types (shared by frontend and backend)
- **Root Scripts**:
  ```json
  {
    "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\"",
    "build": "pnpm --filter shared build && pnpm --filter backend build && pnpm --filter frontend build",
    "start": "pnpm --filter backend start"
  }
  ```
- **Dependency Management**: Workspace protocol (`workspace:*`) for internal packages

**Development Workflow:**

- **Development Mode**:
  - Backend: `tsx watch` with hot reload
  - Frontend: Vite dev server on port 5173
  - API Proxy: Vite proxies `/api/*` requests to backend on port 3000
- **Type Checking**: Shared TypeScript config across all packages
- **Testing**: vitest at root level, can test all packages

**Build Process:**

- **Shared Package**: Built with tsup (outputs to `dist/`)
- **Backend Package**: Built with tsup (outputs to `dist/index.js`)
- **Frontend Package**: Built with Vite (outputs to `public/`)
- **Build Order**: shared → backend → frontend
- **Output Structure**:
  ```
  node-switch/
  ├── packages/shared/dist/      # Shared JS
  ├── packages/backend/dist/     # Backend bundle
  └── public/                     # Frontend static assets
  ```

**Production Deployment:**

- **Runtime**: Node.js >=22.0.0 or Bun (preferred)
- **Server Startup**: Single command `pnpm start` runs Express server
- **Static File Serving**: Express serves frontend from `public/` directory
- **Process Management**: systemd service or pm2 (for auto-restart)
- **Port Configuration**: Configurable via environment variable (default: 3000)
- **Environment Variables**: `.env` file for configuration (Zod validated)

**Development vs Production:**

| Aspect | Development | Production |
|--------|-------------|------------|
| **Frontend Server** | Vite dev server (5173) | Served by Express from `public/` |
| **Backend Server** | Express (3000) | Express (3000) |
| **API Communication** | Vite proxy to Express | Same origin (no proxy needed) |
| **Hot Reload** | Yes (Vite HMR + tsx watch) | No (static build) |
| **Build Artifacts** | In-memory | Pre-built to `public/` and `dist/` |

**Monitoring & Logging:**

- **Logging**: Pino (structured JSON logging)
  - Backend: Server logs to stdout/file
  - Frontend: Browser console (Pino browser logging optional)
- **Log Levels**: error, warn, info, debug
- **Health Checks**: `GET /api/health` endpoint (optional)
- **Metrics**: Not required for MVP (can add post-MVP)

### Decision Impact Analysis

**Implementation Sequence:**

1. **Phase 1: Monorepo Setup** (Foundation)
   - Initialize pnpm workspace
   - Create package structure (backend, frontend, shared)
   - Configure TypeScript at root level
   - Setup shared package with Zod schemas

2. **Phase 2: Backend Development** (API Layer)
   - Implement ConfigService with validation
   - Create Express server with API routes
   - Implement configuration read/write endpoints
   - Add device status query endpoint
   - Implement static file serving for production

3. **Phase 3: Frontend Development** (UI Layer)
   - Setup Vite + React + TanStack Router
   - Install shadcn/ui components
   - Implement ConfigForm with react-hook-form + Zod
   - Implement DeviceStatusDashboard with TanStack Query
   - Connect to backend APIs

4. **Phase 4: Integration & Testing** (Quality Assurance)
   - Test frontend-backend integration
   - Implement device status polling
   - Test configuration save flow
   - Test system restart mechanism
   - Deploy and test on actual device

**Cross-Component Dependencies:**

- **Shared Package** must be built before Backend and Frontend
- **Backend** exposes API contract defined in Shared package
- **Frontend** consumes same Zod schemas from Shared package
- **Frontend Build** produces static files that Backend serves
- **All Three** share TypeScript version and base configuration

**Critical Integration Points:**

1. **Zod Schema Synchronization**: Frontend and Backend must use same version of shared package
2. **API Contract**: Backend API endpoints must match frontend expectations
3. **Static File Path**: Backend must serve frontend build output from correct path (`public/`)
4. **CORS**: Not needed in production (same origin), but may be needed in development (Vite proxy handles this)
5. **Type Safety**: Cross-package type checking via TypeScript project references

**Technology Versions Summary:**

| Technology | Version | Source |
|------------|---------|--------|
| Node.js | >=22.0.0 | Project Context |
| TypeScript | 5.9.3 | Project Context |
| Express | Latest stable (5.x) | Decision |
| XState | 5.12.1 | Project Context |
| Zod | 4.2.1 | Project Context |
| Pino | 10.1.0 | Project Context |
| vitest | Latest | Project Context |
| React | 18.x | Starter Template |
| Vite | 6.x | Starter Template |
| Tailwind CSS | 4.x | Starter Template |
| shadcn/ui | Latest | UX Requirement |
| TanStack Router | Latest stable | Decision |
| TanStack Query | Latest stable | Decision |
| react-hook-form | Latest | Decision |
| pnpm | Latest stable | Decision |

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Overview

This section defines consistent patterns and conventions that must be followed across the entire project. These rules ensure code consistency, maintainability, and enable multiple AI agents to work cohesively.

**Pattern Categories:**
1. **Naming Patterns** - API, code, and file naming conventions
2. **Structure Patterns** - Monorepo organization and file placement
3. **Format Patterns** - API responses and data exchange formats
4. **Communication Patterns** - Frontend-backend and event system communication
5. **Process Patterns** - Error handling, loading states, and user flows

---

### 1. Naming Patterns

#### API Endpoint Naming

**RESTful Convention:**

```
# Resource-based plural nouns
GET    /api/config           # 获取完整配置
GET    /api/config/network   # 获取网络配置子集
PUT    /api/config           # 更新完整配置
POST   /api/config/validate  # 验证配置（不保存）

# Action-based verbs for operations
POST   /api/system/restart         # 重启系统
POST   /api/system/test-connection # 测试连接

# Status queries
GET    /api/status              # 设备在线状态
GET    /api/status/network      # 网络状态详情
GET    /api/status/hardware     # 硬件状态详情
```

**Hyphen Convention:** Use hyphens (`-`) for multi-word URL paths
- ✅ `/api/system/test-connection`
- ❌ `/api/system/testConnection` or `/api/system/test_connection`

**Query Parameters:** Use camelCase
- ✅ `/api/config?validateOnly=true`
- ❌ `/api/config?validate_only=true`

#### Code Naming

**TypeScript/JavaScript:**
- **Variables & Functions:** camelCase
  ```typescript
  const deviceStatus = { online: true };
  function getConfig() { return {}; }
  ```

- **Types & Interfaces:** PascalCase
  ```typescript
  type DeviceStatus = { online: boolean };
  interface ConfigResponse { success: boolean; data: Config }
  ```

- **Constants:** UPPER_SNAKE_CASE
  ```typescript
  const API_BASE_URL = '/api';
  const DEFAULT_POLLING_INTERVAL = 5000;
  ```

- **Enums:** PascalCase with UPPER_SNAKE_CASE values
  ```typescript
  enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info'
  }
  ```

**Zod Schema Naming:** PascalCase with `Schema` suffix
```typescript
// packages/shared/src/schemas/config.schema.ts
export const configSchema = z.object({...});
export const networkConfigSchema = z.object({...});
export const deviceStatusSchema = z.object({...});
```

**XState Machine Naming:** camelCase with `Machine` suffix
```typescript
export const mainMachine = setup({...});
export const applyAmmoMachine = setup({...});
export const monitorMachine = setup({...});
```

#### File Naming

**Source Files:** kebab-case
```
packages/backend/src/
├── config/
│   ├── config.service.ts
│   └── config.routes.ts
├── services/
│   └── device-status.service.ts
```

**Test Files:** Same as source with `.test.ts` or `.spec.ts` suffix
```
packages/backend/src/config/
├── config.service.ts
├── config.service.test.ts
└── config.routes.test.ts
```

**Component Files:** PascalCase for React components
```
packages/frontend/src/components/
├── ConfigForm.tsx
├── DeviceStatusDashboard.tsx
└── ui/
    ├── form.tsx
    └── button.tsx
```

---

### 2. Structure Patterns

#### Monorepo Organization

**Root Structure:**
```
node-switch/
├── packages/
│   ├── backend/          # Express + XState + ConfigService
│   ├── frontend/         # Vite + React + TanStack Router
│   └── shared/           # Zod schemas + TypeScript types
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json         # Root TypeScript config
└── vitest.config.ts      # Root test config
```

**Package Internal Structure:**
```
packages/backend/
├── src/
│   ├── config/           # Configuration services
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (device status, etc.)
│   ├── middleware/       # Express middleware (auth, logging)
│   ├── state-machines/   # XState machines (existing)
│   ├── utils/            # Utility functions
│   └── index.ts          # Entry point
├── test/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json

packages/frontend/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   │   └── index.tsx     # Main config page (/)
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── ConfigForm.tsx
│   │   └── DeviceStatusDashboard.tsx
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client functions
│   ├── lib/              # Utilities (cn from shadcn)
│   └── main.tsx          # Entry point
├── test/
│   └── unit/
├── public/               # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── components.json       # shadcn/ui config

packages/shared/
├── src/
│   ├── schemas/          # Zod schemas
│   │   ├── config.schema.ts
│   │   ├── network.schema.ts
│   │   └── device.schema.ts
│   ├── types/            # TypeScript types
│   │   ├── config.types.ts
│   │   └── api.types.ts
│   └── index.ts          # Re-exports
└── package.json
```

#### Import Order Convention

**Within Files:**
```typescript
// 1. External dependencies
import { z } from 'zod';
import express from 'express';

// 2. Internal shared packages
import { configSchema } from '@node-switch/shared';

// 3. Internal package imports
import { ConfigService } from './config.service';
import { logger } from '../utils/logger';
```

#### File Placement Rules

**Components vs Pages:**
- **Pages:** `src/routes/` (TanStack Router file-based routing)
- **Components:** `src/components/` (reusable UI components)
- **UI Components:** `src/components/ui/` (shadcn/ui primitives)

**Services vs Utilities:**
- **Services:** Business logic with side effects (`src/services/`)
- **Utilities:** Pure functions without side effects (`src/lib/` or `src/utils/`)

---

### 3. Format Patterns

#### API Response Format

**Success Response:**
```typescript
// Standard success envelope
{
  "success": true,
  "data": {
    // Response data
  }
}

// Success with message
{
  "success": true,
  "message": "配置已保存",
  "data": {
    // Optional response data
  }
}

// Success with additional flags
{
  "success": true,
  "message": "配置已保存，需要重启系统才能生效",
  "needsRestart": true
}
```

**Error Response:**
```typescript
// Standard error envelope
{
  "success": false,
  "error": "配置验证失败"
}

// Validation error with details
{
  "success": false,
  "error": "配置验证失败",
  "validationErrors": {
    "ipAddress": "IP 地址格式无效",
    "port": "端口号必须在 1-65535 之间"
  }
}

// Error with code (for programmatic handling)
{
  "success": false,
  "error": "配置文件不存在",
  "errorCode": "CONFIG_NOT_FOUND"
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation errors, malformed input
- `404 Not Found` - Resource not found (API endpoints)
- `500 Internal Server Error` - Unexpected server errors
- `503 Service Unavailable` - System temporarily unavailable

#### Data Exchange Format

**Request Body (JSON):**
```typescript
// PUT /api/config
{
  "ipAddress": "192.168.1.100",
  "subnetMask": "255.255.255.0",
  "gateway": "192.168.1.1",
  "port": 8080,
  "deviceId": "device-001"
}
```

**Query Parameters:**
```typescript
// GET /api/config?validateOnly=true
// GET /api/status?includeDetails=true
```

**Date/Time Format:**
- ISO 8601 strings: `"2025-12-25T10:30:00.000Z"`
- Timestamps in milliseconds: `1735126200000`

**Boolean Values:**
- Use JSON `true`/`false`, not string `"true"`/`"false"`

---

### 4. Communication Patterns

#### Frontend-Backend Communication

**API Client Pattern:**
```typescript
// packages/frontend/src/services/api.ts
import { deviceStatusSchema, type DeviceStatus } from '@node-switch/shared';

export async function fetchDeviceStatus(): Promise<DeviceStatus> {
  const response = await fetch('/api/status');
  if (!response.ok) {
    throw new Error('Failed to fetch device status');
  }
  const result = await response.json();
  return deviceStatusSchema.parse(result.data);
}

export async function saveConfig(config: Config): Promise<void> {
  const response = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save config');
  }
}
```

**TanStack Query Integration:**
```typescript
// packages/frontend/src/hooks/use-device-status.ts
import { useQuery } from '@tanstack/react-query';
import { fetchDeviceStatus } from '../services/api';

export function useDeviceStatus() {
  return useQuery({
    queryKey: ['device-status'],
    queryFn: fetchDeviceStatus,
    refetchInterval: 5000, // Poll every 5 seconds
    retry: 3,
    retryDelay: 1000
  });
}
```

#### Error Communication

**Error Object Shape:**
```typescript
interface ApiError {
  success: false;
  error: string;              // User-friendly Chinese message
  errorCode?: string;         // Programmatic error code
  validationErrors?: Record<string, string>;
}
```

**Frontend Error Handling:**
```typescript
try {
  await saveConfig(config);
  toast({ title: "保存成功", description: "配置已保存" });
} catch (error) {
  if (error instanceof ApiError) {
    // Display validation errors
    if (error.validationErrors) {
      Object.entries(error.validationErrors).forEach(([field, message]) => {
        form.setError(field, { type: 'validation', message });
      });
    }
    toast({ title: "保存失败", description: error.error, variant: "destructive" });
  }
}
```

#### Event Communication (XState Integration)

**Backend → Frontend Events (via polling or WebSocket):**
```typescript
// Device status change event ( polled by TanStack Query )
interface DeviceStatusEvent {
  type: 'STATUS_CHANGED';
  online: boolean;
  timestamp: number;
}
```

**Frontend → Backend Events (via API calls):**
```typescript
// User action events sent via HTTP POST
interface RestartRequestEvent {
  type: 'restart_request';
  reason: 'config_change' | 'manual';
}
```

---

### 5. Process Patterns

#### Error Handling Pattern

**Backend Error Handling:**
```typescript
// Express error handler middleware
export function apiErrorHandler(
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  logger.error('API Error', { error: error.message, path: req.path });

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: '配置验证失败',
      validationErrors: error.flatten().fieldErrors
    });
  }

  res.status(500).json({
    success: false,
    error: '服务器错误，请稍后重试'
  });
}
```

**Frontend Error Handling:**
```typescript
// TanStack Query error callback
const { error } = useQuery({
  queryKey: ['device-status'],
  queryFn: fetchDeviceStatus,
  onError: (error) => {
    toast({
      title: "获取状态失败",
      description: error.message,
      variant: "destructive"
    });
  }
});
```

#### Loading State Pattern

**Backend:** No loading state (synchronous API)

**Frontend Loading States:**
```typescript
// TanStack Query provides loading states
const { data, isLoading, error } = useQuery({
  queryKey: ['device-status'],
  queryFn: fetchDeviceStatus
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorDisplay error={error} />;
return <StatusDisplay data={data} />;
```

#### Form Validation Pattern

**Frontend Validation (react-hook-form + Zod):**
```typescript
// packages/frontend/src/components/ConfigForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkConfigSchema } from '@node-switch/shared';

const form = useForm({
  resolver: zodResolver(networkConfigSchema),
  defaultValues: {
    ipAddress: '',
    subnetMask: '',
    gateway: ''
  }
});

// Real-time validation with visual feedback
<FormField
  control={form.control}
  name="ipAddress"
  render={({ field }) => (
    <FormItem>
      <FormLabel>IP 地址</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Auto-display validation errors */}
    </FormItem>
  )}
/>
```

**Backend Validation (Zod):**
```typescript
// packages/backend/src/config/config.service.ts
import { networkConfigSchema } from '@node-switch/shared';

export class ConfigService {
  saveConfig(data: unknown) {
    const validated = networkConfigSchema.parse(data);
    // Proceed with file write
  }
}
```

#### Configuration Save Flow Pattern

**User Flow:**
1. User modifies form fields (real-time validation)
2. User clicks "Save" button
3. Frontend validates entire form
4. If valid → send PUT request to `/api/config`
5. Backend validates using same Zod schema
6. Backend creates backup of config.json
7. Backend writes new config to config.json
8. Backend returns success response with `needsRestart: true`
9. Frontend displays success toast and "Restart Required" alert
10. User clicks "Restart" button → POST to `/api/system/restart`

**Error Recovery Flow:**
1. If backend validation fails → return 400 with validation errors
2. Frontend displays errors inline
3. If file write fails → return 500 with error message
4. Frontend displays error toast
5. If backup fails → log error, attempt save without backup
6. User can retry save operation

---

### Pattern Enforcement

**AI Agent Guidelines:**
- All agents MUST follow these patterns when implementing code
- When creating new files, follow the structure patterns
- When naming variables/functions, use the naming conventions
- When implementing APIs, use the response format patterns
- When handling errors, use the error handling pattern

**Consistency Checks:**
- Code reviews should verify pattern compliance
- Linting rules can enforce some patterns (naming conventions)
- TypeScript strict mode ensures type safety
- Zod schemas ensure runtime validation consistency

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
node-switch/
├── packages/
│   ├── backend/                    # Express + XState + ConfigService
│   │   ├── src/
│   │   │   ├── config/             # 配置管理服务
│   │   │   │   ├── config.service.ts           # 配置读写逻辑
│   │   │   │   ├── config.routes.ts            # API 路由定义
│   │   │   │   ├── config-import-export.service.ts  # 导入导出功能
│   │   │   │   ├── config-history.service.ts   # 配置历史管理
│   │   │   ├── routes/             # API 路由层
│   │   │   │   ├── index.ts                    # 路由聚合
│   │   │   │   ├── status.routes.ts            # 设备状态 API
│   │   │   │   ├── system.routes.ts            # 系统控制 API (重启等)
│   │   │   │   └── auth.routes.ts              # 认证 API (可选)
│   │   │   ├── services/           # 业务逻辑服务
│   │   │   │   ├── device-status.service.ts    # 设备状态查询
│   │   │   │   └── restart.service.ts          # 系统重启控制
│   │   │   ├── middleware/         # Express 中间件
│   │   │   │   ├── logger.middleware.ts        # Pino 日志中间件
│   │   │   │   ├── error-handler.middleware.ts # 全局错误处理
│   │   │   │   ├── cors.middleware.ts          # CORS 配置
│   │   │   │   └── auth.middleware.ts          # 认证中间件 (可选)
│   │   │   ├── state-machines/     # XState 状态机 (现有)
│   │   │   │   ├── main-machine.ts
│   │   │   │   ├── apply-ammo-machine.ts
│   │   │   │   └── monitor-machine.ts
│   │   │   ├── utils/              # 工具函数
│   │   │   │   ├── logger.ts                  # Pino 日志配置
│   │   │   │   └── file-utils.ts              # 文件操作工具
│   │   │   └── index.ts            # 后端入口
│   │   ├── test/
│   │   │   ├── unit/               # 单元测试
│   │   │   │   ├── config/
│   │   │   │   └── services/
│   │   │   └── integration/        # 集成测试
│   │   │       └── api/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                   # Vite + React + TanStack Router
│   │   ├── src/
│   │   │   ├── routes/             # TanStack Router 文件路由
│   │   │   │   ├── __root.tsx                 # 根布局 (QueryClient Provider)
│   │   │   │   └── index.tsx                  # 主配置页面 (/)
│   │   │   ├── components/
│   │   │   │   ├── ui/                       # shadcn/ui 组件
│   │   │   │   │   ├── form.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── alert.tsx
│   │   │   │   │   └── badge.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   └── MainLayout.tsx         # 主布局 (左侧状态栏 + 右侧表单)
│   │   │   │   ├── config/
│   │   │   │   │   ├── ConfigForm.tsx         # 主配置表单
│   │   │   │   │   ├── NetworkConfigForm.tsx  # 网络配置子表单
│   │   │   │   │   └── AppConfigForm.tsx      # 应用配置子表单
│   │   │   │   ├── status/
│   │   │   │   │   ├── DeviceStatusDashboard.tsx  # 左侧设备状态面板
│   │   │   │   │   └── StatusBadge.tsx            # 在线状态徽章
│   │   │   │   └── feedback/
│   │   │   │       ├── LoadingSpinner.tsx     # 加载指示器
│   │   │   │       └── ErrorDisplay.tsx       # 错误显示组件
│   │   │   ├── hooks/              # 自定义 React Hooks
│   │   │   │   ├── use-device-status.ts       # 设备状态 (TanStack Query)
│   │   │   │   ├── use-config.ts              # 配置数据 (TanStack Query)
│   │   │   │   └── use-config-mutation.ts     # 配置更新 (TanStack Mutation)
│   │   │   ├── services/           # API 客户端
│   │   │   │   ├── api.ts                     # 基础 fetch 封装
│   │   │   │   ├── config-api.ts              # 配置 API 调用
│   │   │   │   └── status-api.ts              # 状态 API 调用
│   │   │   ├── lib/                # 工具库
│   │   │   │   └── utils.ts                   # cn() from shadcn
│   │   │   ├── main.tsx            # 入口点
│   │   │   └── App.tsx             # 根组件
│   │   ├── test/
│   │   │   └── unit/               # 组件测试
│   │   │       └── components/
│   │   ├── public/                 # 静态资源
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── components.json         # shadcn/ui 配置
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                     # 共享类型和验证
│       ├── src/
│       │   ├── schemas/            # Zod 验证模式
│       │   │   ├── config.schema.ts           # 完整配置结构
│       │   │   ├── network.schema.ts          # 网络配置子集
│       │   │   ├── device.schema.ts           # 设备状态结构
│       │   │   └── api-response.schema.ts     # API 响应包装
│       │   ├── types/              # TypeScript 类型
│       │   │   ├── config.types.ts           # 配置类型定义
│       │   │   ├── api.types.ts              # API 类型定义
│       │   │   └── device.types.ts           # 设备类型定义
│       │   └── index.ts            # 重导出
│       ├── package.json
│       └── tsconfig.json
│
├── src/                           # 现有后端代码 (迁移到 packages/backend 前)
│   ├── state-machines/
│   ├── hardware/
│   ├── logger/
│   ├── relay/
│   └── voice-broadcast/
│
├── test/                          # 现有测试 (迁移到 packages/backend/test 前)
│   └── state-machines/
│
├── pnpm-workspace.yaml            # pnpm workspace 配置
├── package.json                   # 根 package.json (脚本)
├── tsconfig.json                  # 根 TypeScript 配置
├── vitest.config.ts               # 全局测试配置
├── .env.example                   # 环境变量示例
├── .gitignore
├── README.md
├── config.json                    # 当前配置文件 (将被 API 管理)
└── config.backup.json             # 自动备份文件
```

### Architectural Boundaries

**API Boundaries:**

- **External API Endpoints** (Express exposes to browser)
  - `/api/config` - Configuration CRUD
  - `/api/config/validate` - Validation without save
  - `/api/status` - Device status queries
  - `/api/system/restart` - System control operations
  - `/api/system/test-connection` - Network connectivity testing

- **Internal Service Boundaries** (Backend modules)
  - `ConfigService` - Encapsulates all config.json operations
  - `DeviceStatusService` - Queries XState actors for hardware state
  - `RestartService` - Manages process restart safely

- **Authentication Boundary** (Optional, post-MVP)
  - Simple password check via Basic Auth or API key header
  - No session management required

- **Data Access Layer Boundary**
  - `fs.readFile()` / `fs.writeFile()` - Only accessed through ConfigService
  - XState actors - Queried via DeviceStatusService, not directly by routes

**Component Boundaries:**

- **Frontend Component Communication**
  - Props down: `ConfigForm` receives `initialData` prop
  - Events up: `onSave` callback propagates to parent
  - Context: `QueryClientProvider` wraps entire app

- **State Management Boundaries**
  - Server State (device status, config) - Managed by TanStack Query
  - Form State (user input) - Managed by react-hook-form
  - UI State (modals, toasts) - Managed by React useState or component state

- **Service Communication Patterns**
  - Frontend → Backend: HTTP REST (fetch API)
  - Backend → XState: sendParent() events, actor queries
  - Backend → Hardware: Existing TCP/UDP communication layer

- **Event-Driven Integration Points**
  - MonitorMachine detects hardware state changes → sendParent to MainMachine
  - MainMachine routes config-related events → ApplyAmmoMachine
  - Backend API queries state via DeviceStatusService → XState actors

**Service Boundaries:**

- **Service Integration Patterns**
  - ConfigService uses Zod schemas from `@node-switch/shared`
  - Frontend uses same Zod schemas for form validation
  - DeviceStatusService queries XState but does not control them

- **Service Responsibility Boundaries**
  - Routes layer: HTTP request/response handling only
  - Services layer: Business logic and external system interaction
  - Middleware: Cross-cutting concerns (logging, auth)

**Data Boundaries:**

- **Data Access Patterns**
  - Configuration data: ConfigService reads/writes config.json
  - Device state: XState actors hold current state, queried via snapshot
  - No database: All data is file-based (JSON config)

- **Caching Boundaries**
  - TanStack Query caches API responses (auto-revalidation)
  - No server-side caching needed (single-user, low-latency file access)

- **External Data Integration Points**
  - Hardware TCP/UDP communication (existing, accessed via XState machines)
  - Future: Could integrate with external backup storage (post-MVP)

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

**Epic: Configuration Management (FR-001, FR-002, FR-003, FR-004, FR-005)**
- Frontend Components: `packages/frontend/src/components/config/`
  - `ConfigForm.tsx` - Main configuration interface
  - `NetworkConfigForm.tsx` - Network settings form
  - `AppConfigForm.tsx` - Application-level settings
- Frontend Services: `packages/frontend/src/services/config-api.ts`
- Frontend Hooks: `packages/frontend/src/hooks/use-config.ts`, `use-config-mutation.ts`
- Backend Routes: `packages/backend/src/routes/config.routes.ts`
- Backend Service: `packages/backend/src/config/config.service.ts`
- Shared Validation: `packages/shared/src/schemas/config.schema.ts`
- Tests: `packages/backend/test/unit/config/`, `packages/frontend/test/unit/components/config/`

**Epic: Device Status Monitoring (FR-001: device status display)**
- Frontend Components: `packages/frontend/src/components/status/`
  - `DeviceStatusDashboard.tsx` - Left sidebar status display
  - `StatusBadge.tsx` - Online/offline indicator
- Frontend Hooks: `packages/frontend/src/hooks/use-device-status.ts`
- Frontend Services: `packages/frontend/src/services/status-api.ts`
- Backend Routes: `packages/backend/src/routes/status.routes.ts`
- Backend Service: `packages/backend/src/services/device-status.service.ts`
- Shared Types: `packages/shared/src/types/device.types.ts`, `schemas/device.schema.ts`

**Epic: System Control (FR-001: restart functionality)**
- Frontend Components: `packages/frontend/src/components/system/` (restart button, confirm dialog)
- Backend Routes: `packages/backend/src/routes/system.routes.ts`
- Backend Service: `packages/backend/src/services/restart.service.ts`

**Epic: Configuration Import/Export (FR-008)**
- Backend Service: `packages/backend/src/config/config-import-export.service.ts`
- Frontend Components: File upload/download UI in ConfigForm
- Tests: `packages/backend/test/integration/api/import-export.test.ts`

**Epic: Configuration History (FR-009)**
- Backend Service: `packages/backend/src/config/config-history.service.ts`
- File Storage: Backups stored as `config.backup.{timestamp}.json`
- Frontend UI: History list view with rollback button (post-MVP)

**Epic: Configuration Templates (FR-010)**
- Backend Service: `packages/backend/src/config/config-templates.service.ts`
- Template Storage: `config-templates/` directory with predefined configs
- Frontend UI: Template selector dropdown in ConfigForm

**Cross-Cutting Concerns:**

**Validation Layer**
- Shared Schemas: `packages/shared/src/schemas/`
  - Used by frontend react-hook-form (real-time validation)
  - Used by backend ConfigService (API validation)
  - Single source of truth for data structure

**Logging**
- Backend: `packages/backend/src/utils/logger.ts` (Pino)
- Middleware: `packages/backend/src/middleware/logger.middleware.ts`
- Frontend: Browser console (Pino browser optional)

**Error Handling**
- Backend Middleware: `packages/backend/src/middleware/error-handler.middleware.ts`
- Frontend: TanStack Query error callbacks + Toast notifications
- Shared Error Types: `packages/shared/src/types/api.types.ts`

**Authentication (Optional, Post-MVP)**
- Backend Middleware: `packages/backend/src/middleware/auth.middleware.ts`
- Backend Routes: `packages/backend/src/routes/auth.routes.ts`
- Frontend: Login page (TanStack Router route: `/login`)

### Integration Points

**Internal Communication:**

1. **Frontend → Backend (HTTP REST)**
   - `fetch('/api/config')` → Express routes → ConfigService → config.json
   - `fetch('/api/status')` → Express routes → DeviceStatusService → XState actors
   - TanStack Query manages caching, retry, loading states

2. **Backend → XState (Actor Model)**
   - DeviceStatusService queries MainMachine snapshot
   - MainMachine coordinates ApplyAmmoMachine and MonitorMachine
   - Events sent via sendParent() from child to parent actors

3. **Frontend State Sync**
   - TanStack Query polls `/api/status` every 5 seconds
   - React Hook Form validates inputs against Zod schemas
   - Toast notifications display success/error feedback

**External Integrations:**

1. **Hardware Communication**
   - XState MonitorMachine reads from TCP/UDP sockets
   - Hardware state changes trigger events to MainMachine
   - Abstraction layer: HardwareCommunicationManager (existing)

2. **File System**
   - ConfigService reads/writes config.json
   - Automatic backup creation before save
   - Atomic writes (write-then-rename pattern)

3. **Future: External Backup Storage**
   - Could add S3/FTP backup service post-MVP
   - Integration point: ConfigBackupService

**Data Flow:**

```
User Input (Browser)
    ↓
ConfigForm (react-hook-form + Zod validation)
    ↓
Save Button Click
    ↓
useConfigMutation (TanStack Mutation)
    ↓
fetch('/api/config', { method: 'PUT', body: JSON })
    ↓
Express Router (config.routes.ts)
    ↓
ConfigService.saveConfig()
    ├─ Zod validation (backend)
    ├─ Create backup (config.backup.json)
    └─ Write config.json
    ↓
Response: { success: true, needsRestart: true }
    ↓
Frontend displays success toast + "Restart Required" alert
    ↓
User clicks Restart button
    ↓
POST /api/system/restart
    ↓
RestartService performs graceful shutdown
    ↓
Process exits (systemd/pm2 restarts automatically)
```

### File Organization Patterns

**Configuration Files:**

- **Root Level**: `pnpm-workspace.yaml`, `package.json`, `tsconfig.json`
- **Environment**: `.env` (gitignored), `.env.example` (template)
- **Build**: `tsup.config.ts` (backend), `vite.config.ts` (frontend)
- **Testing**: `vitest.config.ts` (root, shared across all packages)

**Source Organization:**

- **Feature-Based**: Backend organized by feature (config/, services/, routes/)
- **Layer-Based**: Frontend organized by layer (routes/, components/, hooks/, services/)
- **Shared Types**: Consolidated in `packages/shared/src/`

**Test Organization:**

- **Mirror Structure**: Tests mirror source structure
  - `packages/backend/src/config/` → `packages/backend/test/unit/config/`
  - `packages/frontend/src/components/` → `packages/frontend/test/unit/components/`
- **Test Types**: Unit (test/), Integration (test/integration/), E2E (test/e2e/) (future)

**Asset Organization:**

- **Frontend Static**: `packages/frontend/public/` (images, favicon, etc.)
- **Backend Static**: Backend serves frontend build from `public/` (production)
- **Config Files**: Root level `config.json` (managed by ConfigService)

### Development Workflow Integration

**Development Server Structure:**

- **Frontend Dev Server**: Vite dev server (port 5173)
  - Proxies `/api/*` requests to backend
  - Hot Module Replacement (HMR) for fast UI development

- **Backend Dev Server**: Express on port 3000
  - `tsx watch` for auto-reload on code changes
  - Serves API endpoints

**Build Process Structure:**

1. **Shared Package**: `pnpm --filter shared build` → `dist/`
2. **Backend Package**: `pnpm --filter backend build` → `dist/`
3. **Frontend Package**: `pnpm --filter frontend build` → `public/`
4. **Root Build Command**: `pnpm build` executes all three in order

**Deployment Structure:**

- **Production Mode**: Single Node.js/Bun process
- **Static Files**: Express serves frontend build from `public/`
- **API Endpoints**: Express serves `/api/*` routes
- **Port Configuration**: Configurable via `PORT` env var (default: 3000)
- **Process Management**: systemd service or pm2 for auto-restart

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All technology choices work together without conflicts:
- ✅ Node.js >=22.0.0 + TypeScript 5.9.3 + Express 5.x fully compatible
- ✅ React 18.x + Vite 6.x + TanStack Router + TanStack Query modern ecosystem
- ✅ Zod 4.2.1 shared between frontend and backend with consistent versioning
- ✅ XState 5.12.1 integration properly defined with service layer abstraction

**Pattern Consistency:**

Implementation patterns fully support architectural decisions:
- ✅ Monorepo (pnpm) enables shared Zod schemas as designed
- ✅ Service layer abstraction cleanly interfaces with XState actors
- ✅ TanStack Query polling pattern supports device status queries (5-second interval defined)
- ✅ React Hook Form + Zod frontend validation mirrors backend validation using same schemas

**Structure Alignment:**

Project structure enables all architectural decisions:
- ✅ Monorepo structure supports shared package (packages/shared/)
- ✅ Service layer abstraction reflected in separate service classes (ConfigService, DeviceStatusService)
- ✅ TanStack Router file-based routing structure (packages/frontend/src/routes/)
- ✅ Test structure mirrors source code (test/unit/, test/integration/)

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

All epics have architectural support:
- ✅ **Configuration Management** (FR-001, FR-002, FR-003, FR-004, FR-005)
  - Frontend: ConfigForm.tsx, NetworkConfigForm.tsx
  - Backend: config.service.ts, config.routes.ts
  - Shared: config.schema.ts (Zod validation)
- ✅ **Device Status Monitoring** (FR-001)
  - Frontend: DeviceStatusDashboard.tsx, use-device-status.ts hook
  - Backend: device-status.service.ts, status.routes.ts
  - Integration: TanStack Query 5-second polling
- ✅ **System Control** (restart functionality)
  - Frontend: Restart button UI
  - Backend: restart.service.ts, system.routes.ts
- ✅ **Configuration Import/Export** (FR-008)
  - Backend: config-import-export.service.ts
- ✅ **Configuration History** (FR-009)
  - Backend: config-history.service.ts with file backup strategy
- ✅ **Configuration Templates** (FR-010)
  - Backend: config-templates.service.ts

**Functional Requirements Coverage:**

All high-priority FRs architecturally supported:
- ✅ FR-001: Display current configuration → Main config page, TanStack Query data fetching
- ✅ FR-002: Modify application settings → ConfigForm with real-time validation
- ✅ FR-003: Modify network settings → NetworkConfigForm with Zod schema validation
- ✅ FR-004: Validate before save → Dual-layer Zod validation (frontend + backend)
- ✅ FR-005: Save to config.json → ConfigService.saveConfig() with atomic writes
- ✅ FR-006: Authentication → auth.middleware.ts (optional, post-MVP)
- ✅ FR-007: Visual feedback → shadcn/ui Toast, TanStack Query loading states
- ✅ FR-008: Import/export → config-import-export.service.ts
- ✅ FR-009: Configuration history → config-history.service.ts
- ✅ FR-011: Display config errors → Form validation errors + API error responses
- ✅ FR-012: Test network config → /api/system/test-connection endpoint

**Non-Functional Requirements Coverage:**

All NFRs addressed architecturally:
- ✅ **Performance: <3 second load time** → Vite optimization, TanStack Query caching
- ✅ **Validation accuracy: 100%** → Dual-layer Zod validation (frontend + backend)
- ✅ **System availability: 99.9%** → Graceful error handling, backup mechanisms
- ✅ **Technology compatibility** → All versions verified compatible
- ✅ **Integration** → Service layer abstraction, XState integration patterns defined
- ✅ **Accessibility: WCAG 2.1 AA** → shadcn/ui components ARIA compliant

### Implementation Readiness Validation ✅

**Decision Completeness:**

All critical decisions documented with versions:
- ✅ Technology stack fully specified with version numbers
- ✅ Implementation patterns cover 8 categories (naming, structure, format, communication, process)
- ✅ Consistency rules clear and enforceable (naming conventions, API patterns, error handling)
- ✅ Examples provided for all major patterns (API client, form validation, error handling)

**Structure Completeness:**

Project structure is complete and specific:
- ✅ Complete directory tree defined to file level
- ✅ All integration points clearly specified (API boundaries, service boundaries, data boundaries)
- ✅ Component boundaries well-defined (frontend component communication, state management)

**Pattern Completeness:**

Implementation patterns are comprehensive:
- ✅ Naming conventions: API endpoints (kebab-case), code (camelCase/PascalCase), files (kebab-case/PascalCase)
- ✅ Communication patterns: Frontend-backend HTTP REST, error object shape, event communication
- ✅ Process patterns: Error handling, loading states, form validation, configuration save flow

### Gap Analysis Results

**Critical Gaps: None**

All required architectural elements are defined. No blocking gaps identified.

**Important Gaps: None**

Architecture is sufficiently detailed for implementation. All patterns and decisions are ready.

**Nice-to-Have Gaps (Optional Enhancements):**

1. **Development Workflow Scripts Enhancement**
   - Could add convenience scripts (e.g., `pnpm dev:all` to start all services)
   - Does not block implementation, current scripts are sufficient

2. **Test Coverage Targets**
   - Could define specific test coverage goals (e.g., 80% coverage)
   - Current test structure supports complete testing strategy

3. **Performance Monitoring Tools**
   - Could add performance monitoring tool configuration
   - Pino logging provides sufficient observability for MVP

**Conclusion: Architecture is ready for implementation with no blocking gaps.**

### Validation Issues Addressed

No critical issues found during validation. The architecture is coherent, complete, and ready to guide AI agents through consistent implementation.

Minor optional enhancements identified above can be addressed post-MVP if needed.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low-medium complexity, local deployment)
- [x] Technical constraints identified (TypeScript 5.9.3, Node.js >=22.0.0, Zod 4.2.1, XState 5.12.1)
- [x] Cross-cutting concerns mapped (validation, state sync, error handling, simplified security)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (Express, TanStack Router, TanStack Query, pnpm monorepo)
- [x] Integration patterns defined (service layer abstraction, XState integration)
- [x] Performance considerations addressed (Vite optimization, TanStack Query caching)

**✅ Implementation Patterns**

- [x] Naming conventions established (API, code, file naming)
- [x] Structure patterns defined (monorepo organization, file placement)
- [x] Communication patterns specified (API response format, error handling, event system)
- [x] Process patterns documented (error handling, loading states, form validation)

**✅ Project Structure**

- [x] Complete directory structure defined (packages/backend, packages/frontend, packages/shared)
- [x] Component boundaries established (API boundaries, service boundaries, data boundaries)
- [x] Integration points mapped (frontend-backend HTTP, backend-XState actor queries)
- [x] Requirements to structure mapping complete (all FRs mapped to specific files/directories)

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** High based on comprehensive validation results

**Key Strengths:**

1. **Technology Coherence**: All choices are modern, well-maintained, and fully compatible
2. **Validation Excellence**: Dual-layer Zod validation ensures 100% accuracy
3. **Shared Architecture**: Monorepo with shared schemas eliminates duplication
4. **Clear Boundaries**: Service layer abstraction provides clean separation of concerns
5. **Implementation Readiness**: Detailed patterns and structure enable consistent AI implementation
6. **XState Integration**: Properly defined integration with existing state machine architecture
7. **Simplified Security**: Appropriate for local deployment, avoids over-engineering

**Areas for Future Enhancement:**

1. **Authentication** (Post-MVP): Add simple password protection if needed
2. **Configuration History UI** (Post-MVP): Add history list view with rollback functionality
3. **WebSocket vs Polling** (Post-MVP): Could upgrade from polling to WebSocket for real-time updates
4. **External Backup** (Post-MVP): Could add S3/FTP backup integration
5. **Advanced Monitoring** (Post-MVP): Could add metrics collection and dashboards

### Implementation Handoff

**AI Agent Guidelines:**

1. **Follow all architectural decisions exactly as documented**
   - Use specified versions for all dependencies
   - Implement services according to defined patterns
   - Respect project structure and boundaries

2. **Use implementation patterns consistently across all components**
   - Follow naming conventions (API endpoints, code, files)
   - Apply API response format uniformly
   - Implement error handling as specified

3. **Respect project structure and boundaries**
   - Place files in defined directories
   - Use service layer for backend logic
   - Query XState actors through DeviceStatusService, not directly

4. **Refer to this document for all architectural questions**
   - Check patterns before implementing new features
   - Verify integration points match documentation
   - Ensure all code follows consistency rules

**First Implementation Priority:**

**Phase 1: Monorepo Setup**

Initialize pnpm workspace and create package structure:

```bash
# 1. Create pnpm workspace configuration
cat > pnpm-workspace.yaml << 'WORKSPACE_EOF'
packages:
  - 'packages/*'
WORKSPACE_EOF

# 2. Create shared package
mkdir -p packages/shared/src/{schemas,types}
cd packages/shared
pnpm init
# Add dependencies: zod, typescript
# Configure package.json with exports
# Create Zod schemas in src/schemas/

# 3. Create backend package
mkdir -p packages/backend/src/{config,routes,services,middleware}
cd packages/backend
pnpm init
# Add dependencies: express, zod, @node-switch/shared, pino
# Create ConfigService, Express app, API routes

# 4. Create frontend package
npm create vite@latest packages/frontend -- --template react-ts
cd packages/frontend
# Add dependencies: @tanstack/react-router, @tanstack/react-query, react-hook-form, @hookform/resolvers
# Install shadcn/ui
# Configure TanStack Router file-based routing
# Create ConfigForm component with react-hook-form + Zod

# 5. Configure root package.json scripts
# "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\""
# "build": "pnpm --filter shared build && pnpm --filter backend build && pnpm --filter frontend build"
# "start": "pnpm --filter backend start"
```

**Expected Outcome:** After Phase 1, the monorepo structure will be ready, shared Zod schemas will be available to both frontend and backend, and the basic Express server + Vite frontend will be runnable.
