# Appointment booking system

Clients book appointments with staff members; staff calendars combine weekly working-hours rules (in the staff member's
IANA timezone), time-off blocks and existing bookings. Admins create staff, working hours and time off. Next.js route
handlers, Prisma/PostgreSQL, Zod, React Query.

## Running

`package.json` scripts: `dev`, `build`, `start`, `lint`, `test` (`vitest run`), `test:watch`, `typecheck` (`tsc --noEmit`).
The seed (`prisma/seed.ts`) creates `admin@acme.test`, `staff@acme.test` and `client@acme.test`. Apply
`prisma/migrations/0001_initial/migration.sql` rather than `db push` so the `btree_gist` exclusion constraint that prevents
overlapping `BOOKED` appointments exists.

## Sessions

Login sets an `httpOnly`, `sameSite=lax` cookie `appointment_session` holding a 32-byte random token; only its SHA-256 hash
is stored (`src/lib/auth/session.ts:8-27`). Protected routes use `withAuth` (`src/lib/auth/with-auth.ts`), which returns 401
without a session.

## Appointment boundary course

[Start the source-based course](astraupskill/README.md) for local-day and midnight rules, conditional actor-scoped cancellation and verification evidence. The existing SQL exclusion constraint requires the hand-written migration; Prisma db push alone does not recreate it. Tests use mocked persistence and do not claim live database concurrency verification.
