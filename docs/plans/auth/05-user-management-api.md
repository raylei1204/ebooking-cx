# Phase 5: User Management API

## Goal

Implement the admin-only user management backend flows, including organization user lists, admin user lists, user CRUD, and password changes.

## Files Likely To Change

- `packages/api/src/app.module.ts`
- `packages/api/src/users/users.module.ts`
- `packages/api/src/users/users.controller.ts`
- `packages/api/src/users/users.service.ts`
- `packages/api/src/users/dto/*`
- `packages/api/src/users/users.service.test.ts`
- `packages/api/src/users/users.controller.test.ts`
- `packages/shared/src/user/*`

## Step-by-Step Checklist

- [ ] Create a dedicated users module and register it in the app module.
- [ ] Add DTOs for create user, update user, change password, and list query payloads.
- [ ] Protect every `/api/v1/internal/users*` and `/api/v1/internal/organizations/:id/users` route with admin-only guards.
- [ ] Implement list users for a selected organization.
- [ ] Implement list admin users with `organizationId: null` and `roles: ['admin']` semantics.
- [ ] Implement user creation with default password `123456`, hashed storage, and multi-role assignment.
- [ ] Enforce the admin-user rule that admin users are organization-less and carry the `admin` role shape.
- [ ] Implement update user behavior for profile fields, disabled state, organization assignment, and role assignment.
- [ ] Surface a warning-capable response shape or metadata strategy for role-to-organization-type mismatches without blocking the save.
- [ ] Implement delete user behavior and password change behavior, including invalidating all refresh tokens after password changes.
- [ ] Add backend tests for admin creation, organization user creation, multi-role assignment, disabled state updates, password-change token invalidation, and admin-only route protection.

## Acceptance Criteria

- All user management routes from the auth spec exist and are admin-protected.
- User create, update, delete, list, and password-change flows follow the documented business rules.
- Password changes invalidate all existing refresh tokens for that user.
- Tests cover the core role, organization, and disabled-state behaviors for user management.

## Out-of-Scope Items

- Organization CRUD and relationship endpoints
- Frontend user modals or admin tables
- Customer portal auth
- Final cross-stack integration tests
