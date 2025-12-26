# @node-switch/core

Core business logic for node-switch project.
This package contains the domain logic for relay control, validation, and status aggregation.

## Features

- **Relay Control**: Command builder and validation logic for relay operations.
- **Business Logic**: Aggregation of relay status and high-level logic.
- **Dual Nature**: Can be used both as a library and as a standalone application.

## Usage as Library

```typescript
import { RelayCommandBuilder } from '@node-switch/core/relay';
import { RelayStatusAggregator } from '@node-switch/core/business-logic';
```

## Usage as Standalone Application

```bash
# Install the package globally
npm install -g @node-switch/core

# Run the application
node-switch-core

# Or run directly with npx
npx @node-switch/core
```

## Development

To run in development mode:
```bash
npm run dev
```
