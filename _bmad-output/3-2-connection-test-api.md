# Story 3.2: 实现连接测试 API (Connection Test API)

Status: done
Story: 3.2
Epic: 3

## Story

**As a** 系统管理员 (System Administrator),
**I want** 在保存前测试新配置的连接性,
**So that** 我可以确保新配置能够正常工作。

## Acceptance Criteria

1. **API 端点 (API Endpoint)**
   - 后端提供 `POST /api/system/test-connection` 端点。
   - 接收测试参数（IP 地址、端口等）作为请求体。
   - 返回测试结果和延迟时间。

2. **连接测试逻辑 (Connection Test Logic)**
   - 支持测试 TCP/UDP 连接可达性。
   - 对于 TCP，尝试建立连接并立即关闭。
   - 对于 UDP，发送测试数据包并等待响应（如果适用）。
   - 测试超时时间应合理（例如 5 秒）。

3. **前端集成 (Frontend Integration)**
   - 在网络配置表单中添加"测试连接"按钮。
   - 点击按钮时，使用当前表单值调用后端 API。
   - 显示测试结果（成功/失败）和延迟时间。

4. **错误处理 (Error Handling)**
   - 测试失败时应提供明确的错误信息。
   - 应处理超时、连接拒绝等情况。
   - 前端应以用户友好的方式显示错误。

## Developer Context

> **⚠️ CRITICAL WARNING**: This API touches **network connectivity** functionality. Ensure proper timeout handling to prevent hanging requests and system unresponsiveness.

### 1. Architecture & File Structure

This implementation spans the full stack and requires strict adherence to the **Monorepo** structure.

- **Shared Schema (Source of Truth)**:
  - Update: `packages/shared/src/schemas/config.schema.ts` or create `test-connection.schema.ts`
  - Define Zod schema for test connection request/response.

- **Backend (API Layer)**:
  - Route: `packages/backend/src/routes/system.routes.ts` - Add new route for test connection
  - Service: `packages/backend/src/services/connection-test.service.ts` - Create service for connection testing logic
  - Use existing Pino logging for test results
  - Integrate with existing Express router in main app

- **Frontend (UI Layer)**:
  - Component Enhancement: Update `NetworkConfigForm.tsx` to add test button
  - Hook: Create `useTestConnection` hook for API integration
  - Display: Add test results area with loading state and result feedback

### 2. Technical Requirements

- **Backend Implementation**:
  ```typescript
  // packages/backend/src/services/connection-test.service.ts
  interface TestConnectionRequest {
    ipAddress: string;
    port: number;
    protocol?: 'tcp' | 'udp';
    timeout?: number; // in ms, default 5000
  }

  interface TestConnectionResult {
    success: boolean;
    latency?: number; // in ms
    error?: string;
    target: string; // IP:port for identification
  }

  export class ConnectionTestService {
    async testConnection(request: TestConnectionRequest): Promise<TestConnectionResult> {
      // Implementation for TCP/UDP connectivity testing
      // Ensure proper timeout handling
    }
  }
  ```

- **API Route**:
  ```typescript
  // POST /api/system/test-connection
  // Request body: { ipAddress, port, protocol?, timeout? }
  // Response: { success: boolean, latency?: number, error?: string, target: string }
  ```

- **Frontend Integration**:
  - Use `shadcn/ui` Button with loading state
  - Display results using Toast notifications or inline status
  - Disable primary save button during testing

### 3. Network Testing Strategy

The service needs to implement network connectivity testing for different protocols:
- **TCP**: Use `net.connect()` to test port accessibility
- **UDP**: More complex - may require sending test packets to a specific service
- **Timeout**: All tests should have a timeout to prevent hanging requests

### 4. Testing Requirements

- **Unit Tests (Backend)**:
  - `packages/backend/test/unit/services/connection-test.service.test.ts`:
    - Test successful connection
    - Test failed connection
    - Test timeout scenarios
    - Test different protocols

- **Integration Tests (Backend)**:
  - `packages/backend/test/integration/routes/system-routes.test.ts`:
    - Test POST /api/system/test-connection endpoint
    - Validate request/response schema

- **Component Tests (Frontend)**:
  - `packages/frontend/test/components/NetworkConfigForm.test.tsx`:
    - Test connection test button interaction
    - Test loading states
    - Test result display

### 5. Security & Performance Considerations

- **Rate Limiting**: Prevent abuse of connection testing API
- **Input Validation**: Ensure all inputs are properly sanitized
- **Timeout Handling**: Prevent hanging requests that could impact system performance
- **Resource Cleanup**: Ensure all network connections are properly closed

## Tasks/Subtasks

- [x] **Shared: Define Test Connection Schema**
  - [x] Create/update schema for test connection request/response in `packages/shared/src/schemas/`

- [x] **Backend: Implement Connection Test Service**
  - [x] Create `packages/backend/src/services/connection-test.service.ts`
  - [x] Implement TCP connection testing
  - [x] Implement timeout handling
  - [x] Add proper error handling

- [x] **Backend: Add API Route**
  - [x] Add POST `/api/system/test-connection` to `system.routes.ts`
  - [x] Add input validation using shared schema
  - [x] Integrate service with route handler
  - [x] Add logging for test results

- [x] **Frontend: Enhance Network Config Form**
  - [x] Add "Test Connection" button to NetworkConfigForm
  - [x] Create `useTestConnection` hook
  - [x] Display test results and latency
  - [x] Handle loading states

- [x] **Frontend: Integration & Testing**
  - [x] Update existing tests to include connection test functionality
  - [x] Test error scenarios
  - [x] Test success scenarios

- [x] **Documentation & Examples**
  - [x] Add API documentation
  - [x] Provide example usage in comments

## File List
- packages/shared/src/schemas/test-connection.schema.ts
- packages/shared/src/schemas/__tests__/test-connection.schema.test.ts
- packages/backend/src/services/connection-test.service.ts
- packages/backend/src/routes/system.routes.ts
- packages/frontend/src/components/config/NetworkConfigForm.tsx (update)
- packages/frontend/src/hooks/useTestConnection.ts
- packages/backend/src/services/__tests__/connection-test.service.test.ts
- packages/backend/src/routes/__tests__/system-routes.test.ts
- packages/frontend/test/components/NetworkConfigForm.test.tsx (update)

## Dev Agent Record

### Completion Notes
- **2025-12-25**: Completed "Shared: Define Test Connection Schema".
  - Verified `packages/shared/src/schemas/test-connection.schema.ts` exists and matches requirements.
  - Created `packages/shared/src/schemas/__tests__/test-connection.schema.test.ts` to validate the schema.
  - Ran `pnpm --filter shared test` and verified all tests pass (including new schema tests).
  - Validated that `packages/shared/src/index.ts` exports the new schemas and types.
- **2025-12-25**: Completed "Backend: Implement Connection Test Service".
  - Verified `packages/backend/src/services/connection-test.service.ts` implementation.
  - Fixed logger import issue to match project conventions (using child logger).
  - Validated unit tests in `packages/backend/src/services/__tests__/connection-test.service.test.ts` pass.
  - Confirmed TCP and UDP implementation logic matches requirements.
- **2025-12-25**: Completed "Backend: Add API Route".
  - Implemented `POST /api/system/test-connection` in `packages/backend/src/routes/system.routes.ts`.
  - Added input validation using `testConnectionRequestSchema`.
  - Created `packages/backend/src/routes/__tests__/system-routes.test.ts` and verified all tests pass.
  - Fixed issue with Zod v4 compatibility by using `.issues` instead of `.errors` for validation details.
- **2025-12-25**: Completed "Frontend: Enhance Network Config Form".
  - Added "Test Connection" button to NetworkConfigForm with loading state and icon.
  - Created `useTestConnection` hook that integrates with the backend API using apiFetch.
  - Implemented test result display with success/error notifications using toast.
  - Added proper loading state handling and form validation before testing.
- **2025-12-25**: Completed "Frontend: Integration & Testing".
  - Updated `NetworkConfigForm.test.tsx` to include tests for connection test functionality.
  - Added tests for hook integration, loading states, and button behavior.
  - Validated all frontend tests pass for the new functionality.
- **2025-12-25**: Completed "Documentation & Examples".
  - Added API documentation in route handler comments.
  - Provided example usage in code comments.
  - Updated type documentation for better clarity.

## Change Log
- 2025-12-25: Added validation tests for connection test schema.
- 2025-12-25: Implemented frontend connection test functionality with UI components and tests.
- 2025-12-25: Added comprehensive system route tests for connection testing API.
- 2025-12-26: Code review completed - Fixed 6 HIGH/MEDIUM issues:
  - ✅ Fixed IP address validation to properly check octet range (0-255)
  - ✅ Fixed UDP test logic with proper timeout cleanup and message handling
  - ✅ Added rate limiting to prevent API abuse (10 req/min)
  - ✅ Enhanced test coverage with rate limiting tests
  - ✅ Added clearTimeout to prevent resource leaks in UDP tests
  - ✅ Added comprehensive test cases for IP validation edge cases