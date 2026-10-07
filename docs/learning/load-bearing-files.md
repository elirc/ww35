# Load-Bearing Files

## `src/services/appointmentService.ts`
What it does: owns booking, cancellation, and the state-transition rules.
What calls it: `src/app/api/appointments/route.ts` and `src/app/api/appointments/[appointmentId]/cancel/route.ts`.
What it calls: `src/repositories/appointmentRepository.ts`, `src/repositories/staffRepository.ts`, and `src/services/availabilityService.ts`.
What would break if it were wrong: double-booking, invalid cancellations, and hidden permission leaks would all become possible.
What a junior engineer would likely miswrite here: booking directly after the first availability check without a second conflict guard.

## `src/services/availabilityService.ts`
What it does: owns staff creation, working-hours setup, time-off blocks, and derived availability.
What calls it: `src/app/api/admin/staff/route.ts`, `src/app/api/admin/working-hours/route.ts`, `src/app/api/admin/time-off/route.ts`, and `src/app/api/staff/[staffProfileId]/availability/route.ts`.
What it calls: `src/repositories/userRepository.ts`, `src/repositories/staffRepository.ts`, `src/repositories/availabilityRepository.ts`, and `src/lib/availability/schedule.ts`.
What would break if it were wrong: the calendar could show open slots that cannot actually be booked or could expose a staff profile that does not exist.
What a junior engineer would likely miswrite here: generating availability from the UI rather than from working hours plus blocked windows.

## `src/lib/auth/with-auth.ts`
What it does: resolves the current actor and rejects anonymous requests.
What calls it: protected route handlers under `src/app/api/*`.
What it calls: `src/services/authService.ts` and `src/lib/http.ts`.
What would break if it were wrong: protected API endpoints would become callable without a valid session.
What a junior engineer would likely miswrite here: returning `null` and letting the handler decide later instead of failing immediately.

## `src/lib/auth/with-role.ts`
What it does: enforces role-based access for admin routes.
What calls it: admin API route handlers.
What it calls: `src/lib/auth/permissions.ts`, `src/lib/auth/with-auth.ts`, and `src/lib/http.ts`.
What would break if it were wrong: a client or staff user could create staff profiles, working hours, or time-off blocks.
What a junior engineer would likely miswrite here: checking role in the UI and forgetting the API.

## `src/lib/data/appointmentScopes.ts`
What it does: builds owner-aware Prisma filters for appointment queries.
What calls it: `src/repositories/appointmentRepository.ts`.
What it calls: nothing.
What would break if it were wrong: one bad query path could return another user’s appointment list.
What a junior engineer would likely miswrite here: putting the owner filter inline in a single repository method and forgetting another method.

## `src/repositories/appointmentRepository.ts`
What it does: performs the actual appointment reads and writes.
What calls it: `src/services/appointmentService.ts`.
What it calls: `src/lib/db.ts` and `src/lib/data/appointmentScopes.ts`.
What would break if it were wrong: secrets could leak in includes, and overlap detection could miss conflicting bookings.
What a junior engineer would likely miswrite here: using `findMany()` with no overlap predicate or selecting entire related user records.

## `src/lib/availability/schedule.ts`
What it does: calculates open and blocked slots from rules and ranges.
What calls it: `src/services/availabilityService.ts` and `src/services/appointmentService.ts`.
What it calls: nothing.
What would break if it were wrong: the UI would show a calendar that disagrees with what the booking service accepts.
What a junior engineer would likely miswrite here: hard-coding a time grid in the component instead of deriving it from the staff’s rules.

## `src/app/api/admin/staff/route.ts`
What it does: exposes the admin-only staff creation endpoint.
What calls it: `src/hooks/useStaff.ts` and `src/components/BookingDashboard.tsx`.
What it calls: `src/lib/auth/with-role.ts`, `src/lib/validation/appointmentSchemas.ts`, and `src/services/availabilityService.ts`.
What would break if it were wrong: the application would create staff records without permission checks or validation.
What a junior engineer would likely miswrite here: creating the user row in the route instead of delegating to the service.
Current gap: `createStaffMember()` writes the user and then the staff profile without a transaction (`src/services/availabilityService.ts:41-63`), and detects duplicate emails by matching error message text (lines 50-52).

## Load-bearing lines (quick index)

| File | Line(s) | Why |
|---|---|---|
| `src/lib/availability/schedule.ts` | 81-86 | Cross-date endpoints allowed only at the exact closing midnight |
| `src/lib/availability/schedule.ts` | 88 | Folded local clocks rejected |
| `src/lib/data/appointmentScopes.ts` | 13-16 | Impossible staff id instead of an unscoped query |
| `src/repositories/appointmentRepository.ts` | 155 | Conditional cancel: id + scope + `BOOKED` |
| `src/services/appointmentService.ts` | 72-75 | Only the named exclusion violation becomes "slot taken" |

**Exercise — Goal:** predict a regression. **Check:** if line 155 dropped `status: "BOOKED"`, describe what a second concurrent cancel
would do (overwrite the first reason and timestamp).
