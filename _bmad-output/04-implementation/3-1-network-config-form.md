# Story 3.1: 实现网络配置表单与验证 (Network Config Form)

Status: ready-for-dev
Story: 3.1
Epic: 3

## Story

**As a** 用户 (User),
**I want** 修改 IP 地址等网络设置并获得严格的验证,
**So that** 我可以更改网络环境配置而不会输入无效的 IP 导致设备失联。

## Acceptance Criteria

1. **界面呈现 (UI Rendering)**
   - 在配置页面提供专门的"网络配置"区域（Card 组件包裹）。
   - 包含以下必填字段：IP 地址、子网掩码、网关、端口号。
   - 包含可选字段：DNS 服务器（支持多个）。
   - 采用双列网格布局适配 1080p 屏幕。
   - 字段显示当前生效的配置值作为默认值。

2. **输入验证 (Input Validation)**
   - **IP 地址/子网掩码/网关**：必须符合标准的 IPv4 格式 (X.X.X.X)。
   - **端口号**：必须是 1-65535 之间的整数。
   - **逻辑验证**：网关地址必须位于 IP 地址和子网掩码定义的同一子网内。
   - **实时反馈**：输入时即时显示验证结果（绿色✓或红色✗及错误信息）。

3. **交互逻辑 (Interaction)**
   - 如果任何字段验证失败，"保存配置"按钮必须处于禁用状态。
   - 错误信息应具体且友好（例如："网关必须与 IP 地址在同一子网内"）。

## Developer Context

> **⚠️ CRITICAL WARNING**: This story touches **High-Risk** network settings. A bug here can brick the device's connectivity (user locked out). Strict validation is paramount.

### 1. Architecture & File Structure

This implementation spans the full stack and requires strict adherence to the **Monorepo** structure.

- **Shared Schema (Source of Truth)**:
  - Create/Update: `packages/shared/src/schemas/network.schema.ts`
  - Define the strict Zod schema here. Both Frontend and Backend **MUST** import from this file.
  - Export `NetworkConfig` type.

- **Frontend (UI Layer)**:
  - Component: `packages/frontend/src/components/config/NetworkConfigForm.tsx`
  - Integration: Embed into `ConfigPage` or main `ConfigForm`.
  - State: Use `react-hook-form` with `zodResolver` utilizing the shared schema.

- **Backend (Validation Layer)**:
  - While the generic `PUT /api/config` might already exist, ensure `ConfigService` uses the *same* `network.schema.ts` for validation.
  - Verify `packages/backend/src/config/config.service.ts` imports the schema.

### 2. Technical Requirements

- **Zod Schema Definition**:
  ```typescript
  // packages/shared/src/schemas/network.schema.ts
  import { z } from 'zod';

  export const networkConfigSchema = z.object({
    ipAddress: z.string().ip({ version: "v4" }),
    subnetMask: z.string().regex(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid subnet mask"),
    gateway: z.string().ip({ version: "v4" }),
    port: z.number().int().min(1).max(65535),
    dns: z.array(z.string().ip({ version: "v4" })).optional(),
  }).refine((data) => {
    // Implement Subnet/Gateway reachability check here
    // Recommend using a library like 'ip' or implementing standard bitwise check
    return isIpInSubnet(data.gateway, data.ipAddress, data.subnetMask);
  }, {
    message: "Gateway must be within the same subnet as the IP address",
    path: ["gateway"], // Attach error to gateway field
  });
  ```

- **Frontend Validation**:
  - Use `shadcn/ui` Form components.
  - Error messages must be displayed immediately below the field.
  - Visual cues: Green border/icon for valid fields (optional enhancement), Red for invalid.

### 3. Subnet Validation Logic (Critical)

You must implement a utility to verify the Gateway is reachable.
- **Algorithm**: `(IP & Mask) === (Gateway & Mask)`
- Place this utility in `packages/shared/src/utils/ip-utils.ts` (create if needed) so it can be used by the Zod `refine` method.

### 4. Testing Requirements

- **Unit Tests (Shared)**:
  - `packages/shared/test/schemas/network.schema.test.ts`: Test the Zod schema with:
    - Valid IP/Mask/Gateway combinations.
    - Invalid IP formats.
    - Gateway outside subnet (Must fail).
    - Port boundaries (0, 65536).

- **Component Tests (Frontend)**:
  - `packages/frontend/test/components/NetworkConfigForm.test.tsx`:
    - render form.
    - enter invalid IP -> expect error message.
    - enter valid data -> expect no errors.

### 5. Git & Previous Learnings

- **Pattern**: Follow the pattern established in Epic 2 (App Config).
- **Library**: If `ip` or `netmask` libraries are not in `package.json`, stick to native implementation or add lightweight dependency only if absolutely necessary and approved. **Prefer regex and bitwise operations for zero-dependency if possible.**
- **Strict Mode**: TypeScript strict mode is ON. Handle all `null`/`undefined`.

## Latest Technical Info

- **Zod**: Use `v4.2.1` features. `.ip()` is available for string validation.
- **React Hook Form**: Use `formState.isValid` to control button state.

## Tasks/Subtasks

- [x] **Shared: Define Network Utilities & Schema**
  - [x] Create `packages/shared/src/utils/ip-utils.ts` with `isIpInSubnet` function (using bitwise ops)
  - [x] Add unit tests for `ip-utils` in `packages/shared/test/utils/ip-utils.test.ts`
  - [x] Create `packages/shared/src/schemas/network.schema.ts` defining `NetworkConfig` and Zod validation
  - [x] Add unit tests for `network.schema.ts` in `packages/shared/test/schemas/network.schema.test.ts` (cover IP, mask regex, gateway logic)

- [ ] **Frontend: Network Configuration Form**
  - [ ] Create `packages/frontend/src/components/config/NetworkConfigForm.tsx`
  - [ ] Implement form layout using `shadcn/ui` Card and Grid
  - [ ] Bind fields (IP, Mask, Gateway, Port, DNS) to `react-hook-form`
  - [ ] Implement `zodResolver` with shared schema
  - [ ] Display real-time validation errors

- [ ] **Frontend: Integration & Testing**
  - [ ] Integrate `NetworkConfigForm` into the main Config page
  - [ ] Create `packages/frontend/test/components/NetworkConfigForm.test.tsx`
  - [ ] Test form rendering and default values
  - [ ] Test validation feedback (invalid IP, gateway mismatch)
  - [ ] Test submit button disabled state

- [ ] **Backend: Verification**
  - [ ] Verify/Update `packages/backend/src/config/config.service.ts` to use `network.schema.ts` validation

## Dev Agent Record

### Implementation Plan
- [x] Implement Shared IP Utils & Schema
- [ ] Implement Frontend Form Component
- [ ] Integrate and Verify

### Completion Notes
- Implemented `isIpInSubnet` using bitwise operations for efficient subnet validation.
- Defined `networkConfigSchema` with Zod, enforcing IPv4 format (Regex), port range, and subnet consistency.
- Added comprehensive unit tests for both utilities and schema.
- Resolved circular dependency in schemas by defining `portSchema` locally in `network.schema.ts`.
- Note: Zod `.ip()` was not available/working, fell back to Regex validation.

## File List
- packages/shared/src/utils/ip-utils.ts
- packages/shared/test/utils/ip-utils.test.ts
- packages/shared/src/schemas/network.schema.ts
- packages/shared/test/schemas/network.schema.test.ts
- packages/frontend/src/components/config/NetworkConfigForm.tsx
- packages/frontend/test/components/NetworkConfigForm.test.tsx

## Change Log
- (None)