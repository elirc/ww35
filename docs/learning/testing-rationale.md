# Testing Rationale

## `tests/auth-permissions.test.ts`
This test matters because it verifies an actual protected-path response, not just a helper function. If the role guard stopped returning 403 here, a client user could start calling admin endpoints and the bug might not be noticed until data was already mutated.

What the test covers:

- `withRole(["ADMIN"], ...)` rejects a client actor.
- The response status is `403`.
- The error body includes `FORBIDDEN`.

What a more thorough suite would add:

- One test for `withAuth()` returning `401` when the session is missing.
- One integration test that hits a real route handler with a mocked session cookie.

## `tests/validation-boundary.test.ts`
This test matters because it protects the request boundary before the service or repository ever sees malformed scheduling data. If the schema accepted `endMinute <= startMinute`, the application could persist nonsense rules and every downstream availability computation would be wrong.

What the test covers:

- `createWorkingHoursRuleSchema.safeParse()` rejects an invalid range.
- The failure message matches the schema refinement.

What a more thorough suite would add:

- An invalid datetime input test for the booking and time-off schemas.
- A route-level test proving invalid JSON returns the structured 400 response.

## `tests/appointment-transition.test.ts`
This test matters because state transitions are where hidden production bugs usually show up. Canceling an already canceled appointment should never silently succeed, or the UI and database will disagree about what happened.

What the test covers:

- `cancelAppointment()` rejects a record already in `CANCELLED`.
- The error is `InvalidTransitionAppError`.

What a more thorough suite would add:

- A test that a non-owner client cannot cancel another user’s appointment.
- A test that a staff actor can cancel only within their own staff profile scope.

## `tests/data-isolation.test.ts`
This test matters because a bad query scope is a direct data leak. If the appointment list filter ever broadened accidentally, one user could see another user’s booking history without any obvious error.

What the test covers:

- `buildAppointmentListWhere()` scopes a client actor to `clientId`.

What a more thorough suite would add:

- A repository-level integration test against a real Prisma client and a temporary PostgreSQL database.
- A staff scoping test showing the `staffProfileId` filter is always present.

## Tests added with the calendar and cancellation work

- `tests/calendar-boundaries.test.ts` — six pure-function cases (lines 7, 11, 16, 21, 30, 35): overnight wrap, exact midnight with
  `endMinute` 1440, a DST date boundary, half-open adjacency, malformed inputs, and preview/booking agreement.
- `tests/appointment-boundaries.test.ts` — five service cases (13, 17, 21, 24, 32) with mocked repositories.
- `tests/appointment-repository.test.ts` — the real repository `where` clauses against a mocked Prisma client (10, 11); line 11
  covers the staff/client scoping suggested above for detail reads.
- `tests/route-boundaries.test.ts` — the real cancel route: awaited params, 400 before the service, 401 without a session.

## Still missing

| Test | Would expose | Location |
|---|---|---|
| Cancel a finished appointment | Allowed today | `src/services/appointmentService.ts:81-108` |
| Profile creation fails after user creation | Orphan STAFF user | `src/services/availabilityService.ts:41-63` |
| Live overlapping inserts against the real migration | Proves the exclusion constraint | `prisma/migrations/0001_initial/migration.sql` |

**Exercise — Goal:** write the first one. **Check:** mock a scoped appointment with `startsAt` in the past and `status: "BOOKED"`;
assert today's behaviour (success) and write the assertion you would want instead.
