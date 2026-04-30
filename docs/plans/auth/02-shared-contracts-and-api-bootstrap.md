# Phase 2: Shared Contracts And API Bootstrap

## Goal

Create the shared TypeScript contracts and backend infrastructure that later auth, organization, and user phases will build on.

## Files Likely To Change

- `packages/shared/src/auth/*`
- `packages/shared/src/organization/*`
- `packages/shared/src/user/*`
- `packages/shared/src/index.ts`
- `packages/shared/package.json`
- `packages/api/package.json`
- `packages/api/src/app.module.ts`
- `packages/api/src/main.ts`
- `packages/api/src/common/**`
- `packages/api/src/database/**`

## Step-by-Step Checklist

- [ ] Create a real `packages/shared/src` structure and export surface instead of the current placeholder-only setup.
- [ ] Define shared interfaces/types for role names, authenticated user summaries, login payloads, token responses, organization payloads, and user payloads.
- [ ] Add shared response envelope types for success and error responses so backend and frontend can align early.
- [ ] Add backend dependencies needed for config loading, validation, Prisma module wiring, JWT support, and password hashing.
- [ ] Create a reusable database module in `packages/api` that exposes the Prisma client cleanly to Nest services.
- [ ] Add global request validation and any app bootstrap setup that should apply consistently across auth and admin endpoints.
- [ ] Add a common API response/error shaping approach that matches the envelope conventions from `CLAUDE.md`.
- [ ] Organize `packages/api/src/common` so guards, decorators, filters, interceptors, and DTO helpers have a stable home before feature modules are added.
- [ ] Export only the contracts and utilities later phases need so feature work can stay narrowly focused.

## Acceptance Criteria

- `packages/shared` has a usable source layout with exported auth, organization, user, and response contract types.
- `packages/api` has the minimum shared infrastructure needed for feature modules without yet implementing auth business logic.
- The backend bootstrap path supports validation and consistent response/error handling.
- Later phases can reference established shared types and common backend folders without needing structural rework.

## Out-of-Scope Items

- Login, refresh, or logout endpoint implementations
- Organization or user CRUD logic
- Vue app scaffolding and UI screens
- End-to-end integration setup
