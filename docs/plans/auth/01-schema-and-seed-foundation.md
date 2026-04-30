# Phase 1: Schema And Seed Foundation

## Goal

Replace the current minimal auth schema with the full auth data model and establish the initial role and admin seed foundation.

## Files Likely To Change

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*`
- `packages/db/prisma/seed.ts`
- `packages/db/package.json`
- `.env.example`
- `packages/db/src/index.ts`

## Step-by-Step Checklist

- [ ] Review the current Prisma schema and migration history to confirm what must be replaced versus extended.
- [ ] Model `roles`, `organizations`, `organization_relationships`, `users`, `user_roles`, and `refresh_tokens` in Prisma with `snake_case` mappings and timestamp fields.
- [ ] Remove the old single-role assumption from `users` and model admin users with nullable `organization_id`.
- [ ] Represent organization type flags as booleans and document the “at least one type flag” rule for later service-layer validation.
- [ ] Model symmetric organization relationships in a way the application layer can normalize and deduplicate pairs.
- [ ] Generate a Prisma migration that brings the database from the current baseline to the full auth schema.
- [ ] Add a Prisma seed script that inserts the fixed roles: `admin`, `shipper`, `consignee`, and `agent`.
- [ ] Add seed support for an initial admin user with a placeholder password flow driven by environment variables.
- [ ] Update `.env.example` with any new auth/bootstrap variables needed by seeds or JWT configuration.
- [ ] Verify the planning assumptions for dev/test DB usage remain aligned with the Podman-based workflow in `CLAUDE.md`.

## Acceptance Criteria

- The Prisma schema fully reflects the auth spec data model.
- Migration files exist for the new schema and do not leave the old single-role design in place.
- Seed logic exists for fixed roles and an initial admin bootstrap path.
- `.env.example` includes placeholders for all new auth-related environment variables introduced in this phase.

## Out-of-Scope Items

- NestJS auth modules, controllers, guards, or DTOs
- Shared TypeScript contracts
- Frontend login or admin UI
- Endpoint tests beyond schema/seed smoke checks
