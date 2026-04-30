# Phase 4: Booking Read and Lookup API

## Goal

Implement the backend read and lookup endpoints needed to load bookings, import drafts, and power party and port searchable dropdowns.

## Files Likely To Change

- `packages/api/src/bookings/bookings.controller.ts`
- `packages/api/src/bookings/bookings.service.ts`
- `packages/api/src/bookings/dto/*`
- `packages/api/src/bookings/bookings.service.test.ts`
- `packages/api/src/bookings/bookings.controller.test.ts`
- `packages/shared/src/booking/types.ts`
- `apps/internal/src/services/api/internal-admin.ts` or the booking API client file introduced earlier

## Step-by-Step Checklist

- [ ] Implement `GET /api/v1/internal/bookings/:bookingId` to return the full editable booking payload shape needed to rehydrate the form.
- [ ] Implement `GET /api/v1/internal/bookings?status=DRAFT&page=&limit=` for the draft picker, including pagination metadata in the response envelope.
- [ ] Implement `GET /api/v1/internal/parties` with optional partial-name search, pagination defaults, and consistent summary output.
- [ ] Implement `GET /api/v1/internal/ports` with search by code or name and optional ship-mode filtering using `mode IN (requestedMode, 'BOTH')`.
- [ ] Preserve the spec decision that port mode filtering is a UX hint only, not a hard submit-time rejection rule.
- [ ] Include the “party no longer exists” support detail in the returned booking shape if the saved `party_id` no longer resolves cleanly.
- [ ] Ensure every route stays protected by JWT plus staff/admin role guards.
- [ ] Add backend tests for booking not found, draft-only list filtering, pagination meta shape, party search matching, and AIR/SEA/BOTH port filtering behavior.
- [ ] Add or finalize typed frontend client methods for get-booking, list-drafts, search-parties, and search-ports.

## Acceptance Criteria

- The internal app can fetch a full booking by ID for display or draft import.
- Draft list responses include only draft bookings plus the required pagination envelope.
- Party search and port search return typed lookup results suitable for searchable dropdowns.
- Port search honors the requested mode filter while still allowing `BOTH` records in results.

## Out-of-Scope Items

- Create, submit, or patch booking write logic
- `.xlsx` upload parsing
- Form rendering and UI state management
- Print, Email, or CargoWise follow-up behavior
