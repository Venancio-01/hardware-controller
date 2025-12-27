# Story 4.4: Implement Configuration Import

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Admin,
I want to import a configuration file,
So I can quickly set up a new replacement device.

## Acceptance Criteria

1. **Given** A user with a valid `config.json` file
   **When** They upload it via the Import interface
   **Then** The backend validates the JSON structure and schema
   **And** If valid, overwrites the current config and triggers a restart

2. **Given** An invalid file is uploaded
   **When** Validation fails
   **Then** The file is rejected with a specific error message

## Tasks / Subtasks

- [x] **Task 1: Verify Backend Import Service**
  - [x] Confirm `ConfigImportExportService.importConfig()` exists in `packages/backend/src/services/config-import-export.service.ts`
  - [x] Verify it accepts JSON payload and validates against Zod schema
  - [x] Ensure proper error handling for malformed JSON and schema violations
  - [x] Verify atomic file write pattern (write to temp, then rename)

- [x] **Task 2: Verify Backend API Route**
  - [x] Confirm `POST /api/config/import` exists in `packages/backend/src/routes/config.routes.ts`
  - [x] Verify authentication middleware is applied
  - [x] Ensure proper error responses (400 for invalid JSON, 422 for schema violations)

- [x] **Task 3: Implement Frontend Import Hook**
  - [x] Update `useImportExportConfig` hook in `packages/frontend/src/hooks/useImportExportConfig.ts`
  - [x] Add file upload mutation using TanStack Query
  - [x] Handle file input change event
  - [x] Add validation for file type (only .json files)

- [x] **Task 4: Implement Frontend Import UI**
  - [x] Add "Import Configuration" button to ConfigForm
  - [x] Create file input (hidden, triggered by button)
  - [x] Show loading state during import
  - [x] Display success/error toast notifications
  - [x] Add confirmation dialog before applying import

- [x] **Task 5: Testing**
  - [x] Unit test for import service (if not exists)
  - [x] Manual verification of file upload and import
  - [x] Test with invalid JSON (malformed)
  - [x] Test with valid JSON but schema violations
  - [x] Verify config file is properly overwritten
  - [x] Verify restart is triggered after successful import

## Dev Notes

### Implementation Status: BACKEND ALREADY COMPLETE

The backend functionality for configuration import is already fully implemented:
- `ConfigImportExportService.importConfig()` in `packages/backend/src/services/config-import-export.service.ts`
- `POST /api/config/import` endpoint in `packages/backend/src/routes/config.routes.ts`

**Only frontend work is needed:**
1. Update `useImportExportConfig` hook to add import functionality
2. Add import button and file input to ConfigForm
3. Handle file upload and error display

### Technical Requirements

- **HTTP Method**: POST request to `/api/config/import`
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT token)
- **Request Body**: Raw JSON configuration (same schema as current config)
- **Error Handling**:
  - 400: Malformed JSON
  - 422: Schema validation errors (Zod)
  - 401: Unauthorized

### Architecture Compliance

- **Shared Schemas**: Use `configSchema` from `packages/shared` for validation
- **Service Pattern**: Follow existing `ConfigImportExportService` singleton pattern
- **Error Handling**: Use Zod errors for validation failures
- **Frontend Hooks**: Use TanStack Query for API mutations
- **File Upload**: Use standard `<input type="file">` with hidden input pattern

### File Structure Requirements

| File | Status | Description |
|------|--------|-------------|
| `packages/backend/src/services/config-import-export.service.ts` | Complete | Import service (already exists) |
| `packages/backend/src/routes/config.routes.ts` | Complete | API endpoint (already exists) |
| `packages/frontend/src/hooks/useImportExportConfig.ts` | Update | Add import mutation hook |
| `packages/frontend/src/components/dashboard/ConfigForm.tsx` | Update | Add import button and file input |
| `packages/frontend/src/services/config-api.ts` | Update | Add importConfig function |

### API Contract

**Request** (`POST /api/config/import`):
```
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
<JSON config content - same structure as GET /api/config response>
```

**Success Response**:
```json
Status: 200 OK
{
  "success": true,
  "message": "配置导入成功，系统将在 3 秒后重启"
}
```

**Error Responses**:
```json
// 400 - Malformed JSON
{
  "success": false,
  "error": "配置文件格式错误：无法解析 JSON"
}

// 422 - Schema validation errors
{
  "success": false,
  "error": "配置验证失败",
  "validationErrors": {
    "network.ip": ["Invalid IP address format"],
    "network.port": ["Port must be between 1-65535"]
  }
}

// 401 - Unauthorized
{
  "success": false,
  "error": "未授权访问"
}
```

### Frontend Implementation Guide

**API Service Pattern** (`config-api.ts`):
```typescript
import { api } from '@/lib/api';

export async function importConfig(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/config/import', {
    body: formData,
    headers: {
      // Don't set Content-Type - let browser set multipart/form-data boundary
    },
  });

  return response.data;
}
```

**Hook Pattern** (`useImportExportConfig.ts`):
```typescript
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export function useImportExportConfig() {
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      // Read file as text
      const text = await file.text();

      // Validate JSON
      let config: unknown;
      try {
        config = JSON.parse(text);
      } catch (err) {
        throw new Error('配置文件格式错误：无法解析 JSON');
      }

      // Send to backend
      const response = await api.post('/api/config/import', {
        json: config,
      });

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '导入成功',
        description: data.message || '配置已导入，系统将重启',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '导入失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    importConfig: importMutation.mutate,
    isImporting: importMutation.isPending,
  };
}
```

**UI Integration** (`ConfigForm.tsx`):
```tsx
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useImportExportConfig } from '@/hooks/useImportExportConfig';
import { useRef } from 'react';

// In component:
const fileInputRef = useRef<HTMLInputElement>(null);
const { importConfig, isImporting } = useImportExportConfig();

const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    toast({
      title: '文件类型错误',
      description: '请选择 JSON 格式的配置文件',
      variant: 'destructive',
    });
    return;
  }

  importConfig(file);

  // Reset input
  event.target.value = '';
};

<Button
  variant="outline"
  onClick={() => fileInputRef.current?.click()}
  disabled={isImporting}
>
  <Upload className="mr-2 h-4 w-4" />
  {isImporting ? '导入中...' : '导入配置'}
</Button>

<input
  ref={fileInputRef}
  type="file"
  accept=".json,application/json"
  onChange={handleFileSelect}
  className="hidden"
/>
```

### Validation Flow

1. **Client-side validation** (optional, for UX):
   - Check file extension (.json)
   - Check file size (prevent huge files)
   - Try to parse JSON (catch syntax errors early)

2. **Server-side validation** (required):
   - Parse JSON body
   - Validate against `configSchema` from shared package
   - Return detailed validation errors if schema violations found
   - Write to temp file first, then rename (atomic write)

3. **Post-import actions**:
   - Backend should trigger restart after successful import
   - Frontend should show toast notification
   - Frontend should show loading state during restart

### References

- [Source: packages/backend/src/services/config-import-export.service.ts](../../packages/backend/src/services/config-import-export.service.ts)
- [Source: packages/backend/src/routes/config.routes.ts](../../packages/backend/src/routes/config.routes.ts)
- [Source: packages/shared/src/schemas/config.schema.ts](../../packages/shared/src/schemas/config.schema.ts)
- [Source: Story 4.3 - Configuration Export](./4-3-implement-configuration-export.md) (preceding story)

### Previous Story Intelligence

**From Story 4.3 (Configuration Export)**:
- Export button already implemented in ConfigForm
- `useImportExportConfig` hook created with `exportConfig` function
- Toast notifications pattern established
- API service pattern in `config-api.ts`
- `ApiError` class for error handling
- Time-stamped filename pattern for exports

**From Story 4.1 (Network Configuration)**:
- Config form uses Shadcn/ui components
- Real-time validation with Zod and react-hook-form
- Warning dialogs for destructive operations

**From Story 4.2 (Network Connection Test)**:
- API mutation pattern with TanStack Query
- Button loading states during async operations
- Error handling with toast notifications

### Git Intelligence

**Recent Relevant Commits**:
- Export configuration implementation with time-stamped filenames
- Config API service with authentication support
- Config form updates with import/export buttons
- Unit tests for config-api service

**Code Patterns Established**:
- Use Shadcn/ui `Button`, `Toast`, `AlertDialog` components
- TanStack Query mutations for API calls
- Zod schema validation in shared package
- Atomic file write pattern in backend services
- Hidden file input pattern for file uploads

### Testing Requirements

1. **Unit Tests** (if not exists):
   - Test `importConfig()` method validates JSON
   - Test error handling for malformed JSON
   - Test schema validation errors

2. **Integration Tests**:
   - Test API endpoint with valid config
   - Test API endpoint rejects invalid config
   - Test authentication requirement

3. **Manual Testing**:
   - Upload valid JSON file → should import and restart
   - Upload invalid JSON file → should show error
   - Upload valid JSON with schema violations → should show specific errors
   - Test with unauthenticated user → should fail with 401
   - Verify config file is actually updated after import
   - Verify system restarts after successful import

### Security Considerations

- **Authentication**: Import endpoint requires valid JWT token
- **File Size**: Limit upload size (Express body parser limit)
- **Schema Validation**: Always validate against Zod schema on server
- **Sensitive Data**: Config may contain passwords/API keys
- **File Overwrite**: Import overwrites existing config - consider warning user
- **Restart Trigger**: Import triggers automatic restart - warn user about downtime

### User Experience Flow

```
User clicks "Import Configuration"
  ↓
Hidden file input triggers (accepts .json only)
  ↓
User selects file from filesystem
  ↓
Frontend reads file and sends to backend
  ↓
Backend validates JSON structure
  ↓
Backend validates against Zod schema
  ↓
If validation passes:
  - Write to temp file
  - Atomic rename to config.json
  - Trigger restart
  - Return success response
  ↓
Frontend shows success toast
  ↓
Frontend shows "Restarting..." state
  ↓
System restarts and reconnects
```

If validation fails at any point:
  - Return specific error message
  - Frontend shows error toast
  - No changes to system

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- **Backend Already Complete**: The `ConfigImportExportService` class in `packages/backend/src/services/config-import-export.service.ts` already has a complete `importConfig()` method that validates and imports configuration files.
- **API Endpoint Exists**: The `POST /api/config/import` endpoint in `packages/backend/src/routes/config.routes.ts` is already implemented with proper authentication and validation.
- **Frontend Work Only**: Only frontend implementation is needed:
  1. Update `useImportExportConfig` hook to add import mutation
  2. Add import button and hidden file input to ConfigForm component
  3. Handle file upload and error display
- **Error Handling**: Backend already handles 400 (malformed JSON) and 422 (schema validation) errors with detailed error messages.
- **Authentication**: The route is protected by authentication middleware.
- **Restart Behavior**: Backend triggers automatic restart after successful import - frontend should handle this gracefully.
- **File Input Pattern**: Use hidden `<input type="file">` triggered by button click - established pattern from Story 4.3 export.

### File List

**Backend (已存在，无需修改):**
- packages/backend/src/services/config-import-export.service.ts (已存在，完整)
- packages/backend/src/routes/config.routes.ts (已存在，完整)

**Frontend - 配置导入功能:**
- packages/frontend/src/hooks/useImportExportConfig.ts (更新 - 添加 import mutation 和确认对话框)
- packages/frontend/src/services/config-api.ts (更新 - 添加 importConfig 函数)
- packages/frontend/src/components/dashboard/ConfigForm.tsx (更新 - 添加导入按钮和确认对话框)
- packages/frontend/src/lib/errors.ts (新增 - ApiError 类用于统一错误处理)

**Frontend - 关联更新 (配合导入功能):**
- packages/frontend/src/hooks/useUpdateConfig.ts (更新 - 配合导入后的配置刷新)
- packages/frontend/src/lib/api.ts (更新 - apiFetch 认证处理)

**Shared Schema - 类型定义:**
- packages/shared/src/schemas/network.schema.ts (更新 - 网络配置 Schema)

**测试:**
- packages/frontend/src/components/dashboard/__tests__/ConfigForm.test.tsx (更新 - 添加导入流程测试)
- packages/shared/src/schemas/__tests__/network.schema.test.ts (更新 - 网络配置验证测试)
