# Phase 5: PO Import API

## Goal

Implement the `.xlsx` PO import endpoint that validates the fixed template, enforces size limits, parses rows, and returns valid rows plus parse errors without persisting anything.

## Files Likely To Change

- `packages/api/src/bookings/bookings.controller.ts`
- `packages/api/src/bookings/bookings.service.ts`
- `packages/api/src/bookings/po-import.service.ts`
- `packages/api/src/bookings/dto/*`
- `packages/api/src/bookings/constants/*`
- `packages/api/src/bookings/bookings.module.ts`
- `packages/api/src/bookings/bookings.service.test.ts`
- `packages/api/src/bookings/bookings.controller.test.ts`
- `packages/shared/src/booking/types.ts`
- `packages/api/package.json` if a spreadsheet parsing dependency is required

## Step-by-Step Checklist

- [ ] Choose the spreadsheet parsing library already preferred by the repo, or add one narrowly for `.xlsx` reading if none exists.
- [ ] Implement multipart upload handling for `POST /api/v1/internal/bookings/po-import` with the field name `file`.
- [ ] Reject non-`.xlsx` uploads with `400 INVALID_FILE_TYPE`.
- [ ] Reject files over 500 KB before parsing whenever possible.
- [ ] Parse the first worksheet, enforce the exact row-1 header text and column order, and reject header mismatches with `400 PARSE_FAILED`.
- [ ] Enforce the 500-row maximum and reject the full file with `400 FILE_TOO_LARGE` when exceeded.
- [ ] Parse row values into booking PO-detail shapes, excluding invalid rows from `rows` and reporting them in `parseErrors`.
- [ ] Enforce per-row rules for required PO Number, non-negative integers for `ctns` and `pieces`, and non-negative decimals for `grossWeight` and `cbm`.
- [ ] Ensure valid rows are returned even when some rows fail parsing.
- [ ] Keep the endpoint parse-only with no database writes.
- [ ] Add backend tests for invalid MIME type, file-size rejection, 500-vs-501 row handling, header mismatch, missing PO Number, mixed valid/invalid rows, and corrupt workbook behavior.

## Acceptance Criteria

- Valid `.xlsx` uploads at or below 500 rows and 500 KB return preview rows in the expected response shape.
- Invalid file type, file too large, corrupt workbook, and header mismatch scenarios return the spec-defined `400` error codes.
- Rows with parse errors are excluded from returned rows and included in `parseErrors`.
- The endpoint does not persist imported PO rows to the database.

## Out-of-Scope Items

- PO table UI rendering
- Booking create or update persistence
- Draft import modal
- Any non-`.xlsx` import format
