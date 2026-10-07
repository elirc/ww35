# Calendar boundaries and one-winner cancellation

This appointment application schedules clients with staff members using local working hours, time-off blocks and PostgreSQL-backed appointment records. The improvement focuses on two boundaries: deciding whether an interval belongs inside a local working day, and canceling an appointment without leaking another caller's state or overwriting an earlier cancellation.

The original working-hours check compared the start weekday and local clock minutes but did not compare the end date. A meeting beginning late at night and ending after midnight could appear to fit a daytime rule because the end minute wrapped back to a small number. The completed calculation checks both local dates, permits an exact next-midnight endpoint only for a rule ending at minute 1440, and rejects other cross-day windows. Invalid ranges, timezones and nonpositive slot steps fail before iteration.

Cancellation originally loaded an unrestricted ID, inspected terminal state and only afterward checked ownership. The completed service performs an actor-scoped read first. Its final write also carries actor scope and BOOKED status. If another request already canceled the row, the conditional write affects zero rows and becomes a conflict rather than replacing the saved reason or timestamp.

The existing initial SQL migration already includes a PostgreSQL half-open exclusion constraint for booked appointments. It is preserved, not presented as a new feature. That database guard is the final protection against concurrent overlapping inserts. Service checks improve feedback, but a read followed by an insert alone cannot establish that guarantee.

Read the map, inspect the local-date algorithm and attempt the exercises before checking the solutions. Tests cover pure calendar behavior, actual service orchestration with repository mocks and actual Prisma query construction with a mocked client. They do not claim that a live PostgreSQL migration or concurrency test ran for this project. VERIFICATION records the exact accepted checks and their scope.

## Where the change lives

- Local-day check: `src/lib/availability/schedule.ts:71-97` (before-state:
  `snapshots/src__lib__availability__schedule.ts.original.txt`).
- Scoped, conditional cancellation: `src/services/appointmentService.ts:81-108` and
  `src/repositories/appointmentRepository.ts:150-160`.
- Narrow exclusion-error translation: `src/lib/data/appointmentErrors.ts`, used at `appointmentService.ts:72-78`.

Each chapter now ends with Goal/Check exercises, and [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) lists review
findings the change did not address (grid alignment, past cancellations, non-atomic staff creation).

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
