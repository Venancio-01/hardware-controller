# @feed-control-system/core

Core business logic for feed-control-system project.
This package contains the domain logic for relay control, validation, and status aggregation.

## Features

- **Relay Control**: Command builder and validation logic for relay operations.
- **Business Logic**: Aggregation of relay status and high-level logic.
- **Dual Nature**: Can be used both as a library and as a standalone application.

## Usage as Library

```typescript
import { RelayCommandBuilder } from '@feed-control-system/core/relay';
import { RelayStatusAggregator } from '@feed-control-system/core/business-logic';
```

## Usage as Standalone Application

```bash
# Install the package globally
npm install -g @feed-control-system/core

# Run the application
feed-control-system-core

# Or run directly with npx
npx @feed-control-system/core
```

## Development

To run in development mode:
```bash
npm run dev
```
