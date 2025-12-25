---
stepsCompleted: [1, 2]
inputDocuments: [
  "_bmad-output/index.md",
  "_bmad-output/project-overview.md",
  "_bmad-output/architecture.md",
  "_bmad-output/component-inventory-root.md"
]
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 4
workflowType: 'prd'
lastStep: 0
project_name: 'node-switch'
user_name: '青山'
date: '2025-12-24'
---

# Product Requirements Document - node-switch

**Author:** 青山
**Date:** 2025-12-24

## Executive Summary

This PRD outlines critical enhancements to the `node-switch` hardware control system, specifically targeting the Ammunition Application workflow (`apply-ammo-machine`). The goal is to enforce stricter physical security protocols and improve user feedback during the ammo retrieval process.

By integrating precise door state monitoring (`CABINET_DOOR_INDEX`) and real-time voice guidance, the system will move from a passive flow to an active, state-aware control loop. This ensures that the cabinet door is not just "unlocked" but actively monitored for "Open" and "Closed" states in a specific sequence, preventing invalid state transitions and ensuring the secure completion of the retrieval task.

### Why This Matters

The key value of this feature is **Strict State Enforcement**: the system will physically verify that the door has been opened and then closed before marking the transaction as complete. This, combined with specific voice prompts (e.g., "Please close the door"), reduces human error and security risks in the ammo handling process, transforming a simple switch controller into an intelligent safety supervisor.

## Project Classification

**Technical Type:** IoT / Backend Service
**Domain:** Hardware Automation (Security)
**Complexity:** Medium (Real-time state machines, hardware safeguards)
**Project Context:** Brownfield - Enhancing `apply-ammo-machine` logic
