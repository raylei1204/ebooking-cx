# Phase 2: Shared Booking Contracts and API Scaffolding

## Goal

Create the shared booking domain types and the NestJS booking module scaffolding that later phases will build on.

## Files Likely To Change

- `packages/shared/src/booking/types.ts`
- `packages/shared/src/booking/index.ts`
- `packages/shared/src/index.ts`
- `packages/api/src/app.module.ts`
- `packages/api/src/bookings/bookings.module.ts`
- `packages/api/src/bookings/bookings.controller.ts`
- `packages/api/src/bookings/bookings.service.ts`
- `packages/api/src/bookings/dto/*`
- `packages/api/src/bookings/constants/*`
- `packages/api/src/bookings/bookings.controller.test.ts`
- `packages/api/src/contracts/shared-contracts.test.ts`
- `apps/internal/src/services/api/internal-admin.ts` or a new booking-focused internal API client file if the team prefers domain split by feature

## Step-by-Step Checklist

- [ ] Review how existing shared contracts are organized so booking types fit the current `packages/shared` export pattern.
- [ ] Add booking domain types for create/update payloads, booking summaries, lookup results, PO import responses, and any shared enums used by both API and UI.
- [ ] Export the booking domain from `packages/shared/src/index.ts`.
- [ ] Create the booking module folder structure with controller, service, DTO barrel, and constants placeholders that compile but do not yet implement full business logic.
- [ ] Define DTOs for create/update booking requests, list draft filters, lookup filters, and PO import constraints with explicit typing and validation-friendly shapes.
- [ ] Register the booking module in `packages/api/src/app.module.ts`.
- [ ] Add route skeletons for:
- [ ] `POST /api/v1/internal/bookings`
- [ ] `PATCH /api/v1/internal/bookings/:bookingId`
- [ ] `GET /api/v1/internal/bookings/:bookingId`
- [ ] `GET /api/v1/internal/bookings`
- [ ] `GET /api/v1/internal/parties`
- [ ] `GET /api/v1/internal/ports`
- [ ] `POST /api/v1/internal/bookings/po-import`
- [ ] Protect every booking-related route with `JwtAuthGuard`, `RolesGuard`, and `@Roles('staff', 'admin')`.
- [ ] Add contract-level tests to confirm shared booking response shapes stay aligned with the API envelope conventions.
- [ ] Add or stub the frontend API client surface area so later UI phases can call typed methods without redefining payloads.

## Acceptance Criteria

- Booking types exist in `packages/shared` and are exported for both backend and frontend use.
- The API module is registered and exposes the correct route skeletons under `/api/v1/internal/...`.
- Booking endpoints are auth-protected with the required staff/admin role restriction.
- No booking business logic is implemented beyond safe scaffolding and typing foundations.

## Out-of-Scope Items

- Full create, patch, submit, or lookup behavior
- Prisma persistence logic beyond what is needed to compile
- New booking page UI
- `.xlsx` parsing implementation
