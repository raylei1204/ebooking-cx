# Freight Forwarding Web Application

## When in Doubt
If a requirement is ambiguous or a decision has architectural implications, **stop and propose options before writing code**. Do not make silent assumptions on judgment calls.

If any referenced file (e.g. `docs/UI_GUIDE.md`) is missing at session start, **stop and ask** before generating any UI or code that depends on it.

---

## Project Overview
A web application for a freight forwarding company covering shipment tracking, booking, order and documentation management.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API) |
| Backend | NestJS (Node.js framework) |
| Database | PostgreSQL |
| ORM | Prisma (preferred) or TypeORM |
| Language | TypeScript throughout (no plain JS) |
| Testing | Jest + Supertest |
| Dev/Test Containers | Podman + podman-compose |
| Production Deploy | VM (PM2 or systemd + Nginx) |

---

## Architecture Notes
- Two Vue 3 frontend apps (`customer` and `internal`) served from the same NestJS backend via REST API
- NestJS uses modules, controllers, services pattern with decorators and dependency injection — follow its conventions strictly
- PostgreSQL accessed via Prisma (preferred) or TypeORM — both support strict typing with NestJS
- `packages/shared` contains types, utilities, and constants shared across both Vue apps and the API — use it to avoid duplication

### Customer vs Internal App
| Concern | Customer Portal (`apps/customer`) | Internal Dashboard (`apps/internal`) |
|---|---|---|
| Auth role | `customer` | `staff` / `admin` |
| Access | Public-facing login | Internal network or SSO |
| Shared components | Via `packages/shared` only | Via `packages/shared` only |
| Route prefix | `/api/v1/customer/...` | `/api/v1/internal/...` |

Do **not** share Vue components directly between the two apps. Shared logic belongs in `packages/shared`.

---

## API Design Conventions

### URL Structure
```
/api/v1/{app}/{resource}
# Examples:
/api/v1/customer/shipments
/api/v1/internal/bookings
```

### Response Envelope
All API responses must follow this shape:

**Success:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 42 }   // optional, for paginated responses
}
```

**Error:**
```json
{
  "error": {
    "code": "SHIPMENT_NOT_FOUND",
    "message": "No shipment found with the given ID.",
    "statusCode": 404
  }
}
```

### HTTP Status Codes
- `200` — success (GET, PATCH)
- `201` — created (POST)
- `204` — no content (DELETE)
- `400` — validation error
- `401` — unauthenticated
- `403` — unauthorised (authenticated but insufficient role)
- `404` — resource not found
- `500` — unexpected server error (never expose stack traces)

---

## Authentication
- Strategy: **JWT (JSON Web Tokens)**
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- All protected API routes must use the `JwtAuthGuard` — no exceptions
- Role-based access control via `RolesGuard` with a `@Roles()` decorator
- If the auth implementation is not yet decided for a module, scaffold a **stub middleware** that returns `401` with a `TODO` comment — do not invent an implementation

---

## UI / UX Rules
Before generating any frontend code:
1. Read `docs/UI_GUIDE.md`
2. If this file does not exist, **stop and ask** — do not proceed with invented styles

When building UI:
- Reuse existing components; do not create a new component if one already covers the use case
- Follow the established table + card layout pattern consistently
- Do not invent new styles or colour tokens
- If a layout decision is unclear, **propose the layout first** before writing code

---

## Coding Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` types — use `unknown` with type guards if needed
- Define explicit return types on all exported functions
- Use `interface` for object shapes, `type` aliases for unions/primitives

### Formatting & Linting
- ESLint + Prettier enforced — always run before committing
- Do NOT disable ESLint rules inline without a comment explaining why
- Prettier config is the source of truth for formatting; do not manually reformat

### General
- 2-space indentation (enforced by Prettier)
- Single quotes for strings
- No trailing commas in function parameters
- Async/await preferred over `.then()` chains
- Always handle errors explicitly — no silent `catch` blocks

---

## Project Structure (Monorepo)
```
/
├── apps/
│   ├── customer/        # Vue 3 customer portal
│   └── internal/        # Vue 3 internal ops dashboard
├── packages/
│   ├── api/             # NestJS backend (shared)
│   ├── db/              # PostgreSQL schema, migrations, Prisma client
│   └── shared/          # Shared types, utils, constants (used by all apps)
├── infra/
│   ├── container/
│   │   ├── podman-compose.dev.yml   # Dev environment
│   │   └── podman-compose.test.yml  # Test environment
│   └── scripts/
│       ├── start-dev.sh             # Start dev stack via Podman
│       └── start-test.sh            # Start test stack via Podman
├── docs/
│   └── UI_GUIDE.md      # UI/UX rules — must be read before any frontend work
├── .env.example         # Template for required environment variables (committed)
├── .env                 # Actual secrets (NEVER committed)
├── .env.test            # Test-specific overrides (NEVER committed)
├── AGENTS.md
└── .Codex/
    └── settings.json
```

---

## Environment & Infrastructure

### Environment Summary

| Environment | How it runs | Config file |
|---|---|---|
| Development | Podman Compose | `.env` + `podman-compose.dev.yml` |
| Testing | Podman Compose | `.env.test` + `podman-compose.test.yml` |
| Production | Direct VM deploy (systemd / PM2) | Env vars set on VM, no containers |

---

### Development & Testing — Podman

Use **Podman** (not Docker) for local dev and test environments. Do not generate Docker-specific instructions or `docker-compose.yml` files.

**Key rules:**
- Use `podman-compose` (not `docker compose`) for all container orchestration
- Compose files live in `infra/container/`
- Helper scripts live in `infra/scripts/` — use these to start/stop stacks, never raw `podman` commands in docs
- Podman runs rootless by default — do not require root or `sudo` for container commands
- Use named volumes for PostgreSQL data persistence in dev; wipe volumes between test runs

**Dev stack** (`podman-compose.dev.yml`) includes:
- PostgreSQL (with persistent named volume)
- NestJS API (hot-reload via `ts-node-dev` or `nest start --watch`)
- Both Vue apps served via `vite dev` (outside container, on host)

**Test stack** (`podman-compose.test.yml`) includes:
- PostgreSQL (ephemeral — volume wiped on each run)
- NestJS API in test mode (`NODE_ENV=test`)
- No frontend containers — integration tests hit the API directly

**Start commands:**
```bash
# Dev
./infra/scripts/start-dev.sh

# Test
./infra/scripts/start-test.sh
```

---

### Production — VM Deploy

Production runs directly on a VM (no containers). Do not generate container configs for production.

**Deployment approach:**
- NestJS API managed by **PM2** or **systemd** (confirm with team before generating config)
- Vue apps built to static files and served by **Nginx**
- PostgreSQL runs as a native service on the VM or a managed DB instance
- Migrations run via `prisma migrate deploy` as part of the deploy script — never run manually in prod

**Do not:**
- Generate a `Dockerfile` or production Compose file
- Assume container networking (e.g. service names as hostnames) in production config
- Hardcode VM-specific paths — use environment variables

---

### `.env.example`
Every environment variable the app depends on must have a corresponding entry in `.env.example` with a placeholder value and a comment. Example:
```env
# App environment: development | test | production
NODE_ENV=development

# PostgreSQL connection string
# Dev/test: points to Podman container. Prod: points to VM/managed DB.
DATABASE_URL=postgresql://user:password@localhost:5432/freight_db

# JWT signing secret (min 32 chars)
JWT_SECRET=replace_me_with_a_secure_random_string

# JWT token lifetimes
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

Rules:
- Never commit `.env` or `.env.test`
- Always update `.env.example` when adding a new variable
- Never hardcode environment-specific values (URLs, ports, credentials) in source code
- `.env.test` overrides for the test stack (e.g. a separate `DATABASE_URL` pointing to the test DB)

---

## Git Workflow (Gitflow)

| Branch | Purpose |
|---|---|
| `main` | Production only — never commit directly |
| `develop` | Integration branch — all features merge here first |
| `feature/*` | One feature per branch, branched from `develop` |
| `hotfix/*` | Branched from `main`, merged into both `main` and `develop` |
| `release/*` | Branched from `develop` for pre-release stabilisation |

### Branch Naming
```
feature/shipment-tracking-page
feature/booking-form-validation
hotfix/awb-number-null-crash
release/v1.2.0
```

### Commit Messages (Conventional Commits)
```
feat(tracking): add real-time shipment status updates
fix(booking): correct AWB validation for air freight
chore(db): add index on shipments.status column
docs(api): update booking endpoint documentation
```

---

## Testing

- **Framework**: Jest (unit + integration), Supertest (API endpoint testing)
- Unit tests required for all business logic (services, utils)
- Integration tests required for all API endpoints
- Do not mark a feature complete until tests pass end-to-end
- Test files live alongside source:
  - `shipment.service.ts` → `shipment.service.test.ts`
  - `booking.controller.ts` → `booking.controller.test.ts`
- **Coverage thresholds** (enforced in `jest.config.ts`):
  - Statements: 80%
  - Branches: 75%
  - Functions: 80%

---

## Security
- NEVER commit `.env` files or secrets
- NEVER log sensitive customer data (names, addresses, contact info)
- All API routes must validate authentication before accessing data
- Use parameterised queries only — no raw string SQL concatenation
- Never expose stack traces or internal error details in API responses

---

## Database
- PostgreSQL via connection pool (not direct connections)
- All schema changes go through migrations (never edit schema directly in prod)
- Use `snake_case` for table and column names
- Every table must have `created_at` and `updated_at` timestamps
- Prisma is the preferred ORM; use `prisma migrate dev` for local migrations and `prisma migrate deploy` for production

---

## What NOT to Do
- Do not create files outside the defined project structure without discussion
- Do not install new npm packages without checking if an existing utility covers it
- Do not hardcode environment-specific values (URLs, ports, credentials)
- Do not bypass TypeScript errors with `@ts-ignore` without a comment explaining why
- Do not share Vue components directly between `apps/customer` and `apps/internal` — use `packages/shared`
- Do not invent an auth implementation — stub with `TODO` if undecided
- Do not proceed past a missing `docs/UI_GUIDE.md` — stop and ask
- Do not generate Docker or `docker-compose` files — use Podman and `podman-compose` for dev/test
- Do not generate container configs for production — prod is a direct VM deploy
- Do not use `sudo` or root for Podman commands — it runs rootless
