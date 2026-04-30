# Booking Module Execution Plan

## Goal

Break the new booking spec into small execution phases that can each be completed in a single Codex session without mixing schema, backend, frontend, and verification work.

## Scope Summary

- Backend: Prisma schema, booking module APIs, validation, draft handling, PO import parsing, and EBooking number generation
- Frontend: internal new-booking route, four-tab form, lookup flows, draft import, dirty-state prompts, and PO table/import UX
- Shared contracts: request and response types used by the NestJS API and the Vue internal app
- Verification: backend tests, frontend tests, and feature-level validation against the booking acceptance criteria

## Current Baseline

- `packages/db` has Prisma models only for auth and organization foundations
- `packages/api` has auth, users, organizations, and shared response infrastructure but no booking module yet
- `apps/internal` has the authenticated shell, router, API client utilities, and one management page pattern to reuse
- `packages/shared` has auth, response, organization, and user contracts but no booking domain contracts yet

## Execution Order

1. [01-schema-and-reference-foundation.md](./01-schema-and-reference-foundation.md)
2. [02-shared-booking-contracts-and-api-scaffolding.md](./02-shared-booking-contracts-and-api-scaffolding.md)
3. [03-booking-create-update-and-numbering-api.md](./03-booking-create-update-and-numbering-api.md)
4. [04-booking-read-and-lookup-api.md](./04-booking-read-and-lookup-api.md)
5. [05-po-import-api.md](./05-po-import-api.md)
6. [06-internal-booking-page-foundation.md](./06-internal-booking-page-foundation.md)
7. [07-internal-booking-form-workflows.md](./07-internal-booking-form-workflows.md)
8. [08-po-detail-ui-and-feature-verification.md](./08-po-detail-ui-and-feature-verification.md)

## Dependency Notes

- Phase 1 must land before any booking service or controller can persist data.
- Phase 2 establishes the shared type layer and module skeleton used by the remaining backend and frontend phases.
- Phase 3 provides the write path required by the main form actions.
- Phase 4 provides the read path and lookup endpoints required by form hydration and draft import.
- Phase 5 depends on Phase 2 and can land before or after Phase 4, but should be complete before the PO tab UI is finished.
- Phase 6 sets up the route, page shell, state model, and computed-field foundation required by later UI work.
- Phase 7 depends on Phases 3, 4, and 6 for full booking workflows.
- Phase 8 depends on every earlier phase and is the final hardening pass.

## Phase Boundaries

- Keep Prisma schema and migration work isolated to Phase 1.
- Keep shared contracts and booking module registration isolated to Phase 2.
- Keep create, update, submit validation, and numbering logic isolated to Phase 3.
- Keep read and lookup endpoints isolated to Phase 4.
- Keep `.xlsx` parser upload handling isolated to Phase 5.
- Keep page shell, tabs, form state, and computed UI behaviors isolated to Phase 6.
- Keep save, draft, lookup, draft import, and sea-mode workflows isolated to Phase 7.
- Keep PO tab UI, file import UX, and final verification isolated to Phase 8.

## Delivery Rules

- Each phase should be executable in one Codex session.
- Each phase should modify only the files listed in that phase unless a small supporting change is required.
- Do not pull Print, Email sending, CargoWise integration, customer-portal work, booking list/search, or admin master-data management into these phases.
- Preserve the API envelope, auth guards, NestJS conventions, Prisma usage, and `docs/UI_GUIDE.md` rules throughout implementation.
