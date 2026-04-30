# Phase 7: Organization Management UI

## Goal

Implement the internal admin organization management experience, including tabs, tables, and modals for organizations, relationships, users, and password changes.

## Files Likely To Change

- `apps/internal/src/router/index.ts`
- `apps/internal/src/pages/system/organization/*`
- `apps/internal/src/components/organizations/*`
- `apps/internal/src/components/users/*`
- `apps/internal/src/services/api/organizations.ts`
- `apps/internal/src/services/api/users.ts`
- `apps/internal/src/composables/*`
- `apps/internal/src/styles/*`
- `packages/shared/src/organization/*`
- `packages/shared/src/user/*`

## Step-by-Step Checklist

- [ ] Add the `/system/organization` route under the protected admin shell.
- [ ] Build the top-level Organization page with title, subtitle, and tabs for `Shipper`, `Consignee`, `Agent`, and `Admin user`.
- [ ] Build the shared loading, empty, and error state handling for the data views using the patterns required by `docs/UI_GUIDE.md`.
- [ ] Implement the left-panel organization list table for the three organization tabs, including selection, type badges, pagination, refresh, and row actions.
- [ ] Implement the right-panel selected-organization user table, including refresh, empty state, status display, and row actions.
- [ ] Build the Admin user tab table with row selection and action buttons enabled only when a row is selected.
- [ ] Build the Create/Edit Organization modal with Details and Relationships tabs.
- [ ] Implement the Relationships tab behavior, including immediate add/remove API calls, self-exclusion in selectors, and delete confirmations.
- [ ] Build the Create/Edit User modal with create-only initial-password text and a placeholder User Permission tab.
- [ ] Build the Change Password modal with match validation and success messaging.
- [ ] Wire create, edit, delete, refresh, and password-change actions to the backend with success and error feedback using Element Plus messaging patterns.
- [ ] Add frontend tests for tab switching, modal validation, key admin actions, and blocked delete/error handling.

## Acceptance Criteria

- The Organization management route matches the layout and behavior described in the auth spec.
- Organization, relationship, and user actions are wired to the backend and refresh the relevant tables correctly.
- The page uses only approved Element Plus patterns and UI guide styling constraints.
- Frontend tests cover the main admin workflows and critical validation/error states.

## Out-of-Scope Items

- Login page and auth shell foundation
- Backend endpoint implementation
- Customer portal auth or user management
- Final integration hardening across the whole stack
