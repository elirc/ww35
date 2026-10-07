# Appointment Booking System

This is a Next.js + TypeScript booking app with PostgreSQL, Prisma, Zod, and React Query. The code is split around request boundaries and business boundaries: `src/app/api/*` handles HTTP, `src/services/*` owns business rules, `src/repositories/*` owns database reads and writes, and `src/components/*` plus `src/hooks/*` keep the UI thin.

Top-level map:

- `src/app` contains routes and pages.
- `src/app/api/auth/login/route.ts` and `src/app/api/auth/logout/route.ts` handle session creation and teardown.
- `src/app/api/appointments/route.ts` and `src/app/api/appointments/[appointmentId]/cancel/route.ts` handle booking and cancellation.
- `src/services/appointmentService.ts` and `src/services/availabilityService.ts` own the calendar and appointment rules.
- `src/repositories/appointmentRepository.ts`, `src/repositories/staffRepository.ts`, and `src/repositories/userRepository.ts` own Prisma queries.
- `src/lib/auth/*`, `src/lib/validation/*`, and `src/lib/data/*` hold shared guards, schemas, and query scopes.
- `src/components/*` and `src/hooks/*` drive the React UI and data fetching.
- `prisma/schema.prisma` defines the domain model, and `prisma/migrations/0001_initial/migration.sql` adds the PostgreSQL exclusion constraint that prevents overlapping bookings.

Why this split matters:

- `src/app/api/*` stays focused on request parsing and response codes.
- `src/services/*` is where a reviewer checks the actual product rules.
- `src/repositories/*` is where you verify the app is not leaking data or querying too broadly.
- `src/lib/data/appointmentScopes.ts` keeps owner scoping central so the same filter is reused everywhere.

If multi-tenancy is added later, the first places to change would be `prisma/schema.prisma`, `src/lib/data/appointmentScopes.ts`, `src/repositories/*.ts`, and `src/services/authService.ts`.

## Three layers of overlap protection

1. Preview and booking share `isSlotOpen` (`src/lib/availability/schedule.ts:99-110`), which treats time off and booked
   appointments as blocked windows.
2. `bookAppointment` re-reads conflicting `BOOKED` rows (`src/services/appointmentService.ts:54-62`).
3. The database exclusion constraint in `prisma/migrations/0001_initial/migration.sql` rejects concurrent overlapping
   inserts; the service translates only that named violation into a 409 (lines 72-75).

Only the third is race-safe. The first two give better messages.

**Exercise — Goal:** find each layer. **Check:** open the migration and locate the exclusion constraint; state which
appointment status it applies to (`BOOKED`) and why cancelled rows free the slot.
