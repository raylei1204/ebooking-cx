# Phase 1: Schema and Reference Foundation

## Goal

Add the booking-related Prisma schema, migration, and database exports needed to support draft and submitted bookings, reference masters, and sequence tracking.

## Files Likely To Change

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/<timestamp>_booking_foundation/*`
- `packages/db/src/index.ts`
- `packages/db/src/client.ts`
- `packages/db/package.json`
- `packages/api/src/database/*` if the current Prisma integration needs generated model access updates
- `packages/db/prisma/seed.ts` only if the existing seed flow must explicitly ignore empty booking reference tables

## Step-by-Step Checklist

- [ ] Review the existing Prisma naming and mapping conventions so the new booking models match current style.
- [ ] Add Prisma enums for booking status, ship mode, booking party role, charge type, sea service values, shipment type, port mode, and bill-of-lading requirement.
- [ ] Add Prisma models for `bookings`, `booking_parties`, `booking_shipment_details`, `booking_sea_details`, `booking_marks`, `booking_po_details`, `parties`, `port_info`, and `booking_sequences`.
- [ ] Add all indexes, uniqueness rules, nullable rules, and relation behaviors required by the spec, including the per-role uniqueness on `booking_parties` and per-day uniqueness on `booking_sequences`.
- [ ] Represent the “Sea detail row deleted when switching to Air” requirement in a way the service layer can enforce cleanly later.
- [ ] Generate and review the Prisma migration to confirm the SQL reflects the spec, especially decimal precision, enum values, and foreign keys.
- [ ] Update package exports or generated client access points if the repo expects explicit exports for new Prisma types.
- [ ] Add or update schema-level tests only if the repo already validates Prisma contracts in this area; otherwise keep verification to migration generation and focused service-facing checks in later phases.

## Acceptance Criteria

- All booking-related tables and enums from the spec exist in Prisma with the correct field names, types, and constraints.
- The schema supports both `DRAFT` and `SUBMITTED` bookings, nullable EBooking and HAWB numbers, and a separate `booking_sequences` table for atomic numbering.
- `parties` and `port_info` exist as empty reference tables without introducing seed-data scope creep.
- The migration is limited to booking data-model changes and does not rewrite unrelated auth or organization tables.

## Out-of-Scope Items

- Booking controllers, services, DTOs, or route handlers
- Any frontend page, route, or state work
- Seed data for `parties` or `port_info`
- CargoWise, Print, or Email implementation
