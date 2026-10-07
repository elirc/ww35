# Build Journal

## Stage 1 - Project framing and architecture
- Built: the appointment booking domain, the role model, and the request/data boundary plan.
- Decision: use Next.js App Router with REST endpoints instead of tRPC.
- Why: the app is a corporate CRUD-style product with clear HTTP boundaries and permission gates, so the request path should stay explicit.

## Stage 2 - Database and model design
- Built: `prisma/schema.prisma` and `prisma/migrations/0001_initial/migration.sql`.
- Decision: use Prisma on PostgreSQL and enforce double-booking prevention with a range exclusion constraint.
- Why: availability conflicts are a data integrity problem, not just a UI problem, and PostgreSQL should reject the bad write too.

## Stage 3 - Auth and authorization
- Built: `src/lib/auth/session.ts`, `src/services/authService.ts`, `src/lib/auth/with-auth.ts`, and `src/lib/auth/with-role.ts`.
- Decision: keep auth/session logic server-side and keep role checks centralized in route guards.
- Why: role checks in React would be easy to bypass and hard to review.

## Stage 4 - Repositories and business services
- Built: `src/repositories/*.ts`, `src/lib/data/appointmentScopes.ts`, `src/lib/availability/schedule.ts`, `src/services/appointmentService.ts`, and `src/services/availabilityService.ts`.
- Decision: keep business rules out of route files and keep owner scoping in one helper.
- Why: the service layer is the place where a reviewer can understand the product rule without scanning UI code.

## Stage 5 - API routes and frontend workflow
- Built: `src/app/api/*`, `src/hooks/*`, and `src/components/*`.
- Decision: make the UI a consumer of query hooks and mutations rather than a second source of truth.
- Why: the booking state should live in the API and database, not in local component state.

## Stage 6 - Tests and documentation
- Built: `tests/*.test.ts` and the code-anchored docs under `docs/architecture` and `docs/learning`.
- Decision: test permission rejection, validation rejection, invalid transitions, and scoping separately.
- Why: those are the four places this kind of product usually fails in production.

## PR Slices

### Slice 1 - Foundation and domain model
Purpose: establish the schema, base config, and shared types.
Files with novel logic: `prisma/schema.prisma`, `prisma/migrations/0001_initial/migration.sql`, `src/types/domain.ts`, `src/lib/errors.ts`, `src/lib/auth/session.ts`, `src/lib/auth/password.ts`.
Reviewer focus:
- `prisma/migrations/0001_initial/migration.sql` around the exclusion constraint and foreign keys.
- `src/lib/auth/session.ts` around token generation and cookie policy.
- `src/lib/errors.ts` around the status mapping contract.
Junior reviewer blind spot: approving the model without checking the overlap constraint or the session hashing scheme.

### Slice 2 - Repositories and services
Purpose: move all business rules and database access into reviewable backend modules.
Files with novel logic: `src/lib/data/appointmentScopes.ts`, `src/lib/availability/schedule.ts`, `src/repositories/*.ts`, `src/services/*.ts`.
Reviewer focus:
- `src/services/appointmentService.ts` around the booking and cancellation checks.
- `src/lib/availability/schedule.ts` around the timezone-aware slot evaluation.
- `src/repositories/appointmentRepository.ts` around the narrow `select` shapes and overlap query.
Junior reviewer blind spot: approving any repository include that exposes the full user record.

### Slice 3 - API routes and guards
Purpose: make the HTTP boundary thin, explicit, and consistently protected.
Files with novel logic: `src/lib/http/*`, `src/lib/auth/with-auth.ts`, `src/lib/auth/with-role.ts`, `src/app/api/**/*/route.ts`.
Reviewer focus:
- `src/lib/auth/with-role.ts` around the admin gate.
- `src/app/api/appointments/route.ts` around validation and service delegation.
- `src/app/api/admin/staff/route.ts` around the permission boundary.
Junior reviewer blind spot: approving route handlers that duplicate service logic or skip the guard wrapper.

### Slice 4 - Frontend hooks and dashboard
Purpose: build the React UI as a consumer of API state.
Files with novel logic: `src/lib/api-client.ts`, `src/hooks/*.ts`, `src/components/*.tsx`, `src/app/layout.tsx`, `src/app/dashboard/page.tsx`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/globals.css`.
Reviewer focus:
- `src/components/BookingDashboard.tsx` around mutation invalidation and role-aware rendering.
- `src/hooks/useAppointments.ts` around cache invalidation after booking and cancellation.
- `src/components/AdminAvailabilityForms.tsx` around timezone conversion for admin time-off input.
Junior reviewer blind spot: approving local state as if it were the source of truth for bookings.

### Slice 5 - Tests and teaching docs
Purpose: lock in the critical failure modes and make the codebase teachable.
Files with novel logic: `tests/*.test.ts`, `docs/architecture/*`, `docs/learning/*`.
Reviewer focus:
- `tests/auth-permissions.test.ts` around a real forbidden-path assertion.
- `tests/appointment-transition.test.ts` around invalid cancellation.
- `docs/learning/flow-traces.md` around the request order and exact file paths.
Junior reviewer blind spot: assuming docs are accurate without checking they reference the actual generated functions and files.

## Later work — local-day boundaries and one-winner cancellation

Purpose: reject cross-midnight intervals that only looked like daytime, and make cancellation actor-scoped and conditional on
`BOOKED`. Files: `src/lib/availability/schedule.ts`, `src/services/appointmentService.ts`,
`src/repositories/appointmentRepository.ts`, `src/lib/data/appointmentErrors.ts`, plus four new test files. Before-states are in
`astraupskill/snapshots/`.

## Open decisions found during doc review

- Should bookings be restricted to the preview grid? Today any fitting start is accepted.
- Should clients be able to cancel finished appointments?
- Should staff creation be transactional?

**Exercise — Goal:** write a decision record. **Check:** draft one of the three with two options and a con each grounded in the cited
files.
