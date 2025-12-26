---
stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/prd.md', '_bmad-output/architecture.md', '_bmad-output/ux-design-specification.md']
---

# node-switch - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for node-switch, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-001: 显示配置 - 以可读格式显示当前系统和应用程序配置
FR-002: 修改应用设置 - 通过 Web 界面允许修改应用程序级设置
FR-003: 修改网络设置 - 通过 Web 界面允许修改系统级网络设置（IP 地址、网络参数）
FR-004: 验证配置 - 保存前验证配置更改
FR-005: 保存配置 - 将配置更改保存到 config.json 文件
FR-006: 安全认证 - 实现配置访问的安全身份验证
FR-007: 视觉反馈 - 在保存操作期间提供视觉反馈
FR-008: 导入导出 - 允许配置文件的导入/导出
FR-011: 错误显示 - 明确显示配置验证错误
FR-012: 测试网络 - 允许在应用前测试网络配置
FR-101: 进程分离 - Backend 使用 `child_process` API 启动 Core 作为独立子进程
FR-102: 状态监控 - Backend 监控 Core 进程状态（启动、运行、停止、崩溃）
FR-103: 进程重启 - Backend 能够优雅地停止并重启 Core 进程
FR-104: 进程通信 - 建立 Backend 与 Core 之间的 IPC 通信通道
FR-105: 状态 API - 提供 REST API 供 Frontend 查询 Core 状态
FR-106: 重启 API - 提供 REST API 供 Frontend 触发 Core 重启
FR-107: 自动恢复 - Core 崩溃后自动重启（可配置重试次数）
FR-109: 日志转发 - Core 日志通过 IPC 转发到 Backend 统一管理
FR-110: 状态推送 - 通过 WebSocket 实时推送 Core 状态变化到 Frontend
FR-111: 启动超时 - 配置 Core 启动超时时间，超时视为启动失败
FR-112: 健康检查 - 定期心跳检测 Core 运行状况

### NonFunctional Requirements

NFR1: 界面加载时间 < 3 秒
NFR2: 重启响应时间 < 5 秒
NFR4: 配置更改期间的系统可用性 99.9%
NFR5: Core 崩溃后 Web 可用性 100%（Web 服务不受影响）
NFR6: 自动恢复成功率 ≥95%
NFR7: 安全配置存储 (config.json)
NFR8: 适当的访问控制 (JWT/Auth)

### Additional Requirements

- **Architecture:** Use `child_process.fork()` for Core separation
- **Architecture:** Implement `CoreProcessManager` in Backend
- **Architecture:** Standardize IPC messages (types defined in Shared)
- **Architecture:** Use Shared Zod schemas for validation
- **UX:** Full adoption of **shadcn/ui** components
- **UX:** Implement "Status Visible" dashboard sidebar (Core status & Connection info)
- **UX:** Real-time form validation using Zod + React Hook Form
- **UX:** Toast + Alert feedback system for "Restart Required" notifications
- **UX:** Double-column grid layout for configuration forms
- **UX:** No excessive modals; keep configuration flow separate from status monitoring

### FR Coverage Map

FR-001: Epic 1 - Display config/status
FR-002: Epic 3 - Modify app settings
FR-003: Epic 4 - Modify network settings
FR-004: Epic 3 - Validate config
FR-005: Epic 3 - Save config
FR-006: Epic 1 - Authentication
FR-007: Epic 3 - Visual feedback
FR-008: Epic 4 - Import/Export
FR-011: Epic 3 - Error display
FR-012: Epic 4 - Network test
FR-101: Epic 1 - Process separation
FR-102: Epic 1 - Status monitoring
FR-103: Epic 2 - Process restart
FR-104: Epic 1 - IPC communication
FR-105: Epic 1 - Status API
FR-106: Epic 2 - Restart API
FR-107: Epic 2 - Auto recovery
FR-109: Epic 1 - Log forwarding
FR-110: Epic 1 - Status push
FR-111: Epic 1 - Startup timeout
FR-112: Epic 1 - Health check

## Epic List

### Epic 1: Secure Access & Process Visibility
Provide secure access to the interface and ensure the hardware process runs independently, allowing users to monitor status even if the controller fails.
**FRs covered:** FR-101, FR-102, FR-104, FR-105, FR-109, FR-110, FR-111, FR-112, FR-001, FR-006

### Epic 2: Process Control & Reliability
Empower users to manage the Core process cycle (restart/recover) and ensure the system automatically heals from failures.
**FRs covered:** FR-103, FR-106, FR-107

### Epic 3: Application Configuration Management
Provide a validated interface for modifying application logic settings with visual feedback.
**FRs covered:** FR-002, FR-004, FR-005, FR-007, FR-011

### Epic 4: Advanced System Network Operations
Enable system-level management including network configuration and configuration portability.
**FRs covered:** FR-003, FR-008, FR-012

## Epic 1: Secure Access & Process Visibility

Provide secure access to the interface and ensure the hardware process runs independently, allowing users to monitor status even if the controller fails.

### Story 1.1: Implement Core Process Manager

As a System Developer,
I want to manage the Core as a separate child process,
So that its lifecycle is independent of the web server.

**Acceptance Criteria:**

**Given** The Backend server is starting up
**When** `CoreProcessManager.start()` is called
**Then** The Core application is spawned using `child_process.fork()`
**And** An IPC communication channel is established between Backend and Core
**And** The Backend logs confirm the child process PID

**Given** The Core process is running
**When** `CoreProcessManager.stop()` is called
**Then** A SIGTERM signal is sent to the Core process
**And** The system waits for graceful exit (max 5s) before forcing kill

### Story 1.2: Implement Status Monitoring & Logging

As a System Admin,
I want the system to monitor the Core's health,
So I know if it's running correctly.

**Acceptance Criteria:**

**Given** The Core process starts successfully
**When** It enters the 'ready' state
**Then** It sends a status message via IPC to the Backend

**Given** The Core process emits a log message
**When** The log is received via IPC
**Then** The Backend logger records it with a configured prefix (e.g., `[CORE]`)

**Given** The Core process crashes or exits unexpectedly
**When** The exit event is detected
**Then** The Backend updates the status to 'Error' or 'Stopped' immediately

**Given** The Core process fails to start within 30 seconds
**When** The timeout is reached
**Then** The Backend marks the status as 'Error' and logs a timeout error

### Story 1.3: Expose Process Status via API

As a Frontend Developer,
I want to query the Core status,
So I can display it to the user.

**Acceptance Criteria:**

**Given** An authenticated user
**When** They request `GET /api/system/core/status`
**Then** The API returns the current status (Starting/Running/Stopped/Error), uptime, and last error message

**Given** The Core status changes (e.g., from Starting to Running)
**When** The change occurs
**Then** The Backend emits a WebSocket event (or similar real-time mechanism) to connected clients

### Story 1.4: Implement Frontend Status Dashboard

As a User,
I want to see the system status on the sidebar,
So I always know if the hardware controller is online.

**Acceptance Criteria:**

**Given** I am logged into the dashboard
**When** I look at the sidebar/status area
**Then** I see a "Connection Status" badge (Online/Offline)
**And** I see a "Core Status" badge (Running/Stopped/Error)
**And** I see the current configured IP and Port

**Given** The Core goes offline
**When** The status update is received
**Then** The "Core Status" badge turns Red immediately

### Story 1.5: Enforce Authentication for System Access

As a Security Officer,
I want to restrict system access,
So only authorized admins can see status.

**Acceptance Criteria:**

**Given** An unauthenticated user
**When** They try to access `/api/system/*` endpoints
**Then** They receive a 401 Unauthorized response

**Given** An unauthenticated user
**When** They try to view the dashboard page
**Then** They are redirected to the Login page

## Epic 2: Process Control & Reliability

Empower users to manage the Core process cycle (restart/recover) and ensure the system automatically heals from failures.

### Story 2.1: Implement Manual Restart Control

As a System Admin,
I want to manually restart the Core process,
So I can apply new configurations or recover from stuck states.

**Acceptance Criteria:**

**Given** An authenticated user on the dashboard
**When** They click the "Restart Core" button
**Then** A confirmation dialog appears
**And** Upon confirmation, a `POST /api/system/core/restart` request is sent

**Given** The restart request is processing
**When** The user watches the UI
**Then** A progress spinner is shown and the status badge updates to "Starting..." for approx 5 seconds
**And** A Toast notification appears upon success or failure

### Story 2.2: Implement Automatic Crash Recovery

As a System Owner,
I want the system to auto-recover from crashes,
So that downtime is minimized without manual intervention.

**Acceptance Criteria:**

**Given** The Core process exits with a non-zero code (crash)
**When** The Backend detects the exit
**Then** It waits 1 second and attempts to restart the process
**And** It increments a retry counter

**Given** The restart is successful and runs for >1 hour
**When** The stability period passes
**Then** The retry counter is reset to 0

**Given** The process crashes 3 times in a row within a short status
**When** The max retry limit is reached
**Then** The Backend stops trying to restart and logs a critical error
**And** The status remains "Error" until manual intervention

## Epic 3: Application Configuration Management

Provide a validated interface for modifying application logic settings with visual feedback.

### Story 3.1: Retrieve and Display Current Configuration

As a User,
I want to see the current application settings,
So I know what is currently configured.

**Acceptance Criteria:**

**Given** I access the configuration page
**When** The page loads
**Then** Text fields are pre-filled with values fetched from `GET /api/config`
**And** The interface visibly separates Application Settings from Network Settings

### Story 3.2: Implement Configuration Update Logic

As a System,
I want to update the configuration file safely,
So that data integrity is maintained.

**Acceptance Criteria:**

**Given** A valid configuration payload
**When** `PUT /api/config` is called
**Then** The Backend verifies the data against the Zod schema
**And** Writes the new config to `config.json` atomically
**And** Responds with success, indicating a restart is required

### Story 3.3: Implement Config Form with Real-time Validation

As a User,
I want to see validation errors as I type,
So I can correct mistakes before saving.

**Acceptance Criteria:**

**Given** I am typing in a configuration field
**When** The input creates an invalid state (e.g., Device ID is empty)
**Then** The field border turns red immediately
**And** A helper text appears below explaining the error

### Story 3.4: Implement Save & Restart Flow

As a User,
I want to know when my changes are saved and applied,
So I can be sure the system is updated.

**Acceptance Criteria:**

**Given** I have modified the configuration
**When** I click "Save Changes"
**Then** The button shows a loading spinner
**And** A Toast notification appears: "Configuration Saved"
**And** A persistent Alert bar appears: "Restart Required to apply changes" with a "Restart Now" button

### Story 3.5: Handle Validation & System Errors

As a User,
I want specific error messages if saving fails,
So I can fix the underlying issue.

**Acceptance Criteria:**

**Given** The server rejects a configuration (e.g., port conflict)
**When** The API returns a 400 Bad Request
**Then** The frontend highlights the specific field causing the error
**And** Displays the server-provided error message suitable for humans

## Epic 4: Advanced System Network Operations

Enable system-level management including network configuration and configuration portability.

### Story 4.1: Manage Network Configuration

As a System Admin,
I want to modify the device's IP and Network settings,
So I can deploy it to differrent network environments.

**Acceptance Criteria:**

**Given** The user accesses the Network Settings section
**When** They enter an invalid IP address
**Then** Real-time Zod validation shows an error immediately

**Given** The user clicks "Save" on network changes
**When** The modal appears
**Then** It displays a warning: "Changing network settings may interrupt your connection. Please ensure values are correct."

### Story 4.2: Implement Network Connection Test

As a System Admin,
I want to test a new network configuration,
So I don't lose connection to the device.

**Acceptance Criteria:**

**Given** A valid target IP/Gateway entered in the form
**When** The user clicks "Test Connectivity"
**Then** The backend attempts to bind to the new address or ping the gateway
**And** Returns Pass/Fail result via Toast notification

### Story 4.3: Implement Configuration Export

As a System Admin,
I want to export the current configuration to a file,
So I can backup my settings.

**Acceptance Criteria:**

**Given** An authenticated user
**When** They click the "Export Configuration" button
**Then** The browser downloads a `config.json` file
**And** The file contains the current running configuration

### Story 4.4: Implement Configuration Import

As a System Admin,
I want to import a configuration file,
So I can quickly set up a new replacement device.

**Acceptance Criteria:**

**Given** A user with a valid `config.json` file
**When** They upload it via the Import interface
**Then** The backend validates the JSON structure and schema
**And** If valid, overwrites the current config and triggers a restart

**Given** An invalid file is uploaded
**When** Validation fails
**Then** The file is rejected with a specific error message

### Story 4.5: System-wide Network Validation

As a System Architect,
I want to ensure network settings are chemically valid,
So that we don't apply settings that physically break the OS networking.

**Acceptance Criteria:**

**Given** A user enters an IP address and Subnet Mask
**When** They try to save
**Then** The system validates that the IP is valid within the Subnet
**And** Rejects impossible combinations (e.g., Gateway outside of Subnet)
