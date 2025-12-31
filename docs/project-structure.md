# Project Structure

## Repository Type

**Multi-Part Project** - A hardware controller system with separate backend and frontend components.

## Project Parts

| Part ID | Name | Root Path | Technology | Description |
|---------|------|-----------|------------|-------------|
| `backend` | Go Backend | `backend/` | Go 1.21 | Hardware control backend server |
| `frontend` | React Frontend | `frontend/` | React 19, Vite, TypeScript | Web UI dashboard |
| `reference` | Legacy Reference | `reference/` | Node.js/TypeScript | Original Node.js implementation (reference) |

## Project Overview

This is a **hardware controller system** (feeding management system) being rewritten from Node.js/TypeScript to Go backend with React frontend. The project is in active migration phase.

- **Primary Language**: Go (backend), TypeScript (frontend)
- **Architecture Pattern**: Client-Server (REST/WebSocket)
- **Migration Status**: Backend rewritten in Go, frontend being refactored
