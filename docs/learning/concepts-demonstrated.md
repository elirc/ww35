# Concepts Demonstrated

## Service layer
Where to look: `src/services/appointmentService.ts` - `bookAppointment()` and `cancelAppointment()` own booking rules and state changes.
Also see: `src/services/availabilityService.ts` for staff setup and derived availability.
Risk if wrong: route handlers or components start duplicating product rules and drift apart.

## Repository pattern
Where to look: `src/repositories/appointmentRepository.ts` - the Prisma read/write methods own database access.
Also see: `src/repositories/userRepository.ts` and `src/repositories/sessionRepository.ts` for auth persistence.
Risk if wrong: data access becomes scattered and hard to audit for leaks.

## Zod validation boundary
Where to look: `src/lib/validation/appointmentSchemas.ts` - `createWorkingHoursRuleSchema` and the booking/cancel schemas validate request shape before services run.
Also see: `src/app/api/admin/time-off/route.ts` for an inline validation example.
Risk if wrong: bad input reaches the service layer and creates partial or invalid records.

## Auth/session flow
Where to look: `src/services/authService.ts` - `login()` and `getActorFromRequest()` create and resolve sessions.
Also see: `src/lib/auth/session.ts` for token hashing and cookie policy.
Risk if wrong: anonymous requests can be treated as authenticated or expired sessions can keep working.

## Role-based access control
Where to look: `src/lib/auth/with-role.ts` - the `requireRole()` call rejects non-admin actors before admin handlers run.
Also see: `src/lib/auth/permissions.ts` for the reusable role checks.
Risk if wrong: clients or staff can mutate admin-only data.

## State transition validation
Where to look: `src/services/appointmentService.ts` - `cancelAppointment()` prevents cancelling a cancelled appointment.
Also see: `src/lib/errors.ts` - `InvalidTransitionAppError` maps that invalid state into a 409 response.
Risk if wrong: the system accepts impossible states and downstream UI logic becomes unreliable.

## Availability calendar derivation
Where to look: `src/lib/availability/schedule.ts` - `isSlotOpen()` and `buildAvailabilitySlots()` calculate calendar slots from rules and blocked windows.
Also see: `src/services/availabilityService.ts` for the orchestration that feeds the helper.
Risk if wrong: the calendar UI lies about what can actually be booked.

## Data scoping / ownership filters
Where to look: `src/lib/data/appointmentScopes.ts` - `buildAppointmentListWhere()` and `buildAppointmentAccessWhere()` keep appointment queries owner-aware.
Also see: `src/repositories/appointmentRepository.ts` for the actual Prisma reads that apply those filters.
Risk if wrong: one user can read another user’s appointments.

## Multi-tenancy
Where to look: not implemented in this codebase.
Also see: `docs/architecture/auth-and-permissions.md` for the exact files that would need `tenantId` changes.
Risk if wrong: adding tenancy later without centralizing the scope would cause a widespread data leak.

## Audit logging
Where to look: not implemented in this codebase.
Also see: `src/services/appointmentService.ts` and `src/services/availabilityService.ts` would be the natural insertion points for a future activity log.
Risk if wrong: admin and booking changes become hard to investigate after the fact.

## Background jobs
Where to look: not implemented in this codebase.
Also see: `src/services/appointmentService.ts` for the synchronous workflow that would be the first candidate for async follow-up work later.
Risk if wrong: the app would promise reminders or sync jobs without an actual queue boundary.
