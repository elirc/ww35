# Guided Reading Path

## Step 1 — `prisma/schema.prisma`
**Why read this:** This is the canonical domain model.
**What to look for:** The `Role` and `AppointmentStatus` enums, plus the `StaffProfile` and `Appointment` relations.
**What to trace:** `src/repositories/*.ts` reads from this schema, and `src/services/*` uses the generated model shapes.
**What a junior would likely miss:** The model can look simple while still requiring a separate database-level overlap constraint.

## Step 2 — `prisma/migrations/0001_initial/migration.sql`
**Why read this:** It shows the real database guarantee behind double-booking prevention.
**What to look for:** The exclusion constraint on `Appointment`.
**What to trace:** `src/services/appointmentService.ts` checks conflicts first, but PostgreSQL is the last line of defense.
**What a junior would likely miss:** App-level conflict checks are not enough under concurrency.

## Step 3 — `src/lib/auth/session.ts`
**Why read this:** This defines the session token contract.
**What to look for:** Cookie name, TTL, token generation, and hashing.
**What to trace:** `src/app/api/auth/login/route.ts` sets the cookie, and `src/services/authService.ts` reads it.
**What a junior would likely miss:** Never store or compare the raw token in the database.

## Step 4 — `src/services/authService.ts`
**Why read this:** This is the session and login workflow.
**What to look for:** `login()`, `logout()`, and `getActorFromRequest()`.
**What to trace:** `src/lib/auth/with-auth.ts` calls into this file before any protected handler runs.
**What a junior would likely miss:** Auth is a server concern, not a UI concern.

## Step 5 — `src/lib/auth/with-auth.ts`
**Why read this:** This is the reusable authentication guard.
**What to look for:** How it converts missing sessions into a 401 response.
**What to trace:** It wraps `src/app/api/me/route.ts`, `src/app/api/appointments/route.ts`, and `src/app/api/staff/route.ts`.
**What a junior would likely miss:** Every protected route should use the same guard shape.

## Step 6 — `src/lib/auth/with-role.ts`
**Why read this:** This is where admin-only access is enforced.
**What to look for:** The call to `requireRole()`.
**What to trace:** `src/app/api/admin/staff/route.ts`, `src/app/api/admin/working-hours/route.ts`, and `src/app/api/admin/time-off/route.ts`.
**What a junior would likely miss:** UI role checks are not security.

## Step 7 — `src/lib/validation/appointmentSchemas.ts`
**Why read this:** It is the request-shape boundary.
**What to look for:** The `refine()` for working-hours and the datetime validation.
**What to trace:** `src/app/api/admin/working-hours/route.ts`, `src/app/api/admin/time-off/route.ts`, and `src/app/api/appointments/route.ts`.
**What a junior would likely miss:** Invalid input should be rejected before it reaches a repository.

## Step 8 — `src/lib/data/appointmentScopes.ts`
**Why read this:** It centralizes owner scoping for appointment reads.
**What to look for:** `buildAppointmentListWhere()` and `buildAppointmentAccessWhere()`.
**What to trace:** `src/repositories/appointmentRepository.ts` uses the scope helpers in every read path.
**What a junior would likely miss:** Forgetting a scope filter on one repository method causes a leak.

## Step 9 — `src/repositories/appointmentRepository.ts`
**Why read this:** This is the actual data-access boundary for bookings.
**What to look for:** The overlap query and the narrow `select` shapes.
**What to trace:** `src/services/appointmentService.ts` calls into these methods for reads and writes.
**What a junior would likely miss:** Eager-loading too much can leak secrets like password hashes.

## Step 10 — `src/lib/availability/schedule.ts`
**Why read this:** This is the slot-calculation engine.
**What to look for:** `isSlotOpen()` and `buildAvailabilitySlots()`.
**What to trace:** `src/services/availabilityService.ts` and `src/services/appointmentService.ts`.
**What a junior would likely miss:** Availability is derived from rules and blocked windows, not stored as a guessed list.

## Step 11 — `src/services/availabilityService.ts`
**Why read this:** This owns staff setup and calendar shape.
**What to look for:** `createStaffMember()`, `createWorkingHours()`, `createTimeOff()`, and `getStaffAvailability()`.
**What to trace:** Admin route handlers call these methods, and the booking flow reads their outputs.
**What a junior would likely miss:** Calendar rules and calendar rendering are not the same thing.

## Step 12 — `src/services/appointmentService.ts`
**Why read this:** This owns the booking state machine.
**What to look for:** The validation, conflict check, and cancellation guard.
**What to trace:** `src/app/api/appointments/route.ts` and `src/app/api/appointments/[appointmentId]/cancel/route.ts`.
**What a junior would likely miss:** A transition check must happen before the update write, not just after.

## Step 13 — `src/app/api/appointments/route.ts`
**Why read this:** It shows the thin route-handler pattern.
**What to look for:** Parse, auth, service call, response.
**What to trace:** `src/lib/auth/with-auth.ts`, `src/lib/validation/appointmentSchemas.ts`, and `src/services/appointmentService.ts`.
**What a junior would likely miss:** A route should not duplicate service logic.

## Step 14 — `src/components/BookingDashboard.tsx`
**Why read this:** It shows how the UI stays a consumer of API state.
**What to look for:** The query hooks and mutation invalidation.
**What to trace:** It drives `src/hooks/useAppointments.ts`, `src/hooks/useAvailability.ts`, `src/hooks/useStaff.ts`, and `src/hooks/useAuth.ts`.
**What a junior would likely miss:** Treating local React state as the source of truth for appointments.

## Checkpoints added with the calendar and cancellation work

- **Schedule.** **Goal:** read `src/lib/availability/schedule.ts:71-97`. **Check:** explain why a 23:30-00:30 appointment fails against
  a 09:00-17:00 rule even though its end minute (30) is small.
- **Grid.** **Goal:** read `schedule.ts:112-143`. **Check:** state what the grid is anchored to (the caller's `from`).
- **Cancellation.** **Goal:** read `appointmentService.ts:81-108` with `appointmentRepository.ts:150-160`. **Check:** list the three
  conditions in the `updateMany` `where` and what a zero count becomes.
- **Errors.** **Goal:** read `src/lib/data/appointmentErrors.ts`. **Check:** say which Prisma error type and metadata must both match.
