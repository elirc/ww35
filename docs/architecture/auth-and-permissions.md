# Auth and Permissions

Session creation starts in `src/app/api/auth/login/route.ts`, which validates the payload with `loginSchema` from `src/lib/validation/authSchemas.ts` and then calls `login()` in `src/services/authService.ts`. That service hashes the supplied password with `verifyPassword()` in `src/lib/auth/password.ts`, creates a session token in `src/lib/auth/session.ts`, stores the hashed token through `src/repositories/sessionRepository.ts`, and returns the user payload for the cookie-setting response.

Session lookup happens in `src/services/authService.ts` inside `getActorFromRequest()`. It reads `appointment_session` from the request cookie, hashes the token, and loads the active session from `src/repositories/sessionRepository.ts`. If the session is missing, revoked, or expired, the request never reaches the handler body because `src/lib/auth/with-auth.ts` converts that into a 401 response.

Role checks are centralized in `src/lib/auth/permissions.ts` and enforced in the route guards:

- `src/lib/auth/with-role.ts` calls `requireRole()` before an admin route handler runs.
- `src/lib/auth/with-auth.ts` blocks anonymous requests before a protected handler runs.
- `src/app/api/admin/staff/route.ts`, `src/app/api/admin/working-hours/route.ts`, and `src/app/api/admin/time-off/route.ts` use `withRole(["ADMIN"], ...)`.

Ownership checks are not scattered through React components. Instead:

- `src/lib/data/appointmentScopes.ts` builds the Prisma `where` filters for admin, staff, and client views.
- `src/repositories/appointmentRepository.ts` uses those filters in `listAppointmentsForActor()` and `findScopedAppointmentById()`.
- `src/services/appointmentService.ts` still performs a second explicit cancellation check so the state transition is enforced before the update write happens.

Current role model:

- `ADMIN` can manage staff, working hours, and time off through the admin routes.
- `CLIENT` can book and cancel their own appointments.
- `STAFF` can view their scoped calendars and appointments, but the booking endpoint rejects them.

No multi-tenancy is included. If the product later needs org boundaries, the changes would be:

- Add `tenantId` to `User`, `Session`, `StaffProfile`, `WorkingHoursRule`, `TimeOffBlock`, and `Appointment` in `prisma/schema.prisma`.
- Load `tenantId` in `src/services/authService.ts` and include it in the `RequestActor`.
- Add tenant filters to `src/lib/data/appointmentScopes.ts`.
- Update every repository query in `src/repositories/*.ts` to include `tenantId` alongside the ownership filter.
- Add tenant-aware tests for a cross-tenant leak.

## Scope predicates (`src/lib/data/appointmentScopes.ts:8-19`)

| Role | Appointment `where` |
|---|---|
| ADMIN | `{}` (all) |
| STAFF | `{ staffProfileId }`, or the impossible id `__missing_staff_profile__` when the actor has none |
| CLIENT | `{ clientId: userId }` |

The same predicate is applied to list reads, detail reads (`findScopedAppointmentById`) and the conditional cancellation write
(`appointmentRepository.ts:155`), so a foreign appointment returns 404 rather than revealing its status.

## Review notes

- `getStaffAvailability` ignores its actor (`src/services/availabilityService.ts:107-114`): any signed-in user can read any staff
  member's open and blocked slots. That is probably intended for a booking app, but it is a deliberate exposure of busy times.
- Staff can cancel any appointment on their own calendar, including past ones; no role is limited by time.

**Exercise — Goal:** confirm the fallback. **Check:** for a STAFF actor whose `staffProfileId` is undefined, state the `where` clause
and the number of rows it can match (none).
