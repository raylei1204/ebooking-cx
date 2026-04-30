# Phase 3: Booking Create, Update, and Numbering API

## Goal

Implement the backend write path for Save as Draft, Submit, and Draft update, including validation rules, Sea-mode persistence behavior, and atomic EBooking number generation.

## Files Likely To Change

- `packages/api/src/bookings/bookings.controller.ts`
- `packages/api/src/bookings/bookings.service.ts`
- `packages/api/src/bookings/booking-number.service.ts`
- `packages/api/src/bookings/bookings.module.ts`
- `packages/api/src/bookings/constants/*`
- `packages/api/src/bookings/dto/*`
- `packages/api/src/bookings/bookings.service.test.ts`
- `packages/api/src/bookings/bookings.controller.test.ts`
- `packages/api/src/database/prisma.service.ts` only if transaction helpers or raw-lock support need a small extension
- `packages/shared/src/booking/types.ts`

## Step-by-Step Checklist

- [ ] Implement `POST /api/v1/internal/bookings` to support both draft creation and submit creation from the same payload shape.
- [ ] Implement `PATCH /api/v1/internal/bookings/:bookingId` for draft-only updates.
- [ ] Add server-side validation branching so Draft only requires Ship Mode, while Submit enforces the full cross-tab rules from the spec.
- [ ] Validate party IDs, port IDs, PO row minimum rules, date ordering, numeric rules, sea-only requirements, and FCL container-count rules.
- [ ] Persist booking parties as copied snapshot rows so booking edits do not mutate the `parties` master.
- [ ] Persist computed `volume_weight` and `chargeable_weight` from the request while still validating that numeric inputs are valid.
- [ ] Implement the “Sea detail row must be absent for Air” rule, including deletion of any existing sea-detail row when a draft switches from Sea to Air.
- [ ] Add a clearly commented server-side constant for `companyCode = 'arc'` in one location only.
- [ ] Implement `BookingNumberService` with UTC date partitioning, row-level locking on `booking_sequences`, and zero-padded 5-digit sequence formatting.
- [ ] Ensure Submit creates a unique EBooking number and Draft never does.
- [ ] Return the correct status codes and error bodies for validation failures, missing parties or ports, missing bookings, and non-editable submitted bookings.
- [ ] Add backend tests for Draft-vs-Submit validation, Sea-to-Air clearing behavior, party/port not found cases, submitted-booking edit rejection, and concurrent numbering uniqueness.

## Acceptance Criteria

- Save as Draft succeeds with only Ship Mode present and returns `201` with `status: 'DRAFT'` and `eBookingNumber: null`.
- Submit enforces the required validations across Booking Information, Shipment Detail, Marks and Number, and PO Detail.
- Draft updates are allowed only while `status = DRAFT`, and submitted bookings return `400 BOOKING_NOT_EDITABLE`.
- EBooking numbers always use the `arcYYYYMMDD00001` pattern and are generated atomically on Submit only.

## Out-of-Scope Items

- `GET` booking retrieval and draft-list lookup behavior
- Party search and port search endpoints
- `.xlsx` PO import endpoint
- Internal form UI wiring
