# Phase 8: Integration And Verification

## Goal

Harden the auth module by connecting backend and frontend flows end to end, filling any remaining test gaps, and validating the Podman-based dev/test workflow.

## Files Likely To Change

- `packages/api/src/**/*.test.ts`
- `apps/internal/src/**/*.test.ts`
- `packages/api/package.json`
- `apps/internal/package.json`
- `packages/db/package.json`
- `infra/scripts/start-test.sh`
- `infra/container/podman-compose.test.yml`
- `.env.example`
- `docs/plans/auth/*.md`
- `docs/**` auth-related setup notes if needed

## Step-by-Step Checklist

- [ ] Review all prior phases and identify any contract mismatches between backend payloads and frontend expectations.
- [ ] Add or refine Supertest coverage for auth, organization, and user endpoints where integration gaps remain.
- [ ] Add or refine frontend tests for login, route protection, organization workflows, and password-change behavior where coverage is still thin.
- [ ] Ensure the backend and frontend both honor the shared response envelope and role names consistently.
- [ ] Validate the Prisma migration, seed, and test database setup against the Podman test workflow.
- [ ] Run the planned verification commands for type-checking, linting, Prisma generation, backend tests, frontend tests, and integration tests.
- [ ] Fix any environment documentation gaps in `.env.example` and related setup docs that would block a fresh developer from running auth locally.
- [ ] Update the planning docs only if execution revealed a necessary sequencing or ownership correction.
- [ ] Produce a short verification summary capturing what passed, what remains risky, and any follow-up work that should be split into a separate plan.

## Acceptance Criteria

- Core auth, organization, and user flows work together across backend and frontend.
- Test coverage exists for the highest-risk backend and frontend behaviors introduced by the auth module.
- The Podman-backed test workflow is documented and usable for auth-related verification.
- Any remaining gaps are clearly documented as follow-up work rather than silently deferred.

## Out-of-Scope Items

- New auth features not present in `docs/specs/auth.md`
- Customer portal auth screens
- Role-management page implementation
- Production deployment configuration changes beyond auth-related documentation
