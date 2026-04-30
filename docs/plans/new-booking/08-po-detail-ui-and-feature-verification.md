# Phase 8: PO Detail UI and Feature Verification

## Goal

Implement the PO Detail tab interactions and complete focused verification of the booking feature across backend and frontend acceptance criteria.

## Files Likely To Change

- `apps/internal/src/pages/booking/NewBookingPage.vue`
- `apps/internal/src/pages/booking/NewBookingPage.test.ts`
- `apps/internal/src/components/booking/*`
- `apps/internal/src/services/api/internal-admin.ts` or the booking API client file
- `packages/api/src/bookings/bookings.service.test.ts`
- `packages/api/src/bookings/bookings.controller.test.ts`
- `docs/plans/booking/*` only if minor clarification notes are needed after verification

## Step-by-Step Checklist

- [ ] Build the editable PO Detail table using Element Plus table patterns from `docs/UI_GUIDE.md`.
- [ ] Add `+ Add PO` to insert a new blank row and preserve row order in local state.
- [ ] Add checkbox row selection and keep Delete selection disabled until at least one row is selected.
- [ ] Remove only selected rows when Delete selection is confirmed or triggered.
- [ ] Add `.xlsx` upload wiring to the PO import endpoint and merge returned valid rows into preview state without persisting immediately.
- [ ] Surface returned `parseErrors` in a user-readable way that stays within existing UI patterns and avoids inventing a new design system.
- [ ] Enforce local row validation for required PO Number and numeric fields before Save as Draft or Submit.
- [ ] Verify duplicate PO numbers are accepted and row numbering is normalized when assembling the save payload.
- [ ] Add frontend tests for add-row, delete-selection enablement, valid import preview, rejected import scenarios, and mixed valid/invalid import results.
- [ ] Run the relevant backend and frontend test suites for the booking module and fix any booking-specific gaps revealed by the results.
- [ ] Perform an acceptance-criteria pass against the booking spec and confirm no out-of-scope items were implemented.

## Acceptance Criteria

- The PO Detail tab supports manual row entry, selective deletion, and `.xlsx` preview import in line with the spec.
- Invalid import scenarios are surfaced correctly without adding rows, while mixed files still preview valid rows plus parse errors.
- Save as Draft and Submit reject PO rows that are missing `poNumber`.
- Booking feature tests cover the highest-risk backend and frontend workflows, and verification confirms no scope creep into Print, Email, CargoWise, or booking list features.

## Out-of-Scope Items

- Additional PO export/download functionality
- Non-`.xlsx` import formats
- Separate reporting or analytics screens
- Any follow-up feature beyond booking verification
