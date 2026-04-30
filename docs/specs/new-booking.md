# New Booking Form Spec (v4 — Final)

## 1. Goal

Enable internal staff of two companies (**LM** and **ARC**) to create freight booking requests
(air or sea) within the internal ops dashboard. Bookings capture shipment parties, logistics
details, cargo marks, and associated purchase orders. Submitted bookings integrate downstream
with CargoWise via Universal XML; CargoWise returns the HAWB Number asynchronously.

---

## 2. Scope

### In Scope

- Four-tab booking form: Booking Information, Shipment Detail, Marks and Number, PO Detail
- Ship mode toggle (Air / Sea) that conditionally renders sea-specific fields
- Shipper, Consignee, Notify Party 1 and 2 selection with address auto-population from `parties` table
- All fields, validations, and business rules from the mockups plus all resolved decisions
- Save (submit), Save as Draft, Print, and Email actions
- Import from draft list (replaces current form state entirely)
- PO Detail inline editable table with add row, delete row, and `.xlsx` file import (max 500 rows / 500 KB)
- System-generated EBooking Number on Submit (prefix: `{company_code}{YYYYMMDD}{5-digit-seq}`)
- HAWB Number populated asynchronously via CargoWise integration response (not generated here)
- `parties` table creation as part of this feature
- `port_info` reference table as source for Origin, Destination, Final Destination
- Volume Weight formula switches automatically based on Ship Mode (Air vs Sea)
- Service Require is single-select (radio behaviour, rendered as checkboxes)
- Same-port Origin = Destination is permitted

### Out of Scope

- CargoWise Universal XML push and response handling (separate spec)
- Print layout / PDF generation (separate spec)
- Email sending implementation (separate spec)
- Customer portal booking (internal staff only)
- Quote-to-booking conversion
- Booking search / list page (separate spec)
- Real-time collaboration / locking
- Booking amendment after Submit
- `port_info` seed data (managed separately)
- `parties` seed data (managed separately)
- Admin UI for managing `port_info` or `parties`

---

## 3. Actors / Roles

| Actor | Company | Role | Access |
|---|---|---|---|
| Internal Staff | ARC (hardcoded v1) | Creates and manages bookings | `shipper` |
| Internal Admin | ARC (hardcoded v1) | Same as staff + system data management | `admin` |

- All routes: `/api/v1/internal/...`
- All routes protected by `JwtAuthGuard` + `RolesGuard` with `@Roles('shipper', 'admin')`
- `companyCode` is **hardcoded as `"arc"`** in v1. It is not stored on the `users` table and
  not supplied by the client. The `BookingNumberService` reads it from a server-side constant.
- When multi-company support is added in a future version, `companyCode` will move to the `users`
  table and be read from JWT claims. The constant must be defined in a single, clearly commented
  location to make that migration easy.

---

## 4. User Flow

1. Staff navigates to **New Booking** in the sidebar.
2. Form opens on the **Booking Information** tab. EBooking Number and HAWB Number are blank
   and read-only.
3. Staff selects **Ship Mode** (Air / Sea). Default: **Air**.
4. Staff optionally enters Reference Number (max 100 chars).
5. Staff selects **Shipper** from a searchable dropdown. Name and Address 1–4 auto-populate
   from the `parties` master and become editable for this booking only.
6. Staff selects **Consignee** from a searchable dropdown. Same auto-populate behaviour.
7. Staff optionally selects **Notify Party 1** and/or **Notify Party 2**.
8. Staff navigates to **Shipment Detail** tab.
9. Staff searches and selects **Origin** and **Destination** from the `port_info` reference
   (searchable dropdown, filtered by ship mode). Optionally sets **Final Destination**.
10. Staff fills in Gross Weight and CBM. **Volume Weight** and **Chargeable Weight** update
    automatically (formula depends on current Ship Mode).
11. Staff fills in Number of Package, Cargo Ready Date, ETD, ETA.
12. Staff selects Freight Charges (Prepaid **or** Collect, mutually exclusive). Optionally
    selects Other Charges (Prepaid or Collect, or neither).
13. Staff selects Incoterm (CFR / CIF / CIP / TBD) and Sample Shipment (Yes / No).
14. If Ship Mode = **Sea**, the SEA Mode section is visible. Staff fills in sea-specific fields.
15. Staff navigates to **Marks and Number** tab. Enters free text and selects battery
    declaration (Yes / No).
16. Staff navigates to **PO Detail** tab. Adds rows manually or imports a `.xlsx` file.
17. Staff clicks one of:
    - **Save as Draft** — saves with minimal validation (Ship Mode only required). No EBooking
      Number generated.
    - **Save** — runs full validation across all tabs. On success, generates EBooking Number
      and sets status to `SUBMITTED`.
18. On successful Save, EBooking Number is displayed. HAWB Number remains blank pending
    CargoWise response.
19. **Import from draft list** — opens a picker of existing `DRAFT` bookings. Selecting one
    replaces the entire current form state (with unsaved-changes prompt if form is dirty).

---

## 5. API Design

### 5.1 Create / Submit Booking

**POST** `/api/v1/internal/bookings`

**Request body:**

```json
{
  "isDraft": false,
  "shipMode": "AIR",
  "referenceNumber": "REF-001",
  "shipper": {
    "partyId": "uuid",
    "name": "Acme Corp",
    "address1": "123 Main St",
    "address2": "",
    "address3": "",
    "address4": ""
  },
  "consignee": {
    "partyId": "uuid",
    "name": "Beta Ltd",
    "address1": "456 Oak Ave",
    "address2": "",
    "address3": "",
    "address4": ""
  },
  "notifyParty1": {
    "partyId": "uuid",
    "name": "Gamma Inc",
    "address1": "",
    "address2": "",
    "address3": "",
    "address4": ""
  },
  "notifyParty2": null,
  "shipmentDetail": {
    "originPortId": "uuid",
    "destinationPortId": "uuid",
    "finalDestinationPortId": null,
    "grossWeight": 100.50,
    "cbm": 2.30,
    "numberOfPackage": 10,
    "cargoReadyDate": "2026-06-01",
    "etd": "2026-06-05",
    "eta": "2026-06-12",
    "freightCharges": "PREPAID",
    "otherCharges": "COLLECT",
    "incoterm": "FOB",
    "sampleShipment": false,
    "seaDetail": null
  },
  "marksAndNumber": {
    "descriptionOfGoods": "Textile goods",
    "marksNos": "PO-001 / CARTON 1-10",
    "containsBatteries": false
  },
  "poDetails": [
    {
      "poNumber": "PO-001",
      "styleNumber": "ST-001",
      "itemNumber": "ITEM-001",
      "goodsDescription": "Cotton T-Shirts",
      "ctns": 5,
      "pieces": 100,
      "grossWeight": 50.00,
      "cbm": 1.20
    }
  ]
}
```

`seaDetail` object — required when `shipMode = "SEA"`, must be `null` for Air:

```json
"seaDetail": {
  "exportLicenseNo": "EL-123",
  "serviceRequire": "CFS/CFS",
  "optionalServices": ["PICKUP", "HAULAGE"],
  "billOfLadingRequirement": "SHIPPED_ON_BOARD",
  "numberOfOriginalBL": 3,
  "shipmentType": "FCL",
  "containerCount": {
    "gp20": 2,
    "gp40": 0,
    "hq40": 0,
    "gp45": 0
  }
}
```

**Response (201 — Submitted):**

```json
{
  "data": {
    "bookingId": "uuid",
    "eBookingNumber": "arc2026043000001",
    "hawbNumber": null,
    "status": "SUBMITTED",
    "createdAt": "2026-04-30T10:00:00Z"
  }
}
```

**Response (201 — Draft):**

```json
{
  "data": {
    "bookingId": "uuid",
    "eBookingNumber": null,
    "hawbNumber": null,
    "status": "DRAFT",
    "createdAt": "2026-04-30T10:00:00Z"
  }
}
```

**Error cases:**

| Code | HTTP | Scenario |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing/invalid required fields on Submit; body lists failing field paths |
| `PARTY_NOT_FOUND` | 404 | Referenced `partyId` does not exist |
| `PORT_NOT_FOUND` | 404 | Referenced `portId` does not exist |
| `UNAUTHENTICATED` | 401 | No or invalid JWT |
| `FORBIDDEN` | 403 | Role is not `staff` or `admin` |

---

### 5.2 Update Draft Booking

**PATCH** `/api/v1/internal/bookings/:bookingId`

Same request shape as 5.1. Only permitted when `status = DRAFT`.

**Response (200):** same envelope as 5.1 with updated fields.

**Additional error cases:**

| Code | HTTP | Scenario |
|---|---|---|
| `BOOKING_NOT_EDITABLE` | 400 | Booking status is not `DRAFT` |
| `BOOKING_NOT_FOUND` | 404 | `bookingId` does not exist |

---

### 5.3 Get Booking

**GET** `/api/v1/internal/bookings/:bookingId`

**Response (200):**

```json
{
  "data": {
    "bookingId": "uuid",
    "eBookingNumber": "arc2026043000001",
    "hawbNumber": null,
    "status": "SUBMITTED",
    "shipMode": "AIR",
    "referenceNumber": "REF-001",
    "shipper": {
      "partyId": "uuid",
      "name": "Acme Corp",
      "address1": "123 Main St",
      "address2": "",
      "address3": "",
      "address4": ""
    },
    "consignee": { "...": "..." },
    "notifyParty1": null,
    "notifyParty2": null,
    "shipmentDetail": { "...": "..." },
    "marksAndNumber": { "...": "..." },
    "poDetails": []
  }
}
```

**Error cases:** `BOOKING_NOT_FOUND` (404), `UNAUTHENTICATED` (401), `FORBIDDEN` (403)

---

### 5.4 List Draft Bookings (Import from draft list picker)

**GET** `/api/v1/internal/bookings?status=DRAFT&page=1&limit=20`

**Response (200):**

```json
{
  "data": [
    {
      "bookingId": "uuid",
      "referenceNumber": "REF-001",
      "shipMode": "AIR",
      "shipperName": "Acme Corp",
      "createdAt": "2026-04-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "total": 5 }
}
```

---

### 5.5 Party Search

**GET** `/api/v1/internal/parties?search=acme&page=1&limit=20`

| Param | Required | Notes |
|---|---|---|
| `search` | No | Partial match on party name |
| `page` | No | Default 1 |
| `limit` | No | Default 20 |

**Response (200):**

```json
{
  "data": [
    {
      "partyId": "uuid",
      "name": "Acme Corp",
      "address1": "123 Main St",
      "address2": "",
      "address3": "",
      "address4": ""
    }
  ],
  "meta": { "page": 1, "total": 3 }
}
```

---

### 5.6 Port Search

**GET** `/api/v1/internal/ports?search=singapore&mode=SEA&page=1&limit=20`

| Param | Required | Notes |
|---|---|---|
| `search` | No | Partial match on port name or code |
| `mode` | No | `AIR` or `SEA` — filters `port_info.mode IN (mode, 'BOTH')` |
| `page` | No | Default 1 |
| `limit` | No | Default 20 |

**Response (200):**

```json
{
  "data": [
    {
      "portId": "uuid",
      "code": "SGSIN",
      "name": "Port of Singapore",
      "country": "SG",
      "mode": "SEA"
    }
  ],
  "meta": { "page": 1, "total": 1 }
}
```

---

### 5.7 PO File Import (Parse Only — No Persistence)

**POST** `/api/v1/internal/bookings/po-import`

- Multipart form upload, field name: `file`
- Accepted MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)
- Max file size: **500 KB**
- Max rows: **500**
- Fixed column order matching the PO Detail mockup. Row 1 must be the header row exactly as
  shown below. The parser reads by column position (A–H) and validates the header text to
  confirm the correct template. If header text does not match, the entire file is rejected
  with `PARSE_FAILED`.

| Col A | Col B | Col C | Col D | Col E | Col F | Col G | Col H |
|---|---|---|---|---|---|---|---|
| PO Number | Style Number | Item Number | Goods Description | CTNS | Pieces | Gross Weight | CBM |

**Response (200):**

```json
{
  "data": {
    "rows": [
      {
        "rowIndex": 2,
        "poNumber": "PO-001",
        "styleNumber": "ST-001",
        "itemNumber": "ITEM-001",
        "goodsDescription": "Cotton T-Shirts",
        "ctns": 5,
        "pieces": 100,
        "grossWeight": 50.00,
        "cbm": 1.20
      }
    ],
    "parseErrors": [
      {
        "rowIndex": 4,
        "field": "ctns",
        "message": "Must be a non-negative integer."
      }
    ]
  }
}
```

**Error cases:**

| Code | HTTP | Scenario |
|---|---|---|
| `INVALID_FILE_TYPE` | 400 | File is not `.xlsx` |
| `FILE_TOO_LARGE` | 400 | File exceeds 500 KB or 500 rows |
| `PARSE_FAILED` | 400 | File is corrupt or completely unreadable |

Rows with parse errors are excluded from `rows` and listed in `parseErrors`. Valid rows are
always returned regardless of errors in other rows. The frontend merges returned rows into form
state; they are not persisted until the user saves the booking.

---

### 5.8 EBooking Number Generation (Internal Service — No Public Endpoint)

Implemented in `BookingNumberService`. Called only during Submit (`isDraft = false`).

**Algorithm:**

```
companyCode = "arc"                          // hardcoded constant in v1
datePart    = server date (UTC) as YYYYMMDD
sequence    = next available 5-digit zero-padded daily sequence
              for (companyCode, date), atomically incremented

eBookingNumber = companyCode + datePart + sequence
// e.g. "arc2026043000001", "arc2026043000012"
```

**Sequence behaviour:**

- Sequence resets to `00001` on each new calendar date per company.
- Increment is performed within a DB transaction using a `SELECT ... FOR UPDATE` on the
  `booking_sequences` row to prevent duplicates under concurrent submissions.
- If no row exists for `(companyCode, date)`, insert with `last_sequence = 1`; otherwise
  increment by 1 and return the new value.

---

## 6. Data Model

### Table: `bookings`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `company_code` | `varchar(10)` | NOT NULL | `"arc"` in v1 |
| `e_booking_number` | `varchar(30)` | UNIQUE, nullable | Null until submitted |
| `hawb_number` | `varchar(50)` | nullable | Populated by CargoWise async |
| `ship_mode` | `enum('AIR','SEA')` | NOT NULL | |
| `reference_number` | `varchar(100)` | nullable | |
| `status` | `enum('DRAFT','SUBMITTED','CANCELLED')` | NOT NULL, default `'DRAFT'` | |
| `created_by` | `uuid` | FK → `users.id`, NOT NULL | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### Table: `booking_parties`

One row per role per booking. Maximum 4 rows per booking.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `booking_id` | `uuid` | FK → `bookings.id`, NOT NULL | |
| `role` | `enum('SHIPPER','CONSIGNEE','NOTIFY_1','NOTIFY_2')` | NOT NULL | |
| `party_id` | `uuid` | FK → `parties.id`, nullable | Null = no master party linked |
| `name` | `varchar(255)` | NOT NULL | Copied from master at booking time |
| `address1` | `varchar(255)` | nullable | |
| `address2` | `varchar(255)` | nullable | |
| `address3` | `varchar(255)` | nullable | |
| `address4` | `varchar(255)` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

Unique constraint: `(booking_id, role)`.

---

### Table: `booking_shipment_details`

1:1 with `bookings`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `booking_id` | `uuid` | FK → `bookings.id`, UNIQUE | |
| `origin_port_id` | `uuid` | FK → `port_info.id`, nullable | |
| `destination_port_id` | `uuid` | FK → `port_info.id`, nullable | |
| `final_destination_port_id` | `uuid` | FK → `port_info.id`, nullable | |
| `gross_weight` | `decimal(10,2)` | nullable | kg |
| `cbm` | `decimal(10,3)` | nullable | |
| `volume_weight` | `decimal(10,2)` | nullable | Computed; stored on save |
| `chargeable_weight` | `decimal(10,2)` | nullable | Computed; stored on save |
| `number_of_package` | `int` | nullable | |
| `cargo_ready_date` | `date` | nullable | |
| `etd` | `date` | nullable | |
| `eta` | `date` | nullable | |
| `freight_charges` | `enum('PREPAID','COLLECT')` | nullable | |
| `other_charges` | `enum('PREPAID','COLLECT')` | nullable | |
| `incoterm` | `enum('CFR','CIF','CIP','TBD')` | nullable | |
| `sample_shipment` | `boolean` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### Table: `booking_sea_details`

Only populated when `ship_mode = 'SEA'`. 1:1 with `bookings`. Row is deleted when Ship Mode
changes to Air.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `booking_id` | `uuid` | FK → `bookings.id`, UNIQUE | |
| `export_license_no` | `varchar(100)` | nullable | |
| `service_require` | `varchar(20)` | nullable | Single value: `CFS/CFS`, `CY/CY`, `CFS/CY`, `CY/CFS` |
| `optional_services` | `text[]` | nullable | `PICKUP`, `HAULAGE`, `REPACK`, `DECLARATION`, `INSURANCE` |
| `bill_of_lading_requirement` | `enum('SHIPPED_ON_BOARD','RECEIVED_FOR_SHIPMENT')` | nullable | |
| `number_of_original_bl` | `int` | nullable | |
| `shipment_type` | `enum('FCL','LCL')` | nullable | |
| `container_gp20` | `int` | NOT NULL, default 0 | Meaningful only when FCL |
| `container_gp40` | `int` | NOT NULL, default 0 | |
| `container_hq40` | `int` | NOT NULL, default 0 | |
| `container_gp45` | `int` | NOT NULL, default 0 | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### Table: `booking_marks`

1:1 with `bookings`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `booking_id` | `uuid` | FK → `bookings.id`, UNIQUE | |
| `description_of_goods` | `text` | nullable | |
| `marks_nos` | `text` | nullable | |
| `contains_batteries` | `boolean` | nullable | Non-null required on Submit |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### Table: `booking_po_details`

1:many with `bookings`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `booking_id` | `uuid` | FK → `bookings.id`, NOT NULL | |
| `row_number` | `int` | NOT NULL | 1-based display order |
| `po_number` | `varchar(100)` | NOT NULL | Minimum required field per row |
| `style_number` | `varchar(100)` | nullable | |
| `item_number` | `varchar(100)` | nullable | |
| `goods_description` | `varchar(255)` | nullable | |
| `ctns` | `int` | nullable, check ≥ 0 | |
| `pieces` | `int` | nullable, check ≥ 0 | |
| `gross_weight` | `decimal(10,2)` | nullable, check ≥ 0 | |
| `cbm` | `decimal(10,3)` | nullable, check ≥ 0 | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### Table: `parties` *(new)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `name` | `varchar(255)` | NOT NULL | |
| `address1` | `varchar(255)` | nullable | |
| `address2` | `varchar(255)` | nullable | |
| `address3` | `varchar(255)` | nullable | |
| `address4` | `varchar(255)` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

No role column — any party can fill any role on any booking.

---

### Table: `port_info` *(new)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `code` | `varchar(10)` | NOT NULL, UNIQUE | IATA / UN LOCODE e.g. `BKK`, `SGSIN` |
| `name` | `varchar(255)` | NOT NULL | e.g. "Suvarnabhumi Airport" |
| `country` | `varchar(2)` | NOT NULL | ISO 3166-1 alpha-2 |
| `mode` | `enum('AIR','SEA','BOTH')` | NOT NULL | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

Seed data is out of scope for this feature; the table must be created and remain empty until
populated separately.

---

### Table: `booking_sequences` *(new)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `company_code` | `varchar(10)` | NOT NULL | |
| `date` | `date` | NOT NULL | |
| `last_sequence` | `int` | NOT NULL, default 0 | Atomically incremented |

Unique constraint: `(company_code, date)`.

---

### Relationships Summary

```
bookings 1──1  booking_shipment_details
bookings 1──1  booking_sea_details         (SEA mode only; deleted when mode switches to AIR)
bookings 1──1  booking_marks
bookings 1──*  booking_parties             (up to 4 rows: SHIPPER, CONSIGNEE, NOTIFY_1, NOTIFY_2)
bookings 1──*  booking_po_details
parties  1──*  booking_parties             (via party_id; nullable — party may not exist in master)
port_info 1──* booking_shipment_details    (via origin, destination, final_destination FK columns)
users    1──*  bookings                    (via created_by)
booking_sequences                          (standalone; used by BookingNumberService)
```

---

## 7. Business Rules

### Company & EBooking Number

- **BR-01**: `companyCode` is hardcoded as `"arc"` in v1 (server-side constant). It is never
  supplied by the client.
- **BR-02**: EBooking Number format: `{companyCode}{YYYYMMDD}{00001–99999}`.
  Example: `arc2026043000001`. Date is the server date (UTC) at time of submission.
- **BR-03**: EBooking Number is generated **only on Submit** (`isDraft = false`). Draft bookings
  have `e_booking_number = null`.
- **BR-04**: The daily sequence resets to `00001` on each new calendar date. Increment is atomic
  (DB transaction with row-level lock) to prevent duplicates under concurrent submissions.

### HAWB Number

- **BR-05**: HAWB Number is never generated by this application. It is populated asynchronously
  by the CargoWise integration. The field is always read-only in the UI.

### Ship Mode

- **BR-06**: Ship Mode is required at all times (Draft and Submit). Default on form load: **Air**.
- **BR-07**: If the user changes Ship Mode after filling sea-specific fields, the frontend
  prompts a confirmation warning: *"Changing ship mode will clear all sea-specific fields.
  Continue?"*. On confirm, all sea fields are cleared in form state and the
  `booking_sea_details` row is deleted on the next save.
- **BR-08**: When Ship Mode changes, Volume Weight and Chargeable Weight are immediately
  recomputed using the formula for the new mode (see BR-13 / BR-14).

### Booking Information — Parties

- **BR-09**: Shipper Name and Consignee Name are **required on Submit**; optional on
  Save as Draft.
- **BR-10**: When a party is selected from the dropdown, the party's `name` and
  `address1`–`address4` are copied into the form. All fields remain editable per booking.
  Edits do **not** update the `parties` master record.
- **BR-11**: Notify Party 1 and Notify Party 2 are fully optional on both Draft and Submit.
- **BR-12**: Reference Number is optional free text, max 100 characters.

### Shipment Detail — Computed Fields

- **BR-13 (Air)**: Volume Weight = `CBM × 166.67`, rounded to 2 decimal places.
- **BR-14 (Sea)**: Volume Weight = `CBM × 1000`, rounded to 2 decimal places.
- **BR-15**: Chargeable Weight = `max(Gross Weight, Volume Weight)`, rounded to 2 decimal
  places.
- **BR-16**: Volume Weight and Chargeable Weight are display-only (not user-editable). Computed
  client-side on every change to Gross Weight, CBM, or Ship Mode. Both values are stored on
  save.

### Shipment Detail — Required Fields (Submit Only)

- **BR-17**: Required on Submit: Origin, Destination, Gross Weight, CBM, Number of Package,
  Cargo Ready Date, ETD, ETA, Freight Charges, Incoterm, Sample Shipment.
- **BR-18**: Final Destination is optional on both Draft and Submit.
- **BR-19**: Other Charges is optional on both Draft and Submit.

### Shipment Detail — Date Rules

- **BR-20**: ETD must not be before Cargo Ready Date. ETD = Cargo Ready Date is valid.
- **BR-21**: ETA must not be before ETD.

### Shipment Detail — Numeric Validation

- **BR-22**: Gross Weight and CBM must be positive numbers > 0 when provided.
- **BR-23**: Number of Package must be a positive integer > 0 when provided.

### Shipment Detail — Charges

- **BR-24**: Freight Charges — exactly one of Prepaid or Collect must be selected on Submit.
  Selecting one deselects the other (mutually exclusive). Neither may remain unselected on
  Submit.
- **BR-25**: Other Charges — if one option is selected, the other is deselected (mutually
  exclusive). Both may be left unselected (meaning "not specified"). No Submit requirement.

### Shipment Detail — Incoterm & Ports

- **BR-26**: Valid Incoterm values: `CFR`, `CIF`, `CIP`, `TBD`. Rendered as a dropdown.
  No other values accepted.
- **BR-27**: Origin, Destination, and Final Destination must be selected from `port_info`.
  Free-text entry is not permitted.
- **BR-28**: The port search dropdown filters by `mode IN ({shipMode}, 'BOTH')` to surface
  relevant ports first. This is a UX convenience; the API does not hard-reject a port whose
  mode does not match the booking's ship mode.
- **BR-29**: Origin and Destination may be the same port (valid for certain transshipment
  scenarios).

### Shipment Detail — Sea Mode

- **BR-30**: The SEA Mode section is hidden entirely when Ship Mode = Air.
- **BR-31**: On Submit with Ship Mode = Sea, the following are required: Service Require
  (exactly one selection), Shipment Type.
- **BR-32**: Service Require is **single-select** (radio behaviour, rendered as checkboxes).
  Exactly one of `CFS/CFS`, `CY/CY`, `CFS/CY`, `CY/CFS` may be selected. Selecting a new
  option deselects the previous.
- **BR-33**: Optional Services (Pickup, Haulage, Repack, Declaration, Insurance) are
  independent multi-select checkboxes. All optional.
- **BR-34**: Bill of Lading Requirement options rendered as a dropdown:
  - `Shipped On Board B/L` → stored as `SHIPPED_ON_BOARD`
  - `Received for Shipment B/L` → stored as `RECEIVED_FOR_SHIPMENT`
- **BR-35**: Container Count fields (20GP, 40GP, 40HQ, 45GP) are only active when
  Shipment Type = **FCL**. When LCL is selected, container count fields are disabled and
  stored as `0`.
- **BR-36**: On Submit with Ship Mode = Sea and Shipment Type = FCL, at least one container
  count field must be > 0. All four being 0 is a Submit-blocking validation error.

### Marks and Number

- **BR-37**: `contains_batteries` (Yes / No) is **required on Submit**. No default — user
  must actively choose. Both options are mutually exclusive.
- **BR-38**: Description of Goods and Marks Nos are optional free text with no length limit
  (stored as `text`).

### PO Detail

- **BR-39**: PO rows are optional. A booking may be saved with zero rows.
- **BR-40**: If a row exists, it must have `po_number` populated (applies to both Draft and
  Submit).
- **BR-41**: `ctns` and `pieces` must be non-negative integers (≥ 0) if provided.
- **BR-42**: `gross_weight` and `cbm` on PO rows must be non-negative decimals (≥ 0) if
  provided.
- **BR-43**: Row order is preserved as entered. `row_number` is assigned sequentially from
  1 on save.
- **BR-44**: "Delete selection" button is disabled when no rows are checked. Clicking it
  removes only the checked rows.
- **BR-45**: `.xlsx` import — parsed valid rows are shown as a preview in the table. They are
  not persisted until the user saves the booking.
- **BR-46**: If the imported `.xlsx` exceeds 500 rows **or** 500 KB, the entire import is
  rejected. No partial import.
- **BR-47**: Rows with parse errors (e.g. non-numeric CTNS, missing PO Number) are excluded
  from importable rows and listed in `parseErrors`. Valid rows in the same file are still
  returned and may be imported.
- **BR-48**: Duplicate PO numbers within the same booking are permitted.

### Save vs Draft

- **BR-49**: **Save as Draft** — only Ship Mode is required. All other validations are
  skipped. No EBooking Number is generated. Status = `DRAFT`.
- **BR-50**: **Save (Submit)** — all required-field validations across all four tabs run
  server-side. Any failure returns `400 VALIDATION_ERROR` with a list of failing field paths
  grouped by tab.
- **BR-51**: Once `status = SUBMITTED`, the booking cannot be modified via this form. PATCH
  returns `400 BOOKING_NOT_EDITABLE`.
- **BR-52**: **Import from draft list** fully replaces the current form state. If the form
  has unsaved changes, the frontend prompts: *"You have unsaved changes. Importing will
  discard them. Continue?"*

---

## 8. Edge Cases

| ID | Scenario | Expected Behaviour |
|---|---|---|
| EC-01 | User switches Ship Mode Sea → Air after filling sea fields | Confirmation prompt shown. On confirm: sea fields cleared in form state; `booking_sea_details` row deleted on next save. |
| EC-02 | Party selected in dropdown is later deleted from `parties` master | Booking retains the copied name and addresses. On re-open, party name displays with a `[Party no longer exists]` indicator if `party_id` FK resolves to nothing. |
| EC-03 | Floating-point arithmetic on computed weights | Round Volume Weight and Chargeable Weight to 2 decimal places before display and storage. |
| EC-04 | `.xlsx` import — exactly 500 rows | Accepted. |
| EC-05 | `.xlsx` import — 501 rows | Entire import rejected with `FILE_TOO_LARGE`. No rows added. |
| EC-06 | `.xlsx` import — file is 501 KB | Entire import rejected with `FILE_TOO_LARGE`. |
| EC-07 | User navigates away mid-form without saving | Browser `beforeunload` prompt: *"You have unsaved changes."* |
| EC-08 | Two staff submit ARC bookings at the same time on the same date | Sequence increment is atomic; both receive unique sequential EBooking Numbers. |
| EC-09 | FCL selected, all container counts remain 0 on Submit | Blocked on Submit with `VALIDATION_ERROR`; message: *"At least one container count must be greater than 0 for FCL shipments."* |
| EC-10 | Same draft opened in two browser tabs, saved from both | Last-write-wins. No locking in v1. |
| EC-11 | `.xlsx` row has missing PO Number | That row is excluded from valid rows and listed in `parseErrors`. |
| EC-12 | Origin and Destination are the same port | Accepted (valid for transshipment scenarios). |
| EC-13 | `port_info` search returns no results | Dropdown shows *"No ports found."* Free-text entry is not permitted. |
| EC-14 | Ship Mode changes from Air to Sea mid-entry | Volume Weight and Chargeable Weight immediately recompute using the Sea formula (`CBM × 1000`). |
| EC-15 | Ship Mode changes from Sea to Air mid-entry | Volume Weight and Chargeable Weight immediately recompute using the Air formula (`CBM × 166.67`). |

---

## 9. Acceptance Criteria

### Booking Information Tab

- [ ] **AC-01**: Form defaults to Ship Mode = Air on load.
- [ ] **AC-02**: Selecting a shipper from the dropdown auto-populates Name and Address 1–4 from
  the `parties` master.
- [ ] **AC-03**: Auto-populated address fields are editable; saving the booking does not update
  the `parties` master record.
- [ ] **AC-04**: EBooking Number and HAWB Number fields are read-only and blank on a new booking.
- [ ] **AC-05**: Submitting without selecting Shipper or Consignee returns a validation error
  identifying those fields.
- [ ] **AC-06**: Reference Number longer than 100 characters is rejected on Submit.

### Shipment Detail Tab

- [ ] **AC-07**: SEA Mode section is not visible when Ship Mode = Air.
- [ ] **AC-08**: SEA Mode section is visible when Ship Mode = Sea.
- [ ] **AC-09**: Changing Ship Mode from Sea to Air shows a confirmation prompt before clearing
  sea fields.
- [ ] **AC-10**: Volume Weight updates automatically when Gross Weight or CBM changes.
  Air formula: `CBM × 166.67`. Sea formula: `CBM × 1000`. Rounded to 2 decimal places.
- [ ] **AC-11**: Volume Weight and Chargeable Weight recompute immediately when Ship Mode
  changes, using the new mode's formula.
- [ ] **AC-12**: Chargeable Weight = `max(Gross Weight, Volume Weight)`, rounded to 2 decimal
  places. Updates automatically.
- [ ] **AC-13**: Origin, Destination, and Final Destination are searchable dropdowns resolving
  only values from `port_info`.
- [ ] **AC-14**: Port search with `mode=AIR` returns only ports with `mode IN ('AIR', 'BOTH')`.
- [ ] **AC-15**: Setting ETD before Cargo Ready Date shows a validation error on Submit.
- [ ] **AC-16**: Setting ETA before ETD shows a validation error on Submit.
- [ ] **AC-17**: ETD = Cargo Ready Date (same day) is accepted.
- [ ] **AC-18**: Selecting Freight Charges Prepaid deselects Collect, and vice versa.
- [ ] **AC-19**: Submitting without selecting Freight Charges shows a validation error.
- [ ] **AC-20**: Incoterm dropdown shows exactly: CFR, CIF, CIP, TBD.
- [ ] **AC-21**: For Sea mode — selecting one Service Require option deselects any previously
  selected option (single-select behaviour).
- [ ] **AC-22**: For Sea mode — submitting without selecting Service Require shows a validation
  error.
- [ ] **AC-23**: For Sea mode — container count fields are disabled when Shipment Type = LCL.
- [ ] **AC-24**: For Sea mode — container count fields are enabled when Shipment Type = FCL.
- [ ] **AC-25**: For Sea mode — submitting with FCL and all container counts = 0 shows a
  validation error.

### Marks and Number Tab

- [ ] **AC-26**: Submitting without selecting a battery declaration option (Yes / No) shows a
  validation error.
- [ ] **AC-27**: Yes and No for battery declaration are mutually exclusive. Selecting one
  deselects the other.

### PO Detail Tab

- [ ] **AC-28**: "+ Add PO" adds a new blank editable row.
- [ ] **AC-29**: "Delete selection" button is disabled when no rows are checked.
- [ ] **AC-30**: Checking one or more rows and clicking "Delete selection" removes exactly
  those rows.
- [ ] **AC-31**: Importing a valid `.xlsx` file with ≤ 500 rows and ≤ 500 KB populates the
  table as a preview.
- [ ] **AC-31a**: Importing a `.xlsx` file whose row-1 header does not match the fixed
  template columns returns `PARSE_FAILED` and adds no rows.
- [ ] **AC-32**: Importing a `.xlsx` file with > 500 rows returns `FILE_TOO_LARGE`; no rows
  are added.
- [ ] **AC-33**: Importing a `.xlsx` file exceeding 500 KB returns `FILE_TOO_LARGE`; no rows
  are added.
- [ ] **AC-34**: Rows missing PO Number in the import file are listed in `parseErrors` and
  excluded from the preview; valid rows in the same file are still importable.
- [ ] **AC-35**: A PO row with no PO Number is rejected on both Save as Draft and Submit.
- [ ] **AC-36**: Duplicate PO numbers within the same booking are accepted without error.

### Save / Draft

- [ ] **AC-37**: "Save as Draft" with only Ship Mode set succeeds; returns `201` with
  `status: "DRAFT"` and `eBookingNumber: null`.
- [ ] **AC-38**: Submit with all required fields correctly filled returns `201` with a valid
  `eBookingNumber` matching the pattern `arc{YYYYMMDD}{5-digit-seq}`.
- [ ] **AC-39**: Two simultaneous Submit calls produce two unique, sequentially different
  EBooking Numbers.
- [ ] **AC-40**: After successful Submit, the EBooking Number is displayed on the form.
  HAWB Number remains blank.
- [ ] **AC-41**: PATCH on a `SUBMITTED` booking returns `400` with code `BOOKING_NOT_EDITABLE`.
- [ ] **AC-42**: Navigating away from a form with unsaved changes triggers a browser
  unsaved-changes prompt.
- [ ] **AC-43**: "Import from draft list" on a dirty form shows a confirmation prompt before
  replacing form state.
- [ ] **AC-44**: After importing from draft list, all form fields reflect the imported draft's
  data.

### API / Auth

- [ ] **AC-45**: All booking endpoints return `401` without a valid JWT.
- [ ] **AC-46**: All booking endpoints return `403` for a `customer` role JWT.
- [ ] **AC-47**: EBooking Number prefix is always `arc` (hardcoded); no client-supplied value
  can alter it.

---

## 10. Simplifications

- **No server round-trip for computed fields** — Volume Weight and Chargeable Weight are
  computed client-side on each input change; stored on save only.
- **No duplicate booking detection** — two bookings with the same Reference Number are
  permitted.
- **No booking amendment flow** — submitted bookings are immutable in v1.
- **No multi-unit support** — weight is always kg; volume always CBM. No conversion UI.
- **No audit log / change history** — out of scope for v1.
- **No concurrent edit locking** — last-write-wins (EC-10).
- **PO import is preview-only** — parsed rows are not persisted until the user saves the
  booking.
- **Party type not enforced** — any party in the `parties` table may be used as Shipper,
  Consignee, or Notify Party.
- **Port mode filter is a UX hint only** — the API does not hard-reject a port whose mode
  does not match the booking's Ship Mode (OQ-22).
- **No CargoWise push from this form** — XML integration is a separate downstream step.
- **HAWB Number write-back** — handled by a scheduled cron job; out of scope here (OQ-24).
- **No field length limits on free-text cargo fields** — Description of Goods and Marks Nos
  are stored as `text` (unlimited). CargoWise XML field length constraints are deferred to
  the integration spec (OQ-23).
- **Single company in v1** — `companyCode = "arc"` is a server constant. Multi-company
  support requires a future migration to store `company_code` on the `users` table.
- **`port_info` and `parties` seed data** — out of scope; tables are created empty.

---

## 11. Open Questions / Ambiguities

All questions from v1, v2, and v3 have been resolved. This spec is complete and
implementation-ready. The table below records the final v3–v4 decisions for traceability.

| # | Question | Resolution |
|---|---|---|
| OQ-21 | Exact `.xlsx` column header text for PO import? | Fixed per the PO Detail mockup columns: `PO Number`, `Style Number`, `Item Number`, `Goods Description`, `CTNS`, `Pieces`, `Gross Weight`, `CBM`. Header is validated; mismatch returns `PARSE_FAILED`. See §5.7. |
| OQ-22 | Should the API hard-reject a port whose mode does not match the booking's Ship Mode? | No hard rejection. Port mode filter (`mode IN (shipMode, 'BOTH')`) remains a UX hint only. See BR-28. |
| OQ-23 | Maximum character length for Description of Goods and Marks Nos? | No limit. Both stored as `text` (unlimited). CargoWise field mapping length constraints are deferred to the integration spec. |
| OQ-24 | Should the UI notify the booking creator when HAWB Number is written back by CargoWise? | Handled by a scheduled cron job. Out of scope for this feature. |
