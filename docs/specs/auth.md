# Auth Module Spec

## Overview

This module covers authentication (login/logout/JWT) and the full user management
system including organizations, users, and roles. It is used exclusively in the
**internal dashboard** (`apps/internal`) by admin users.

**Key structural decision:** The system uses a 2-layer model — Organization → Users.
There is no separate group/entity layer. An organization is a company record that
has one or more type flags (shipper, consignee, agent) and can contain multiple users.
Organizations can be linked to each other as flat partners — there is no hierarchy
or parent/child ownership between organizations.

---

## 1. Data Model

### 1.1 Roles

Roles are fixed system-defined values. No role CRUD UI is required at this stage.

| Role name   | Description                              |
|-------------|------------------------------------------|
| `admin`     | Full access to internal dashboard        |
| `shipper`   | Access to customer portal as a shipper   |
| `consignee` | Access to customer portal as a consignee |
| `agent`     | Access to customer portal as an agent    |

A user can hold multiple roles. An admin user belongs to no organization.

---

### 1.2 DB Schema

Use `snake_case` for all table and column names. All tables must have `created_at`
and `updated_at` timestamps.

---

#### `roles`
| Column       | Type          | Notes                  |
|--------------|---------------|------------------------|
| `id`         | `uuid` PK     |                        |
| `name`       | `varchar(50)` | unique, e.g. `shipper` |
| `created_at` | `timestamptz` | default now()          |
| `updated_at` | `timestamptz` |                        |

Seed with: `admin`, `shipper`, `consignee`, `agent`

---

#### `organizations`
An organization is a company/party record. It replaces both the old `groups` and
`entities` tables. Type flags are stored as booleans — an organization can be a
shipper, consignee, and/or agent simultaneously.

| Column         | Type           | Notes                                       |
|----------------|----------------|---------------------------------------------|
| `id`           | `uuid` PK      |                                             |
| `name`         | `varchar(255)` | Company name, required                      |
| `code`         | `varchar(50)`  | Internal code, nullable                     |
| `cw_code`      | `varchar(50)`  | CargoWise code, nullable                    |
| `is_shipper`   | `boolean`      | default false                               |
| `is_consignee` | `boolean`      | default false                               |
| `is_agent`     | `boolean`      | default false                               |
| `origin`       | `varchar(10)`  | UNLOCO code, nullable                       |
| `address1`     | `varchar(255)` | nullable                                    |
| `address2`     | `varchar(255)` | nullable                                    |
| `address3`     | `varchar(255)` | nullable                                    |
| `address4`     | `varchar(255)` | nullable                                    |
| `city`         | `varchar(100)` | nullable                                    |
| `postal`       | `varchar(20)`  | nullable                                    |
| `country`      | `varchar(100)` | nullable                                    |
| `created_at`   | `timestamptz`  |                                             |
| `updated_at`   | `timestamptz`  |                                             |

Business rule: at least one of `is_shipper`, `is_consignee`, `is_agent` must be
true — an organization must have at least one type flag set.

---

#### `organization_relationships`
Records flat partner links between organizations. The relationship is bidirectional
and symmetric — there is no `from`/`to` directionality or ownership implied.

| Column      | Type           | Notes                              |
|-------------|----------------|------------------------------------|
| `id`        | `uuid` PK      |                                    |
| `org_id_a`  | `uuid` FK      | → `organizations.id`               |
| `org_id_b`  | `uuid` FK      | → `organizations.id`               |
| `label`     | `varchar(100)` | Optional note, nullable            |
| `created_at`| `timestamptz`  |                                    |
| `updated_at`| `timestamptz`  |                                    |

Unique constraint on (`org_id_a`, `org_id_b`) where `org_id_a < org_id_b` (enforced
in application layer to prevent duplicate pairs regardless of order).

Business rules:
- An organization cannot be linked to itself
- A pair can only be linked once (no duplicate relationships)
- The `label` field is a free-text note (e.g. "Preferred agent", "Regular consignee") — optional

---

#### `users`
| Column            | Type           | Notes                                           |
|-------------------|----------------|-------------------------------------------------|
| `id`              | `uuid` PK      |                                                 |
| `email`           | `varchar(255)` | unique, required                                |
| `password_hash`   | `varchar(255)` | bcrypt, required                                |
| `name`            | `varchar(100)` | display name / nickname                         |
| `phone`           | `varchar(50)`  | nullable                                        |
| `is_disabled`     | `boolean`      | default false                                   |
| `organization_id` | `uuid` FK      | → `organizations.id`, nullable (admin has none) |
| `created_at`      | `timestamptz`  |                                                 |
| `updated_at`      | `timestamptz`  |                                                 |

---

#### `user_roles`
Many-to-many between users and roles.

| Column       | Type          | Notes        |
|--------------|---------------|--------------|
| `user_id`    | `uuid` FK     | → `users.id` |
| `role_id`    | `uuid` FK     | → `roles.id` |
| `created_at` | `timestamptz` |              |

Primary key: (`user_id`, `role_id`)

---

#### `refresh_tokens`
| Column       | Type           | Notes                |
|--------------|----------------|----------------------|
| `id`         | `uuid` PK      |                      |
| `user_id`    | `uuid` FK      | → `users.id`         |
| `token_hash` | `varchar(255)` | hashed refresh token |
| `expires_at` | `timestamptz`  |                      |
| `created_at` | `timestamptz`  |                      |

---

### 1.3 Relationships Summary

```
organizations *──* organizations  (via organization_relationships, flat/symmetric)
organizations 1──* users
users         *──* roles          (via user_roles)
users         1──* refresh_tokens
```

Admin users have `organization_id = null`.

---

## 2. API Endpoints

All system management endpoints require `admin` role.

### 2.1 Authentication

| Method | Route                  | Auth   | Description             |
|--------|------------------------|--------|-------------------------|
| POST   | `/api/v1/auth/login`   | Public | Login, returns JWT pair |
| POST   | `/api/v1/auth/refresh` | Public | Refresh access token    |
| POST   | `/api/v1/auth/logout`  | JWT    | Revoke refresh token    |

#### POST `/api/v1/auth/login`
Request:
```json
{ "email": "admin@example.com", "password": "123456" }
```
Response:
```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin",
      "roles": ["admin"],
      "organizationId": null
    }
  }
}
```
- `401` if credentials invalid
- `403` if user is disabled
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days, stored hashed in `refresh_tokens`

---

### 2.2 Organization Management

| Method | Route                                                      | Description             |
|--------|------------------------------------------------------------|-------------------------|
| GET    | `/api/v1/internal/organizations`                           | List orgs (filter by type flag) |
| POST   | `/api/v1/internal/organizations`                           | Create organization     |
| PATCH  | `/api/v1/internal/organizations/:id`                       | Update organization     |
| DELETE | `/api/v1/internal/organizations/:id`                       | Delete organization     |
| GET    | `/api/v1/internal/organizations/:id/relationships`         | List linked orgs        |
| POST   | `/api/v1/internal/organizations/:id/relationships`         | Link two organizations  |
| DELETE | `/api/v1/internal/organizations/:id/relationships/:relId`  | Remove a link           |

Query params for list: `?isShipper=true`, `?isConsignee=true`, `?isAgent=true`
(combinable — returns orgs matching any of the provided flags)

#### POST organization request body:
```json
{
  "name": "KUAFU International Co., Ltd.",
  "code": "KUAFU",
  "cwCode": "KUAINTPVG",
  "isShipper": true,
  "isConsignee": false,
  "isAgent": false,
  "origin": "PVG",
  "address1": "Unit 305 N...",
  "city": "Shanghai",
  "country": "CN"
}
```

**Business rules:**
- At least one of `isShipper`, `isConsignee`, `isAgent` must be `true`
- Cannot delete an organization that has users — return `409`: "Cannot delete organization with existing users."
- Cannot link an organization to itself
- Cannot create a duplicate link between the same pair of organizations

---

### 2.3 User Management

| Method | Route                                              | Description          |
|--------|----------------------------------------------------|----------------------|
| GET    | `/api/v1/internal/organizations/:id/users`         | List users in org    |
| GET    | `/api/v1/internal/users/admins`                    | List admin users     |
| POST   | `/api/v1/internal/users`                           | Create user          |
| PATCH  | `/api/v1/internal/users/:id`                       | Update user          |
| DELETE | `/api/v1/internal/users/:id`                       | Delete user          |
| PATCH  | `/api/v1/internal/users/:id/password`              | Change user password |

#### POST/PATCH user request body:
```json
{
  "email": "user@example.com",
  "name": "Mikey",
  "phone": "",
  "isDisabled": false,
  "organizationId": "uuid-or-null",
  "roles": ["shipper", "consignee"]
}
```

**Business rules:**
- New user default password: `123456` (display to admin on create)
- After password change, invalidate all existing refresh tokens for that user
- Admin users have `organizationId: null` and `roles: ["admin"]`
- A user can hold multiple roles simultaneously
- Warn (do not block) if a user is assigned a role that the organization's type
  flags do not support (e.g. assigning `agent` role to a shipper-only org)

---

## 3. UI Screens

All screens are in `apps/internal`. Follow `UI_GUIDE.md` for all layout and
component rules.

---

### 3.1 Login Page (`/login`)

Public route — redirect to `/dashboard` if already authenticated.

**Layout:**
- Centered card on light gray background, no sidebar
- Top of card: teal header bar with ARC Global Logistics logo
- Card body:
  - Title: "Login" (left-aligned)
  - `EMAIL ADDRESS` label + full-width text input
  - `PASSWORD` label + full-width password input
  - "Forgot your password?" link (right-aligned, below password field)
  - Primary teal/blue "Login" button (full width)
  - Divider with "OR" text
  - Secondary "Sign up" button (full width, outline style)
- Footer: "Copyright © [year] ARC Global Logistics. All rights reserved." (centered, below card)

**Behaviour:**
- Inline error on failed login: "Invalid email or password"
- Login button disabled + loading state while request is in flight
- "Sign up" — disabled, tooltip: "Contact your administrator"
- "Forgot your password?" — visible link, no action (out of scope)

---

### 3.2 Organization Management Page (`/system/organization`)

Accessible via sidebar: System management → Organization. Admin role required.

**Page structure:**
```
[ Title: "Organization" ]
[ Subtitle: "Manage shipper, consignee, and agent organizations." ]
[ Tabs: Shipper | Consignee | Agent | Admin user ]
[ Tab content ]
```

An organization with multiple flags (e.g. both shipper and consignee) appears in
each matching tab. Tabs use `el-tabs` underline style, active tab in teal/primary.

---

#### Tabs: Shipper / Consignee / Agent

Two-panel layout side by side:

**Left panel — Organization list**
- Header: `+ Create organization` (left), refresh icon (right)
- `el-table` columns: drag handle, No., Organization Name, Code, CW Code, Type badges
  - Type badges: `el-tag` pill for each active flag (e.g. `shipper`, `agent`)
- Clicking a row selects it and loads the right panel
- Pagination: total count + page controls at bottom
- Row context menu (three-dot, visible on hover): Edit, Delete

**Right panel — Users in selected organization**
- Header: `+ Create user` (left), refresh icon (right)
- `el-table` columns: drag handle, No., Email Address, Name, Phone, Role Names, Status
- Row context menu: Edit, Delete, Change password
- `el-empty` ("No Data") when no users in selected organization
- `v-loading` on both panels while fetching

---

#### Tab: Admin user

Single-panel layout.

- Header: `+ Create user` (left), `Edit` / `Delete` / `Change password` buttons (right, enabled only when a row is selected)
- `el-table` columns: No., Email address, Name, Phone, Role Names, Status
- No pagination unless admin count exceeds 20

---

### 3.3 Create / Edit Organization Modal

- `el-dialog`, width `700px`, centered
- Title: "Create organization" or "Edit organization"
- Two tabs: **Details** | **Relationships**

**Details tab fields:**
| Label | Component | Notes |
|---|---|---|
| Organization Name* | `el-input` | Required |
| Code | `el-input` | Optional |
| CW Code | `el-input` | Optional |
| Type* | `el-checkbox-group` | Shipper, Consignee, Agent — at least one required |
| Origin (UNLOCO) | `el-input` | Optional |
| Address 1 | `el-input` | Optional |
| Address 2 | `el-input` | Optional |
| Address 3 | `el-input` | Optional |
| Address 4 | `el-input` | Optional |
| City | `el-input` | Optional |
| Postal | `el-input` | Optional |
| Country | `el-input` | Optional |

**Relationships tab:**
- `el-table` listing existing relationships:
  - Columns: Related Organization, Relationship Type, Remove (danger icon button)
- `+ Add relationship` button opens an inline form row at the bottom:
  - Organization selector (`el-select`, searchable, lists all orgs except self and already-linked orgs)
  - Label field (`el-input`, optional free-text note e.g. "Preferred agent")
  - Confirm / Cancel buttons
- Removing a relationship uses `ElMessageBox.confirm()`
- Changes to relationships are saved immediately (separate API calls), not on modal Submit

**Footer:** Submit (primary) | Reset (secondary) | Cancel (secondary)

---

### 3.4 Create / Edit User Modal

- `el-dialog`, width `600px`, centered
- Title: "Create user" or "Edit user"
- Info text below title (create only): "New user initial password is 123456."
- Two tabs: **User Info** | **User Permission**

**User Info tab fields:**
| Label | Component | Notes |
|---|---|---|
| Email Address* | `el-input` | Required |
| Name | `el-input` | Optional |
| Phone Number | `el-input` | Optional |
| Organization | `el-select` | Searchable, nullable for admin users |
| Status | `el-checkbox` | Label: "Disabled" |
| User Role | `el-checkbox-group` | admin, shipper, consignee, agent |

**User Permission tab:** placeholder "Permissions coming soon." (out of scope)

**Footer:** Submit (primary) | Reset (secondary) | Cancel (secondary)

- On success: close modal, refresh user list, `ElMessage.success`
- On error: `ElMessage.error` with server message

---

### 3.5 Change Password Modal

- `el-dialog`, width `400px`, title: "Change password"
- Fields: New Password (required), Confirm Password (required, must match)
- Footer: Submit (primary) | Cancel (secondary)
- On success: `ElMessage.success("Password changed. User must log in again.")`, close

---

### 3.6 Delete Confirmations

All deletes use `ElMessageBox.confirm()`:

| Target | Confirmation message |
|---|---|
| Organization | "Are you sure you want to delete this organization? This action cannot be undone." |
| User | "Are you sure you want to delete this user? This action cannot be undone." |
| Relationship | "Remove this relationship?" |

- Confirm button: danger style (red)
- On success: refresh table + `ElMessage.success`
- If blocked: `ElMessage.error("Cannot delete organization with existing users.")`

---

## 4. Sidebar Navigation

```
Dashboard
New booking
Search booking
System management (expandable)
  └── Organization
  └── Role              ← link rendered, page out of scope for this task
Shipment Tracking
PO Details
```

- Top-left: ARC Global Logistics logo
- Top-right: logged-in user name + avatar icon
- Sidebar collapsible via `<<` toggle
- Active route highlighted in teal/primary

---

## 5. Access Control

| Route / Action              | Required role          |
|-----------------------------|------------------------|
| `/login`                    | Public                 |
| All `/system/*` routes      | `admin`                |
| All other internal routes   | Any authenticated user |

- Unauthenticated → redirect to `/login`
- Authenticated non-admin on `/system/*` → `403` page

---

## 6. Out of Scope for This Task

- Forgot password / reset password flow
- Sign up flow
- User Permission tab content
- Role management page (`/system/role`)
- Any customer portal (`apps/customer`) auth screens

These will be addressed in separate spec files.
