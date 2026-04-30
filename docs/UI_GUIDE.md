# UI Guide — Freight Forwarding Web System

> **This file is required reading before any frontend code is written.**
> Claude Code must follow all rules here. Do not invent styles, components, or layouts not defined in this guide. If a case is not covered, stop and ask before proceeding.

---

## 1. Design Philosophy

- Enterprise internal system (freight/logistics)
- Clean, simple, professional
- Prioritise readability and data density
- Avoid decorative or flashy UI — no gradients, no animations unless explicitly listed, no colorful dashboards

---

## 2. UI Framework

**Vue 3 + Element Plus**

- Use Element Plus built-in components as the first choice
- Customise lightly via CSS variables — do not override component internals
- Do not introduce additional UI libraries (e.g. Vuetify, Naive UI, PrimeVue)

---

## 3. Layout Rules

### Page Structure

Every page MUST follow this exact top-to-bottom order:

```
[ Page Title ]           ← top-left, always present
[ Filters / Search / Action Buttons ]   ← optional, below title
[ Main Card ]            ← white card containing table or form content
```

- Page title uses `<h1>` styling, left-aligned
- Action buttons (e.g. "Create Shipment") sit on the right side of the filter row
- Main content is always wrapped in a white card — never render content on bare background

### Dashboard Layout

```
[ KPI Summary Cards ]    ← 3–4 cards in a row
[ Main Data Table ]      ← full width below
```

- KPI cards show a single metric with a label (e.g. "Active Shipments / 142")
- No charts or graphs unless explicitly requested

---

## 4. Colors

Use only these tokens. Do not introduce new colors without explicit approval.

| Token | Value | Usage |
|---|---|---|
| Primary | Blue (`#1677ff`) | Buttons (primary), links, active states |
| Background | Light gray (`#f5f5f5`) | Page background |
| Card | White (`#ffffff`) | Card backgrounds |
| Text primary | Dark gray (`#1f1f1f`) | Body text, table content |
| Text secondary | Medium gray (`#8c8c8c`) | Labels, helper text, placeholders |
| Border | Light gray (`#d9d9d9`) | Input borders, dividers |
| Status: Active | Orange (`#fa8c16`) | Processing, in-transit |
| Status: Inactive | Gray (`#bfbfbf`) | Inactive, cancelled |
| Status: Success | Green (`#52c41a`) | Delivered, completed, confirmed |
| Status: Danger | Red (`#ff4d4f`) | Errors, delete actions |

---

## 5. Typography

- Font family: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — Element Plus default, do not override
- Page title (`h1`): 20px, font-weight 600
- Section title (`h2`): 16px, font-weight 600
- Body / table content: 14px, font-weight 400
- Helper text / labels: 12px, color: Text secondary

---

## 6. Components

### Tables (HIGHEST PRIORITY — must be consistent across all pages)

- Full-width inside card
- Use `el-table` from Element Plus
- Header: light gray background (`#fafafa`), font-weight 600
- Row height: comfortable — not cramped (min 48px)
- Always include:
  - Pagination (`el-pagination`, page size options: 10, 20, 50)
  - Empty state (see Section 8)
  - Loading state (use `v-loading` directive)
- Sorting: use `el-table-column` `sortable` prop where applicable
- Column alignment:
  - Text: left-aligned
  - Numbers / amounts: right-aligned
  - Status badges / actions: center-aligned
- Action column (Edit, View, Delete): rightmost column, no header label

---

### Buttons

| Type | Element Plus | Color | Usage |
|---|---|---|---|
| Primary | `type="primary"` | Blue | Submit, Search, Create |
| Secondary | `type="default"` | Gray | Cancel, Reset, Back |
| Danger | `type="danger"` | Red | Delete |

- Button size: `default` (medium) throughout — do not mix sizes on the same row
- Confirm before any delete action using `ElMessageBox.confirm()`
- Icon buttons (icon-only) must include a tooltip (`el-tooltip`)

---

### Forms

- Use `el-form` with `el-form-item`
- Label position: above input (`label-position="top"`)
- All inputs full width (`style="width: 100%"`)
- Group related fields logically (e.g. shipper info, consignee info, cargo details)
- Show inline validation messages on blur — use Element Plus built-in validation rules
- Required fields marked with asterisk (Element Plus handles this via `required` rule)

---

### Modals

Used for: Create, Edit actions only.

- Use `el-dialog`
- Position: centered
- Width: `600px` (default), `800px` for complex forms with multiple sections
- Never full-screen unless on mobile breakpoint
- Always include:
  - Clear title (e.g. "Create Booking", "Edit Shipment")
  - Footer with two buttons: primary action (Submit) on the right, Cancel on the left
- Close on overlay click: disabled for forms with unsaved data

---

### Tabs

- Use `el-tabs` with `type="card"` style
- Used inside: modals with multi-section forms, detail pages
- Example tab labels: "Shipment Info", "Documents", "Timeline"
- Default to first tab on open; preserve tab state within the same session

---

### Status Badge

- Use `el-tag` component
- Style: rounded pill (`round` prop)
- Do not use plain text for status — always use a badge

| Status | `el-tag` type | Color |
|---|---|---|
| Active / Processing / In Transit | `warning` | Orange |
| Inactive / Cancelled | `info` | Gray |
| Delivered / Completed / Confirmed | `success` | Green |
| Error / Failed | `danger` | Red |

---

### Shipment Timeline

- Vertical layout, left-aligned
- Use `el-steps` with `direction="vertical"`
- Each step shows: status label + date/time below
- Completed steps: green (`process` or `finish`)
- Pending steps: gray (`wait`)
- Do not show future steps as completed

---

### Notifications & Feedback

- Success actions: `ElMessage.success('...')` — brief, auto-dismiss
- Errors: `ElMessage.error('...')` — show meaningful message, not raw error object
- Destructive confirmations: `ElMessageBox.confirm()` — always required before delete
- Form submit errors: inline field validation only — do not use a modal for validation errors

---

## 7. Spacing

- Card padding: `24px` (desktop), `16px` (compact/mobile)
- Gap between KPI cards: `16px`
- Gap between page sections (title → filter → card): `16px`
- Table cell padding: Element Plus default — do not reduce
- Do not add extra margin/padding inside `el-table` cells

---

## 8. State Handling (REQUIRED on every data view)

Every page or component that fetches data must handle all three states:

| State | Implementation |
|---|---|
| **Loading** | `v-loading="true"` on the card or table |
| **Empty** | `el-empty` component with a short contextual message (e.g. "No shipments found") |
| **Error** | `el-result` with `type="error"` and a retry button |

Do not show a blank screen or a spinner with no fallback.

---

## 9. Consistency Rules (CRITICAL)

- All pages reuse the same table, button, modal, and badge components
- Do NOT redesign or restyle components on a per-page basis
- Do NOT mix multiple UI styles on the same page
- If a new component is needed that is not in this guide, **stop and propose it** before building

---

## 10. What NOT to Do

- No fancy gradients or background images
- No animations or transitions unless they are Element Plus defaults
- No colorful dashboards or data visualisations unless explicitly requested
- No inconsistent spacing or ad-hoc margin/padding overrides
- No inline styles except where absolutely necessary — use scoped CSS or CSS variables
- No new UI libraries without explicit approval
- No redesigning existing components per page
- No raw status text — always use a status badge
