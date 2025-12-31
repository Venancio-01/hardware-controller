# UI Component Inventory - Frontend

## Component Overview

Total components: **40+** organized by feature area

## UI Components (src/components/ui/)

Base components from **Radix UI** - Headless, accessible primitives.

### Form Components
| Component | File | Purpose |
|-----------|------|---------|
| Input | `input.tsx` | Text input field |
| Textarea | `textarea.tsx` | Multi-line text input |
| Select | `select.tsx` | Dropdown selection |
| Combobox | `combobox.tsx` | Searchable dropdown |
| Label | `label.tsx` | Form labels |
| Form | `form.tsx` | Form composition with React Hook Form |

### Layout Components
| Component | File | Purpose |
|-----------|------|---------|
| Card | `card.tsx` | Card container |
| Separator | `separator.tsx` | Visual divider |
| Skeleton | `skeleton.tsx` | Loading placeholder |

### Feedback Components
| Component | File | Purpose |
|-----------|------|---------|
| Alert | `alert.tsx` | Inline alerts |
| AlertDialog | `alert-dialog.tsx` | Modal confirmations |
| Sonner (Toast) | `sonner.tsx` | Toast notifications |
| Badge | `badge.tsx` | Status badges |

### Navigation/Interaction
| Component | File | Purpose |
|-----------|------|---------|
| Button | `button.tsx` | Button with variants |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Dropdown Menu | `dropdown-menu.tsx` | Context menus |
| Dialog | `dialog.tsx` | Modal dialogs |
| Popover | `popover.tsx` | Floating content |
| Command | `command.tsx` | Command palette |

## Feature Components

### Authentication (`src/components/auth/`)
| Component | Purpose |
|-----------|---------|
| `LoginStatusPanel` | Display user login status |

### Configuration (`src/components/config/`)
| Component | Purpose |
|-----------|---------|
| `NetworkConfigForm` | Network settings form |
| `HardwareConfigForm` | Hardware configuration form |
| `AmmoCabinetConfigForm` | Ammo cabinet settings |
| `ControlCabinetConfigForm` | Control cabinet settings |

### Dashboard (`src/components/dashboard/`)
| Component | Purpose |
|-----------|---------|
| `ConfigForm` | Main configuration form |
| `AppConfigCard` | Application config display |

### Layout (`src/components/layout/`)
| Component | Purpose |
|-----------|---------|
| `HeaderActions` | Header action buttons |
| `Sidebar` | Navigation sidebar |

### System (`src/components/system/`)
| Component | Purpose |
|-----------|---------|
| `CoreStatusBadge` | Display core process status |
| `RestartCoreButton` | Restart core process button |

## Component Architecture

### Design System
- **Base:** Radix UI primitives (unstyled, accessible)
- **Styling:** Tailwind CSS utilities
- **Theming:** CSS variables for light/dark mode
- **Icons:** Lucide React, Tabler Icons

### Component Patterns

#### 1. Controlled Components (Forms)
```typescript
// React Hook Form + Zod validation
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('fieldName')} />
</form>
```

#### 2. Composition Pattern (UI Components)
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### 3. Render Props / Children (Layout)
```typescript
<TooltipProvider>
  <HeaderActionsContainer />
</TooltipProvider>
```

## State Management

### React Query (Server State)
- Used for API calls
- Caching and automatic refetching
- Managed in `src/services/`

### React Context (Global State)
- `AuthContext` (`src/contexts/auth.context.tsx`)
- User authentication state
- Token management

### Local State (Component State)
- Form state (React Hook Form)
- UI state (open/close, active tabs)

## Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useCheckConflict` | Check for configuration conflicts |
| `useSerialPorts` | Get available serial ports |
| `useRestartSystem` | Restart core process |
| `useImportExportConfig` | Config import/export |
| `useCoreStatus` | Get core process status |
| `useApplyNetwork` | Apply network configuration |
| `useUpdateConfig` | Update configuration |
| `useAutoReconnect` | Auto-reconnect logic |

## Routes (`src/routes/`)

### File-Based Routing (TanStack Router)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `__root.tsx` + `_auth.index.tsx` | Dashboard (protected) |
| `/login` | `login.tsx` | Login page (public) |
| `_auth` | `_auth.tsx` | Auth layout wrapper |

### Route Protection
- Root route has `beforeLoad` check for authentication
- Unauthenticated users redirected to `/login`
- Login page excluded from auth check

## Shared Types

Configuration types imported from `shared` package:
- `Config` - Main configuration type
- Schema definitions from `shared/src/schemas/`

## Testing

### Test Files
- `*.test.tsx` - Component tests (Vitest + Testing Library)
- `src/test/setup.ts` - Test configuration

### Test Coverage
- Core components have test files
- Mock data in `__tests__/` directories
