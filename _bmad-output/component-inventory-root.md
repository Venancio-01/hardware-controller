# Component Inventory - Root Part

## Overview

The application is structured as a modular backend service with distinct controllers for hardware interaction and business logic.

## Hardware Components

### 1. Relay Controller
- **Location**: `src/relay/`
- **Type**: Hardware Driver
- **Purpose**: Controls ETH-based relay devices via UDP/TCP.
- **Key Features**:
  - `RelayCommandBuilder`: Constructs protocol commands (`doon`, `dooff`, `dostatus`).
  - Validation: Uses Zod for channel (1-8) and delay inputs.
  - Channel Support: 1-8 individual channels + 'all' (channel 99).
- **Interface**:
  - `close(channel: RelayChannel, options?)`
  - `open(channel: RelayChannel)`
  - `queryRelayStatus()`
  - `queryInputStatus()`

### 2. Voice Broadcast Controller
- **Location**: `src/voice-broadcast/`
- **Type**: Hardware Driver
- **Purpose**: Interfaces with CX-815E network voice modules via TCP.
- **Key Features**:
  - Text-to-Speech (TTS) with parameters:
    - Volume: `[v0-10]`
    - Speed: `[s0-10]`
    - Voice: `[m3]` (Female), `[m51]` (Male)
  - GB2312 Encoding for Chinese character support.
  - Modes: Interrupt (`CC DD F3 00`) vs Cache (`CC DD F3 01`).
- **Interface**:
  - `broadcast(text, options)`
  - `playSound(soundId)`
  - `setInterruptMode()`, `setCacheMode()`

### 3. Hardware Manager
- **Location**: `src/hardware/`
- **Type**: Core Infrastructure
- **Purpose**: Centralized communication manager for all hardware devices.
- **Key Features**:
  - Manages UDP/TCP sockets.
  - Handles connection lifecycles (connect/disconnect).
  - Dispatching of commands from upper layers (StateMachine).

## Business Logic Components

### Relay Status Aggregator
- **Location**: `src/business-logic/relay-status-aggregator.ts`
- **Type**: Logic Module
- **Purpose**: Aggregates raw relay status updates into meaningful business events.
- **Role**:
  - Monitors high-frequency status polls.
  - Debounces or filters changes (likely).
  - Emits normalized events to the State Machine.
