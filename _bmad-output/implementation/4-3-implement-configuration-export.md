# Story 4.3: Implement Configuration Export

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Admin,
I want to export the current configuration to a file,
So I can backup my settings.

## Acceptance Criteria

1. **Given** An authenticated user
   **When** They click the "Export Configuration" button
   **Then** The browser downloads a `config.json` file
   **And** The file contains the current running configuration

## Tasks / Subtasks

- [x] **Task 1: Verify Backend Export Service**
  - [x] Confirm `ConfigImportExportService.exportConfig()` exists in `packages/backend/src/services/config-import-export.service.ts`
  - [x] Verify it reads current config and returns JSON string
  - [x] Ensure proper error handling for missing/invalid config

- [x] **Task 2: Verify Backend API Route**
  - [x] Confirm `GET /api/config/export` exists in `packages/backend/src/routes/config.routes.ts`
  - [x] Verify it sets correct Content-Type and Content-Disposition headers
  - [x] Ensure authentication middleware is applied

- [x] **Task 3: Implement Frontend Export Hook**
  - [x] Create `useExportConfig` hook in `packages/frontend/src/hooks/useExportConfig.ts`
  - [x] Use TanStack Query mutation for API call
  - [x] Handle blob download with proper filename

- [x] **Task 4: Implement Frontend Export Button**
  - [x] Add "Export Configuration" button to ConfigForm or appropriate location
  - [x] Use Shadcn/ui Button component
  - [x] Show loading state during export
  - [x] Display success toast on completion

- [x] **Task 5: Testing**
  - [x] Unit test for export service (if not exists)
  - [x] Manual verification of file download
  - [x] Verify exported JSON structure matches schema

## Dev Notes

### Implementation Status: BACKEND ALREADY COMPLETE

The backend functionality for configuration export is already fully implemented:
- `ConfigImportExportService.exportConfig()` in `packages/backend/src/services/config-import-export.service.ts`
- `GET /api/config/export` endpoint in `packages/backend/src/routes/config.routes.ts`

**Only frontend work is needed:**
1. Create `useExportConfig` hook
2. Add export button to UI
3. Handle file download in browser

### Technical Requirements

- **HTTP Method**: GET request to `/api/config/export`
- **Response Headers**:
  - `Content-Type: application/json`
  - `Content-Disposition: attachment; filename="config.json"`
- **Authentication**: Required (JWT token)
- **Error Handling**:
  - 404: Config file doesn't exist
  - 400: Invalid config format (Zod validation error)

### Architecture Compliance

- **Shared Schemas**: Use `configSchema` from `packages/shared` for validation
- **Service Pattern**: Follow existing `ConfigImportExportService` singleton pattern
- **Error Handling**: Use Zod errors for validation failures
- **Frontend Hooks**: Use TanStack Query for API mutations

### File Structure Requirements

| File | Status | Description |
|------|--------|-------------|
| `packages/backend/src/services/config-import-export.service.ts` | Complete | Export service (already exists) |
| `packages/backend/src/routes/config.routes.ts` | Complete | API endpoint (already exists) |
| `packages/frontend/src/hooks/useExportConfig.ts` | New | Export mutation hook |
| `packages/frontend/src/components/dashboard/ConfigForm.tsx` | Update | Add export button |

### API Contract

**Request** (`GET /api/config/export`):
```
Headers:
  Authorization: Bearer <token>
```

**Success Response**:
```
Status: 200 OK
Headers:
  Content-Type: application/json
  Content-Disposition: attachment; filename="config.json"

Body:
<JSON config content>
```

**Error Responses**:
```json
// 404 - Config file not found
{
  "success": false,
  "error": "配置文件不存在，无法导出"
}

// 400 - Invalid config format
{
  "success": false,
  "error": "配置文件格式无效",
  "validationErrors": { ... }
}
```

### Frontend Implementation Guide

**Hook Pattern** (`useExportConfig.ts`):
```typescript
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export function useExportConfig() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/config/export', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    },
    onSuccess: () => {
      toast({
        title: '导出成功',
        description: '配置文件已下载',
      });
    },
    onError: (error) => {
      toast({
        title: '导出失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

**UI Integration** (`ConfigForm.tsx`):
```tsx
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useExportConfig } from '@/hooks/useExportConfig';

// In component:
const exportConfig = useExportConfig();

<Button
  variant="outline"
  onClick={() => exportConfig.mutate()}
  disabled={exportConfig.isPending}
>
  <Download className="mr-2 h-4 w-4" />
  {exportConfig.isPending ? '导出中...' : '导出配置'}
</Button>
```

### References

- [Source: packages/backend/src/services/config-import-export.service.ts](../../packages/backend/src/services/config-import-export.service.ts)
- [Source: packages/backend/src/routes/config.routes.ts](../../packages/backend/src/routes/config.routes.ts)
- [Source: packages/shared/src/schemas/config.schema.ts](../../packages/shared/src/schemas/config.schema.ts)
- [Source: Story 4.1 - Network Configuration](./4-1-manage-network-configuration.md) (preceding story)

### Previous Story Intelligence

**From Story 4.1 (Network Configuration)**:
- Network configuration form uses `NetworkConfigForm.tsx` component
- Config form integration in `ConfigForm.tsx` uses Shadcn/ui components
- Real-time validation patterns with Zod and react-hook-form
- Toast notifications for user feedback using `use-toast` hook

**From Story 4.2 (Network Connection Test)**:
- API mutation pattern with TanStack Query
- Button loading states during async operations
- Error handling with toast notifications

### Git Intelligence

**Recent Relevant Commits**:
- Network configuration warning dialog implementation
- Connection test service and API endpoint
- Config form updates with network field detection

**Code Patterns Established**:
- Use Shadcn/ui `Button`, `AlertDialog`, `Toast` components
- TanStack Query mutations for API calls
- Zod schema validation in shared package
- Atomic file write pattern in backend services

### Testing Requirements

1. **Unit Tests** (if not exists):
   - Test `exportConfig()` method returns valid JSON
   - Test error handling for missing config file

2. **Integration Tests**:
   - Test API endpoint returns correct headers
   - Test authentication requirement

3. **Manual Testing**:
   - Click export button and verify file downloads
   - Verify downloaded JSON matches current config
   - Test with unauthenticated user (should fail)

### Security Considerations

- **Authentication**: Export endpoint requires valid JWT token
- **Sensitive Data**: Config file may contain sensitive information (IPs, passwords)
- **File Naming**: Consider adding timestamp to exported filename for version tracking

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- **Backend Already Complete**: The `ConfigImportExportService` class in `packages/backend/src/services/config-import-export.service.ts` already has a complete `exportConfig()` method that reads the current configuration and returns it as a JSON string.
- **API Endpoint Exists**: The `GET /api/config/export` endpoint in `packages/backend/src/routes/config.routes.ts` is already implemented with proper headers (`Content-Type: application/json`, `Content-Disposition: attachment; filename="config.json"`).
- **Frontend Work Only**: Only frontend implementation is needed:
  1. Create `useExportConfig` hook for API mutation
  2. Add export button to ConfigForm component
  3. Handle blob download in browser
- **Error Handling**: Backend already handles 404 (config not found) and 400 (invalid config) errors appropriately.
- **Authentication**: The route is protected by authentication middleware (as are all config routes).

### File List

- packages/backend/src/services/config-import-export.service.ts (已存在，完整)
- packages/backend/src/routes/config.routes.ts (已存在，完整)
- packages/frontend/src/hooks/useImportExportConfig.ts (新增 - 合并导入/导出功能的 hook)
- packages/frontend/src/services/config-api.ts (新增 - 配置导入/导出 API 服务)
- packages/frontend/src/components/dashboard/ConfigForm.tsx (更新 - 添加导入/导出按钮和 loading 状态)
- packages/frontend/src/lib/errors.ts (新增 - ApiError 类)
- packages/frontend/src/services/config-api.test.ts (新增 - API 服务单元测试)

## Change Log

### 2025-12-27 - Code Review & Fixes Applied

**Status**: Review Complete → Done

**Issues Found and Fixed:**
1. ✅ **[HIGH]** 导出文件名添加时间戳 - 现在使用 `config-YYYY-MM-DD.json` 格式
2. ✅ **[HIGH]** 导出/导入按钮添加 loading 状态 - 显示"导出中..."/"导入中..."并禁用按钮
3. ✅ **[HIGH]** 添加认证支持 - exportConfig 现在使用与 apiFetch 一致的认证模式（401 处理、token 管理）
4. ✅ **[MEDIUM]** 添加单元测试 - 创建了 `config-api.test.ts` (12/12 测试通过)
5. ✅ **[MEDIUM]** 更新 File List - 反映实际变更的文件

**Files Modified:**
- `packages/frontend/src/services/config-api.ts` - 添加时间戳文件名、认证支持、错误处理
- `packages/frontend/src/hooks/useImportExportConfig.ts` - 添加 isExporting/isImporting 状态
- `packages/frontend/src/components/dashboard/ConfigForm.tsx` - 添加 loading 状态显示

**Files Added:**
- `packages/frontend/src/services/config-api.test.ts` - 12 个测试全部通过

**Tests:** ✅ All config-api tests passing (12/12)

### 2025-12-27 - Story 4.3 Creation

**Status**: Ready for Dev

**Analysis Summary**:
- Backend functionality already complete in existing services
- API endpoint `GET /api/config/export` fully functional
- Only frontend UI implementation required

**Next Steps**:
1. Create `useExportConfig` hook with TanStack Query
2. Add export button to ConfigForm component
3. Implement blob download handling
4. Add loading states and toast notifications
