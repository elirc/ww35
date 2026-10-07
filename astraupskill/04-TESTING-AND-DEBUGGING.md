# Separate calendar evidence from persistence evidence

The calendar-boundaries suite calls the actual pure scheduling functions. It includes overnight intervals that previously appeared valid, exact midnight endpoints, invalid timezone and rule data, reversed ranges, zero and nonfinite steps, adjacent appointments and a daylight-saving local-date boundary. It also compares each generated preview slot with isSlotOpen to ensure the preview and booking predicate agree.

The appointment-boundaries suite injects repository and availability dependencies using Vitest module mocks. It invokes the actual service and verifies normalization, direct-call validation before reads, bad stored duration, scoped lookup, successful booking and cancellation, and a conditional-write conflict. The provider-error test creates a real PrismaClientKnownRequestError instance with P2004 metadata naming the exclusion constraint. Ordinary errors containing the word conflict must remain ordinary failures.

The appointment-repository suite mocks only the Prisma client. The production repository functions build their real where and data objects. These assertions inspect the actor predicate, BOOKED requirement, expected response scope and the absence of a follow-up read after count zero. This is stronger than testing a separate hand-written query helper that the repository might never call.

The route-boundaries suite invokes the actual cancellation POST handler. It verifies that Next route parameters are awaited, the resolved appointment ID reaches the service, malformed fields return 400, and a missing actor returns 401 before mutation. The shared wrappers accept Promise-based route parameters while passing resolved values to inner handlers.

Existing permission, schema and isolation tests remain in the full suite. The original terminal cancellation test now supplies its canceled record through the scoped lookup mock, matching the production service's corrected path. Its assertion remains a terminal-state rejection.

When debugging, first identify which boundary failed. A malformed Date belongs to validation, a false isOpen may be a valid business result, and a Prisma query shape failure belongs to persistence scope. Inspect the accepted command log and runner total in VERIFICATION. Mocked tests prove orchestration and predicates; they are not evidence that the migration was applied or that PostgreSQL rejected two simultaneous inserts in this environment.

## Test inventory (by `it(` location)

| File | Lines | Focus |
|---|---|---|
| `tests/calendar-boundaries.test.ts` | 7, 11, 16, 21, 30, 35 | overnight wrap, exact midnight, DST date boundary, half-open overlap, malformed inputs, preview/booking agreement |
| `tests/appointment-boundaries.test.ts` | 13, 17, 21, 24, 32 | scoped read first, normalized reason, stale write -> conflict, direct validation, exclusion-error translation |
| `tests/appointment-repository.test.ts` | 10, 11 | loser has no follow-up read; detail read is scoped |
| `tests/route-boundaries.test.ts` | 10, 11 | params awaited; 400 before service; 401 without session |
| `tests/appointment-transition.test.ts` | 33 | already-cancelled rejection |
| `tests/auth-permissions.test.ts` | 25 | client on admin route -> 403 |
| `tests/data-isolation.test.ts` | 6 | client query scope |
| `tests/validation-boundary.test.ts` | 5 | working-hours end before start |

The recorded run counts 33 tests; some `it` blocks may expand, so the table lists locations.

## Gaps

- No test for `createStaffMember` partial failure (user created, staff profile fails; `availabilityService.ts:41-63` is not
  transactional).
- No test for the message-based unique detection at `availabilityService.ts:50-52`.
- No live PostgreSQL test of the exclusion constraint.

**Exercise — Goal:** write a gap test. **Check:** mock `createStaffProfile` to throw after `createUser` succeeds and assert that a
STAFF user now exists without a profile — then decide where a transaction belongs.

## Source excerpt

From [tests/calendar-boundaries.test.ts](../tests/calendar-boundaries.test.ts).

```ts
 it("uses local date boundaries on a DST transition day",()=>{
  expect(isSlotOpen(slot("2026-03-09T03:30Z","2026-03-09T04:00Z"),calendar("America/New_York",0,1440))).toBe(true);
  expect(isSlotOpen(slot("2026-03-09T03:30Z","2026-03-09T04:30Z"),calendar("America/New_York",0,1440))).toBe(false);
  expect(isSlotOpen(slot("2026-11-01T05:45Z","2026-11-01T06:15Z"),calendar("America/New_York",0,1440))).toBe(false);
 });
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
