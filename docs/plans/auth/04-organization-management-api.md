# Phase 4: Organization Management API

## Goal

Implement the admin-only organization and relationship backend APIs as a focused module, using the auth guards from the earlier phase.

## Files Likely To Change

- `packages/api/src/app.module.ts`
- `packages/api/src/organizations/organizations.module.ts`
- `packages/api/src/organizations/organizations.controller.ts`
- `packages/api/src/organizations/organizations.service.ts`
- `packages/api/src/organizations/dto/*`
- `packages/api/src/organizations/organizations.service.test.ts`
- `packages/api/src/organizations/organizations.controller.test.ts`
- `packages/shared/src/organization/*`

## Step-by-Step Checklist

- [ ] Create a dedicated organizations module and register it in the app module.
- [ ] Add DTOs for list filters, create organization, update organization, create relationship, and delete relationship requests.
- [ ] Protect every `/api/v1/internal/organizations*` route with `JwtAuthGuard`, `RolesGuard`, and `@Roles('admin')`.
- [ ] Implement organization list logic with combinable `isShipper`, `isConsignee`, and `isAgent` filters.
- [ ] Implement organization create and update logic, including validation that at least one type flag is set.
- [ ] Implement organization delete logic with the required `409` behavior when users still belong to the organization.
- [ ] Implement relationship listing for a selected organization.
- [ ] Implement relationship creation with symmetric pair normalization, self-link rejection, and duplicate-link rejection.
- [ ] Implement relationship deletion by relationship ID under the selected organization route shape.
- [ ] Add backend tests for filter behavior, type-flag validation, blocked delete, self-link rejection, and duplicate relationship rejection.

## Acceptance Criteria

- All organization routes from the auth spec exist and are admin-protected.
- Organization create, update, delete, and list behaviors match the documented business rules.
- Relationship APIs enforce symmetric uniqueness and reject invalid link scenarios.
- Tests cover the main business rules and route-protection expectations for this module.

## Out-of-Scope Items

- User CRUD, password change, or admin user list endpoints
- Login, refresh, or logout work
- Vue organization management page and modals
- Final frontend/backend integration wiring
