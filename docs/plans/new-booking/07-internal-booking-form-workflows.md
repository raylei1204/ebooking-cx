# Phase 7: Internal Booking Form Workflows

## Goal

Wire the booking form to the backend for save, submit, draft update, and draft import, while implementing the party, port, validation, and dirty-state workflows across the first three tabs.

## Files Likely To Change

- `apps/internal/src/pages/booking/NewBookingPage.vue`
- `apps/internal/src/pages/booking/NewBookingPage.test.ts`
- `apps/internal/src/components/booking/*`
- `apps/internal/src/services/api/internal-admin.ts` or the booking API client file
- `apps/internal/src/services/api/client.ts` only if upload or query helpers need a small extension
- `apps/internal/src/composables/*` or `apps/internal/src/stores/*`
- `packages/shared/src/booking/types.ts`

## Step-by-Step Checklist

- [ ] Add typed client methods for create booking, update draft, get booking, list drafts, search parties, and search ports if they are not already finished.
- [ ] Build searchable Shipper, Consignee, Notify Party 1, and Notify Party 2 selectors backed by the party search endpoint.
- [ ] Auto-populate party name and address fields on selection while keeping them editable within the booking form only.
- [ ] Build searchable Origin, Destination, and Final Destination selectors backed by the port search endpoint and current ship-mode filter.
- [ ] Add submit-time validation messaging for required fields, date ordering, freight-charge exclusivity, battery declaration, and Sea-mode rules.
- [ ] Implement Freight Charges as mutually exclusive required options and Other Charges as mutually exclusive optional options.
- [ ] Implement Incoterm and Sample Shipment controls with the exact allowed values from the spec.
- [ ] Implement Sea-mode controls for Service Require single-select checkbox behavior, Optional Services multi-select, BL requirement dropdown, Shipment Type toggle, and FCL-only container-count enablement.
- [ ] Wire Save as Draft and Save to the backend with the correct `isDraft` behavior, success messaging, field-level error surfacing, and returned EBooking Number display after Submit.
- [ ] Implement draft editing and draft import rehydration, including the dirty-form confirmation before replacement.
- [ ] Add browser unsaved-changes protection for navigation away from a dirty form.
- [ ] Add frontend tests for party auto-fill, port lookup filtering, mutually exclusive charge controls, save-vs-submit behavior, dirty-form prompts, and imported-draft rehydration.

## Acceptance Criteria

- The form supports searchable party and port lookups and correctly copies editable booking-time snapshots into form state.
- Save as Draft and Save submit the correct payloads, surface backend validation cleanly, and update the page with returned booking identifiers and status.
- Dirty-form prompts appear for both page exit and draft import replacement.
- Shipment Detail, Marks and Number, and Sea-mode behaviors match the booking spec and UI guide constraints.

## Out-of-Scope Items

- PO table row editing and `.xlsx` preview import UX
- Backend endpoint implementation already covered by earlier phases
- Print, Email, or HAWB notification flows
- Booking list/search page work
