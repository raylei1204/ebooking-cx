# Auth Module Execution Plan

## Goal

Break the auth module spec into small execution phases that can each be completed in a single Codex session without mixing too many concerns.

## Scope Summary

- Backend: Prisma schema, seeds, NestJS auth, organization APIs, user APIs, guards, and API envelopes
- Frontend: internal app bootstrap, login flow, route guards, admin shell, and organization/user management screens
- Integration: backend tests, frontend tests, Podman-backed verification, and docs/env updates

## Current Baseline

- `packages/db` contains only a minimal `users` Prisma model
- `packages/api` contains only the Nest app shell
- `apps/internal` has no implemented Vue app yet
- `packages/shared` is effectively empty

## Execution Order

1. [01-schema-and-seed-foundation.md](./01-schema-and-seed-foundation.md)
2. [02-shared-contracts-and-api-bootstrap.md](./02-shared-contracts-and-api-bootstrap.md)
3. [03-auth-endpoints-and-guards.md](./03-auth-endpoints-and-guards.md)
4. [04-organization-management-api.md](./04-organization-management-api.md)
5. [05-user-management-api.md](./05-user-management-api.md)
6. [06-internal-auth-shell-and-login.md](./06-internal-auth-shell-and-login.md)
7. [07-organization-management-ui.md](./07-organization-management-ui.md)
8. [08-integration-and-verification.md](./08-integration-and-verification.md)

## Dependency Notes

- Phase 1 must land before any backend business logic.
- Phase 2 establishes shared types and Nest infrastructure used by Phases 3 to 5.
- Phase 3 must land before frontend login and route guards.
- Phases 4 and 5 provide the APIs required by the organization management UI.
- Phase 6 provides the internal app shell required by Phase 7.
- Phase 8 is the final hardening pass and should run after the functional phases are complete.

## Phase Boundaries

- Keep Prisma and seed work isolated to Phase 1.
- Keep shared contracts and cross-cutting Nest setup isolated to Phase 2.
- Keep auth backend work isolated to Phase 3.
- Keep organization backend work isolated to Phase 4.
- Keep user backend work isolated to Phase 5.
- Keep login/auth-shell frontend work isolated to Phase 6.
- Keep organization/user admin UI work isolated to Phase 7.
- Keep end-to-end verification and documentation cleanup isolated to Phase 8.

## Delivery Rules

- Each phase should be executable in one Codex session.
- Each phase should change only its listed area unless a blocker requires a small supporting adjustment.
- Do not fold later-phase UI or integration work into earlier backend sessions.
- Preserve the API envelope, auth rules, and UI guide constraints from `CLAUDE.md`, `docs/UI_GUIDE.md`, and `docs/specs/auth.md`.
