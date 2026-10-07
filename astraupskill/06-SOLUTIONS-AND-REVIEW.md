# Use the date and the write predicate as proof points

The overnight example fails because its local start and end dates differ and the endpoint is not the exact closing midnight of the starting day. A midnight endpoint can be represented as minute 1440 only after checking the immediately preceding instant belongs to the start date. Extending the endpoint even slightly moves it beyond that permitted boundary. Seconds and milliseconds therefore matter in the comparison.

On a spring transition day in New York, the UTC offset changes during the local date. Convert the actual endpoint through the timezone formatter rather than assuming the day has exactly twenty-four elapsed hours. The implementation reasons from formatted local date keys and instants. The regression test demonstrates the selected date-boundary cases; it is not an exhaustive certification of every timezone or historical transition.

For overlap, equality at an edge is allowed because the predicate uses strict less-than and greater-than comparisons. The SQL migration encodes the same half-open range. A cancellation changes the row out of BOOKED, which removes it from the exclusion constraint's predicate without deleting its historical timestamps or reason.

For a stale cancellation, count zero is decisive. There is no successful mutation to return, so the service raises a conflict. Repeating the write by ID alone would undo the protection and recreate the original race. A missing actor-scoped row instead produces not found before status inspection, avoiding a cross-user lifecycle disclosure.

Provider error translation requires both the Prisma error type and the specific known constraint metadata. Arbitrary prose is not a stable domain contract. Unknown failures should reach the existing generic error response rather than being misreported as a booking conflict.

Reviewers should inspect the actual repository call, the service's scoped lookup, the formatter options and the SQL migration together. These pieces implement different parts of the contract. Preserving one while bypassing another can still produce an inconsistent calendar or an unauthorized state change.

## Solutions to the additional exercises

6. The grid starts at the caller's `from` (line 119) and steps by the appointment duration (`availabilityService.ts:130`),
   so different `from` values produce different grids.
7. `createUser` (line 43) then `createStaffProfile` (58). If the second fails, a `STAFF` user with no profile remains; there
   is no transaction.
8. A reasonable rule is "only before `startsAt`" for clients; enforce it in `cancelAppointment` after the scoped read
   (around line 98), or put `startsAt: { gt: now }` into the conditional `updateMany` so it is race-safe.

## Senior-review findings outside the completed change

1. **Bookings are not grid-aligned** — `bookAppointment` (19-79) accepts any future start that fits; preview slots are anchored
   to the caller's `from` (`schedule.ts:119`). Odd starts fragment a staff calendar.
2. **Past appointments can be cancelled** — no time check in `cancelAppointment` or the `updateMany` predicate.
3. **Staff creation is not atomic** — `availabilityService.ts:41-63`.
4. **Unique detection by message text** — `availabilityService.ts:50-52` matches `"unique"` or `User_email_key` in the message,
   the same fragility the appointment path avoids with typed metadata.
5. **Single "blocked" reason** — `schedule.ts:136`; the UI cannot tell "outside hours" from "already booked".
6. **Overlapping working-hours rules are accepted** — `createWorkingHours` (`availabilityService.ts:68-86`) does not check for
   duplicates; harmless for `some()` matching, but it hides configuration mistakes.

## Source excerpt

From [src/lib/data/appointmentErrors.ts](../src/lib/data/appointmentErrors.ts).

```ts
const constraint = "Appointment_staffProfileId_time_window_excl";
export function isAppointmentExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2004") return false;
  const detail = error.meta?.database_error;
  // Prisma wraps PostgreSQL exclusion errors in P2004. Match the named constraint,
  // never arbitrary prose containing the word conflict or another integrity failure.
  return typeof detail === "string" && detail.includes(constraint) &&
    (detail.includes("23P01") || detail.includes("exclusion constraint"));
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
