# Phase 3: Auth Endpoints And Guards

## Goal

Implement backend authentication for login, refresh, logout, JWT validation, and role-aware guards without mixing in organization or user management features.

## Files Likely To Change

- `packages/api/src/app.module.ts`
- `packages/api/src/auth/auth.module.ts`
- `packages/api/src/auth/auth.controller.ts`
- `packages/api/src/auth/auth.service.ts`
- `packages/api/src/auth/dto/*`
- `packages/api/src/auth/strategies/*`
- `packages/api/src/auth/guards/*`
- `packages/api/src/auth/decorators/*`
- `packages/api/src/auth/types/*`
- `packages/api/src/auth/auth.service.test.ts`
- `packages/api/src/auth/auth.controller.test.ts`
- `packages/api/src/common/guards/*`

## Step-by-Step Checklist

- [ ] Create the Nest auth module structure and register it in the app module.
- [ ] Implement DTOs for login, refresh, and logout requests using the validation approach established in Phase 2.
- [ ] Add password hashing and password verification helpers based on bcrypt.
- [ ] Implement login credential validation against the Prisma-backed user and role data.
- [ ] Return `401` for invalid credentials and `403` for disabled users, matching the spec.
- [ ] Issue access tokens with a 15-minute lifetime and refresh tokens with a 7-day lifetime.
- [ ] Persist refresh tokens as hashes in `refresh_tokens` and rotate them on refresh.
- [ ] Implement logout so an authenticated user can revoke a refresh token cleanly.
- [ ] Add JWT strategy support and a reusable `JwtAuthGuard`.
- [ ] Add a reusable `RolesGuard` and `@Roles()` decorator for later admin-only system routes.
- [ ] Add unit and controller tests for login success, invalid credentials, disabled-user rejection, refresh rotation, expired refresh token rejection, and logout revocation.

## Acceptance Criteria

- `/api/v1/auth/login`, `/api/v1/auth/refresh`, and `/api/v1/auth/logout` exist and follow the required envelope and status behavior.
- JWT validation and role-based guard infrastructure are available for later internal routes.
- Refresh tokens are stored hashed and rotated or revoked correctly.
- Auth tests cover the main success and failure paths for the three endpoints.

## Out-of-Scope Items

- Organization CRUD or relationship endpoints
- User CRUD and password-change admin flows
- Frontend login page and route guards
- Final Podman-backed integration verification
