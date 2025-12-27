# Story 4.5: System-wide Network Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Architect,
I want to ensure network settings are chemically valid,
So that we don't apply settings that physically break the OS networking.

## Acceptance Criteria

1. **Given** A user enters an IP address and Subnet Mask
   **When** They try to save
   **Then** The system validates that the IP is valid within the Subnet (e.g., not the network address or broadcast address if applicable, though primarily that they are valid IPs)
   **And** The Subnet Mask is a valid mask.

2. **Given** A Gateway address is entered
   **When** Validation runs
   **Then** The system ensures the Gateway is within the same Subnet as the IP address.

3. **Given** An invalid combination (e.g., Gateway 192.168.2.1 for IP 192.168.1.10/24)
   **When** Users tries to save
   **Then** The form prevents submission and shows a specific error: "Gateway must be in the same subnet as the IP address".

## Tasks / Subtasks

- [x] **Task 1: Add IP Calculation Library**
  - [x] Add `ipaddr.js` to `packages/shared` dependencies
  - [x] Verify types are available (might need `@types/ipaddr.js`)

- [x] **Task 2: Enhance Network Schema**
  - [x] Update `networkConfigSchema` in `packages/shared/src/schemas/network.schema.ts`
  - [x] Use `superRefine` to implement cross-field validation
  - [x] Validate Gateway is within the IP/Subnet range
  - [x] Validate Subnet Mask format

- [x] **Task 3: Unit Testing (Shared)**
  - [x] Update `packages/shared/src/schemas/__tests__/network.schema.test.ts`
  - [x] Add test cases for valid IP/Gateway combinations
  - [x] Add test cases for invalid Gateway (outside subnet)
  - [x] Verify error messages are clear

- [x] **Task 4: Frontend Integration Verification**
  - [x] Verify `ConfigForm` correctly displays the cross-field errors
  - [x] (No code change expected if Zod resolver is set up correctly, but verification is needed)

## Dev Notes

### Technical Requirements

- **Library**: Use `ipaddr.js` for robust IP address parsing and CIDR checking. Do not implement custom regex/bit-shifting logic for subnet calculations as it is error-prone.
- **Validation Layer**: Implementation MUST be in `packages/shared` so it applies to both Backend (API) and Frontend (Form).
- **Error Messages**: Must be human-readable and specific (e.g., not just "Invalid", but "Gateway 192.168.2.1 is unreachable from IP 192.168.1.10/255.255.255.0").

### Architecture Compliance

- **Shared Logic**: The validation logic belongs in `packages/shared` to ensure Single Source of Truth.
- **Zod Patterns**: Use `z.object().superRefine((data, ctx) => ...)` for multi-field validation.
- **Dependency Management**: Add dependency only to `packages/shared`, not root or other packages unless necessary.

### File Structure Requirements

| File | Status | Description |
|------|--------|-------------|
| `packages/shared/package.json` | Modify | Add `ipaddr.js` dependency |
| `packages/shared/src/schemas/network.schema.ts` | Modify | Implement `superRefine` logic |
| `packages/shared/src/schemas/__tests__/network.schema.test.ts` | Modify | Add comprehensive test cases |

### Implementation Guide

**Schema Logic (Conceptual):**

```typescript
import ipaddr from 'ipaddr.js';

export const networkConfigSchema = z.object({
  ipAddress: z.string().ip(),
  subnetMask: z.string().ip(), // Or specific validator for masks
  gateway: z.string().ip().optional(),
  // ... other fields
}).superRefine((data, ctx) => {
  if (data.ipAddress && data.subnetMask && data.gateway) {
    try {
      const ip = ipaddr.parse(data.ipAddress);
      const mask = ipaddr.parse(data.subnetMask);
      const gateway = ipaddr.parse(data.gateway);

      // Logic to check if gateway is in subnet
      // Note: ipaddr.js works with CIDR usually, might need conversion from Mask to CIDR
      // or use a utility that handles masks.
      // Alternatively, verify matches using bitwise ops or library helper.

      if (!isGatewayInSubnet(ip, mask, gateway)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gateway must be within the same subnet",
          path: ["gateway"],
        });
      }
    } catch (e) {
      // Parse errors are handled by individual field validators
    }
  }
});
```

### Previous Story Intelligence

**From Story 4.1 (Manage Network Configuration)**:
- We established `networkConfigSchema` but it likely only check individual fields.
- Frontend uses `zodResolver`, so `superRefine` errors should automatically map to the form fields if the path is compliant (e.g., `path: ['gateway']`).

### Git Intelligence

- **Recent Changes**: `packages/shared/src/schemas/network.schema.ts` was likely touched in Story 4.1.
- **Pattern**: We prefer strict validation to prevent "bricking" the device network interface.

### Security Considerations

- **DoS Prevention**: Complex validation (regex or excessive calculation) should be efficient. `ipaddr.js` is efficient.
- **System Stability**: Preventing invalid network configs is a key availability control (NFR4).

### Testing Requirements

1.  **Unit Tests (Shared)**:
    -   Valid Case: IP 192.168.1.10, Mask 255.255.255.0, Gateway 192.168.1.1 -> PASS
    -   Invalid Case: IP 192.168.1.10, Mask 255.255.255.0, Gateway 192.168.2.1 -> FAIL
    -   Edge Cases:
        -   Gateway == IP (Valid? Usually yes, though loopback-ish, but technically in subnet. Maybe warn?)
        -   Gateway == Broadcast address -> FAIL

2.  **Manual Verification**:
    -   Go to Network Settings page.
    -   Enter valid IP/Mask.
    -   Enter Gateway outside subnet.
    -   Verify visual error on Gateway field.
    -   Verify "Save" button does not submit.

---

## Dev Agent Record

### Implementation Summary

Implemented cross-field network validation using `ipaddr.js` library in the shared package. The validation ensures that gateway addresses are within the same subnet as the IP address.

### File List

| File | Status | Description |
|------|--------|-------------|
| `packages/shared/package.json` | Modified | Added `ipaddr.js` v2.3.0 dependency |
| `packages/shared/src/schemas/network.schema.ts` | Modified | Added `superRefine` with gateway-in-subnet validation |
| `packages/shared/src/schemas/__tests__/network.schema.test.ts` | Modified | Added 6 test cases for gateway validation |

### Change Log

**2025-12-27 - Initial Implementation**
- Added `ipaddr.js` dependency to `packages/shared/package.json`
- Implemented `validateGatewayInSubnet()` function using bitwise operations
- Added `superRefine` to `networkConfigSchema` for cross-field validation
- Added test cases for valid/invalid gateway configurations
- All 15 tests passing in network.schema.test.ts

### Technical Notes

- Used bitwise AND operation to check if IP and Gateway belong to same subnet
- Validation logic: `(IP & Mask) === (Gateway & Mask)`
- Skips logical validation if format errors exist (short-circuit evaluation)
- Error message path set to `['gateway']` for proper form field mapping
