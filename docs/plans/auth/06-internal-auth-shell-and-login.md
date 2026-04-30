# Phase 6: Internal Auth Shell And Login

## Goal

Create the internal Vue app foundation for authentication: app bootstrap, login page, auth state, route guards, and the protected shell layout.

## Files Likely To Change

- `apps/internal/package.json`
- `apps/internal/tsconfig.json`
- `apps/internal/src/main.ts`
- `apps/internal/src/App.vue`
- `apps/internal/src/router/index.ts`
- `apps/internal/src/layouts/*`
- `apps/internal/src/pages/login/*`
- `apps/internal/src/pages/forbidden/*`
- `apps/internal/src/pages/dashboard/*`
- `apps/internal/src/stores/auth.ts`
- `apps/internal/src/services/api/*`
- `apps/internal/src/components/navigation/*`
- `apps/internal/src/styles/*`
- `packages/shared/src/auth/*`

## Step-by-Step Checklist

- [ ] Scaffold the real Vue 3 internal app entrypoint, router, and Element Plus integration.
- [ ] Create a typed API client layer for auth requests and authenticated requests to the Nest backend.
- [ ] Add auth state management for access token, refresh token, current user, login action, logout action, and refresh handling.
- [ ] Implement route metadata and guards for public routes, authenticated routes, and admin-only `/system/*` routes.
- [ ] Add redirect behavior so unauthenticated users go to `/login`, authenticated users avoid the login page, and non-admin users are sent to a `403` page for system routes.
- [ ] Build the `/login` page according to `docs/UI_GUIDE.md` and `docs/specs/auth.md`, including disabled sign-up, tooltip, inline invalid-credential error, and loading states.
- [ ] Build the protected internal shell with sidebar, top bar, current-user display, sidebar collapse behavior, and the `System management -> Organization` navigation item.
- [ ] Add logout behavior that clears auth state and returns the user to `/login`.
- [ ] Add frontend tests for login flow, basic route guards, and auth redirect behavior.

## Acceptance Criteria

- `apps/internal` runs as a real Vue app with Element Plus and router support.
- Login works against the auth API and handles loading and invalid-credential states correctly.
- Route protection behavior matches the spec for public, authenticated, and admin-only routes.
- The protected shell is ready for later organization management pages without introducing off-spec UI styling.

## Out-of-Scope Items

- Organization and user management tables or modals
- Backend auth endpoint implementation
- Full dashboard feature work beyond a placeholder protected page
- Podman-backed end-to-end verification
