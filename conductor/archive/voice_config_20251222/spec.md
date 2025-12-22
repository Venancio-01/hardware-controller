# Specification: Independent Voice Broadcast Configuration and Initialization

## 1. Overview
This track implements independent volume and speed configurations for the Cabinet and Control voice broadcast modules. It ensures that each module operates with its own global defaults while allowing for per-message overrides.

## 2. Functional Requirements
- **Independent Configuration**: Add four new environment variables to manage volume (0-10) and speed (0-10) separately for Cabinet and Control modules.
- **Persistent Injection**: The `VoiceBroadcastController` will store these settings and automatically prepend the corresponding protocol tags (e.g., `[v10][s5]`) to every broadcast message.
- **Parameter Overrides**: Update the `broadcast` method to accept an optional configuration object (e.g., `{ volume?: number, speed?: number }`). If provided, these values will take precedence over the global defaults for that specific message.
- **Initialization**: Update `BusinessLogicManager` to ensure the voice modules are initialized with their respective configurations.

## 3. Non-Functional Requirements
- **Configuration Validation**: Use Zod to enforce that volume and speed are integers between 0 and 10.
- **Protocol Adherence**: Ensure tags follow the `CX-815E` specification: `[v*]` for volume and `[s*]` for speed.

## 4. Acceptance Criteria
- [ ] `.env.example` and `.env` contain the new `VOICE_BROADCAST_CABINET/CONTROL_VOLUME/SPEED` variables.
- [ ] `src/config/index.ts` validates these new variables using Zod.
- [ ] `VoiceBroadcastController` supports independent settings for multiple clients.
- [ ] The `broadcast` method correctly merges global defaults with optional overrides.
- [ ] Unit tests verify that messages sent to different modules have the correct injected tags.
- [ ] Integration tests or logs confirm that `BusinessLogicManager` initializes the modules correctly.

## 5. Out of Scope
- Modifying the voice module's voice selection (`[m*]`) or other specialized tags (unless specified).
- Changing the underlying TCP/UDP communication protocol.
