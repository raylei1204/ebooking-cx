# Phase 6: Internal Booking Page Foundation

## Goal

Build the internal app route, page shell, and booking form state foundation, including the four-tab layout, read-only booking identifiers, and computed shipment-weight behavior.

## Files Likely To Change

- `apps/internal/src/router/index.ts`
- `apps/internal/src/layouts/InternalShellLayout.vue` if navigation needs a new New Booking entry
- `apps/internal/src/pages/booking/NewBookingPage.vue`
- `apps/internal/src/pages/booking/NewBookingPage.test.ts`
- `apps/internal/src/components/booking/*`
- `apps/internal/src/services/api/internal-admin.ts` or the booking API client file
- `apps/internal/src/stores/*` or `apps/internal/src/composables/*` for booking-form state helpers
- `packages/shared/src/booking/types.ts`

## Step-by-Step Checklist

- [ ] Add the protected internal route for the new booking page in the existing shell.
- [ ] Add the sidebar or navigation entry for New Booking if the current shell owns that menu.
- [ ] Build the page structure to match `docs/UI_GUIDE.md`: page title, optional action row, then one main white card.
- [ ] Build the top-level four-tab layout using Element Plus card-style tabs: Booking Information, Shipment Detail, Marks and Number, and PO Detail.
- [ ] Initialize new-form state with Ship Mode defaulting to Air and blank read-only EBooking Number and HAWB Number fields.
- [ ] Add a shared booking-form model or composable that later tasks can extend without rewriting the page.
- [ ] Implement computed Volume Weight and Chargeable Weight behavior with immediate recalculation on Gross Weight, CBM, and Ship Mode changes.
- [ ] Round computed values to 2 decimal places before display and before submission payload assembly.
- [ ] Render the SEA section conditionally and show a confirmation prompt before clearing sea fields when switching Sea to Air.
- [ ] Add loading, empty, and error handling patterns where the page fetches existing booking or draft data.
- [ ] Add focused frontend tests for initial Air default, read-only identifier fields, weight recomputation, and Sea-to-Air confirmation behavior.

## Acceptance Criteria

- The internal app exposes a New Booking route inside the authenticated shell.
- The page follows the required Element Plus and `docs/UI_GUIDE.md` layout rules.
- The form defaults to Air, shows read-only blank booking identifiers on a new form, and recomputes Volume Weight and Chargeable Weight correctly.
- Sea-only UI is hidden in Air mode and guarded by a confirmation prompt when clearing sea data.

## Out-of-Scope Items

- Persisting form actions to the backend
- Searchable party and port lookups
- Draft picker workflow
- PO `.xlsx` import and editable PO table interactions
