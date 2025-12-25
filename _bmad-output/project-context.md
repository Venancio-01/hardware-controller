---
project_name: node-switch
user_name: 青山
date: '2025-12-25'
sections_completed: ['technology_stack', 'language_specific', 'framework_specific', 'testing', 'code_quality', 'workflow', 'critical_dont_miss']
existing_patterns_found: 25
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime**: Node.js >=22.0.0 (as specified in package.json engines)
- **Language**: TypeScript 5.9.3 with strict mode enabled
- **State Management**: XState v5.12.1 for complex state machines
- **Validation**: Zod v4.2.1 for environment variable and data validation
- **Logging**: Pino v10.1.0 with pino-pretty for development
- **Build Tool**: tsup for bundling
- **Dev Tool**: tsx for development execution
- **Testing**: vitest for testing framework
- **Environment Management**: dotenv for config loading

## Critical Implementation Rules

### Language-Specific Rules

#### TypeScript Configuration
- Use strict mode with all strict type checking flags enabled (strict, alwaysStrict, strictNullChecks, strictFunctionTypes, etc.)
- Target ES2022 with ESNext module system
- Use explicit `.js` extensions in imports for Node.js compatibility
- Enable experimentalDecorators and emitDecoratorMetadata for potential decorator usage

#### Import/Export Conventions
- Use explicit `.js` extensions in imports for Node.js compatibility
- Use `import type` for type-only imports to optimize bundle size
- Group imports: external libraries first, then internal modules
- Use absolute paths for internal imports (relative to src/)

#### Error Handling Patterns
- Use Zod for configuration validation with fail-fast principle (process.exit(1) on validation failure)
- Implement try-catch blocks for async operations with proper error logging
- Use appropriate log levels (error, warn, info) for different scenarios
- Centralize error handling patterns through the logger module

### Framework-Specific Rules

#### XState State Machine Patterns
- Use XState 5.x setup/createActor pattern for defining and instantiating state machines
- Define state machines in `src/state-machines/` directory with descriptive names
- Use type-safe state machine definitions with explicit context, events, and input types
- Implement child state machines using invoke blocks and communicate via sendTo actions
- Use actor model for complex state management with parent-child relationships
- Implement graceful cleanup of state machine actors during shutdown
- Use event prioritization when managing multiple event types in state machines

### Testing Rules

#### Test Structure and Organization
- Use vitest as the testing framework with "vitest run" for execution
- Name test files with .test.ts or .spec.ts extensions
- Organize tests in the same directory structure as the source files being tested
- Use descriptive test names that clearly indicate what is being tested

#### Test Categories
- Unit Tests: Test individual functions, classes, and utility methods in isolation
- Integration Tests: Test interactions between modules (e.g., state machines with hardware managers)
- System/End-to-End Tests: Test complete workflows and system behavior

#### Mock Usage
- Use vitest's built-in mocking capabilities for external dependencies
- Mock hardware communication for unit tests to ensure fast execution
- Create realistic mock implementations for testing state machine transitions
- Mock logger and config modules when testing components that depend on them

### Code Quality & Style Rules

#### File and Folder Structure
- Organize code in feature-based directories under src/ (logger, relay, voice-broadcast, hardware, state-machines, etc.)
- Keep type definitions co-located with implementation or in centralized types/ directory
- Use index.ts files to control module exports and create clean public APIs
- Separate validation logic in dedicated files (e.g., validation.ts)

#### Naming Conventions
- Use camelCase for variables, functions, and file names
- Use PascalCase for types, interfaces, and class names
- Use UPPER_SNAKE_CASE for constants and configuration values
- Use descriptive names that clearly indicate purpose and functionality
- State machine files should use `-machine.ts` suffix for consistency

#### Documentation and Comments
- Use JSDoc-style comments for complex functions, classes, and business logic
- Include parameter and return value descriptions for public APIs
- Use Chinese for business logic and domain-specific comments (as per codebase standard)
- Use English for technical variable names and general implementation comments
- Add meaningful comments for complex algorithms and business rules

### Development Workflow Rules

#### Environment and Configuration
- Use .env and .env.local files for environment variable management
- All environment variables must pass Zod validation during startup
- Support multiple environments (development, production, test) via NODE_ENV
- Configuration validation follows fail-fast principle (app exits on invalid config)

#### Build and Execution
- Use tsup for building with ESM output format
- Use tsx for development execution with watch mode
- Build artifacts are generated in the dist/ directory
- Use dotenv/config for runtime environment loading in production builds

#### Deployment and Runtime
- Implement graceful shutdown handlers for SIGINT and SIGTERM signals
- Initialize all hardware communication modules during app startup
- Verify configuration validity before starting any services
- Log startup configuration summary for debugging purposes

### Critical Don't-Miss Rules

#### Anti-Patterns to Avoid
- Do not bypass Zod validation when accessing environment variables - always use the centralized config module
- Do not directly access hardware interfaces - always use HardwareCommunicationManager for hardware communication
- Do not ignore configuration validation failures - always follow fail-fast principle (app should exit)
- Do not skip cleanup procedures during shutdown - ensure all state machine actors and hardware connections are properly closed
- Do not perform blocking operations in state machine transitions - keep them asynchronous

#### Edge Cases and Error Handling
- Implement proper timeout and retry logic for hardware communication (use configurable parameters)
- Handle state machine event conflicts during concurrent operations (use event prioritization)
- Validate UDP/TCP communication responses to prevent processing malformed data
- Include error recovery mechanisms for network communication failures

#### Security Considerations
- Do not store sensitive credentials in plain text environment variables
- Validate all data received from hardware communication before processing
- Use appropriate access controls for configuration files containing sensitive information
- Implement rate limiting for hardware communication to prevent flooding

#### Performance Patterns to Follow
- Avoid blocking operations in high-frequency event paths
- Use asynchronous processing for time-consuming operations in state machines
- Optimize logging frequency in high-frequency paths to prevent performance degradation
- Consider memory usage when maintaining state in long-running processes