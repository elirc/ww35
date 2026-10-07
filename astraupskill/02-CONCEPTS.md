# Instants, local days and half-open intervals

An appointment is stored as two increasing instants. Working hours are local calendar rules: weekday plus start and end minute in a named timezone. Translating an instant to a local clock loses information unless the local date is retained too. The dateKey in getZonedParts prevents a next-day endpoint from being compared as if it belonged to the starting day.

The policy treats ordinary working-hour rules as single-day windows. An appointment may end exactly at the following local midnight if the rule ends at minute 1440. The algorithm checks the instant immediately before the endpoint to prove that this midnight actually closes the starting local day. Any other cross-date interval is closed. Seconds and milliseconds are included in minute comparisons, so a meeting ending just beyond the boundary cannot slip through a truncation.

The formatter uses hourCycle h23 without the conflicting hour12 option. Midnight is therefore represented as 00 rather than 24 in labels and arithmetic. A DST boundary changes the relationship between local clock time and UTC, which is why the tests include a spring-transition local midnight and a folded clock interval. Intervals whose local end clock is not later than the start are rejected by this policy.

Overlap uses half-open semantics: a meeting ending at 10:00 may sit immediately before one starting at 10:00. Positive overlap is blocked. The existing SQL exclusion constraint uses the same interval convention for BOOKED rows; canceled rows do not occupy the calendar.

Validation is separate from availability. An increasing, well-formed interval can legitimately be unavailable. A zero step or invalid timestamp is malformed and should fail promptly, never produce an infinite loop or an apparently valid empty preview. Keeping those outcomes distinct makes both API behavior and tests easier to interpret.

## The algorithm, line by line (`src/lib/availability/schedule.ts:71-97`)

1. Lines 76-77 format both endpoints in the staff timezone (`getZonedParts`, 29-50, with `hourCycle: "h23"`).
2. Lines 79-80 compute local minutes including seconds and milliseconds.
3. Lines 81-86: if the local dates differ, the end is accepted only if it is exactly local midnight **and** the instant one
   millisecond earlier is still on the start date; then `localEnd` becomes 1440.
4. Line 88 rejects intervals whose local end is not after the local start (folded clocks).
5. Lines 90-96: some active rule for the start weekday must contain `[localStart, localEnd]`.

## What the grid does and does not promise

`buildAvailabilitySlots` (112-143) steps from the caller's `from` instant in increments of the staff's appointment
duration (`availabilityService.ts:130`). The grid is therefore anchored to whatever `from` the client sends, not to the
start of working hours. `bookAppointment` does not require the requested start to be on that grid: any future start whose
whole interval fits working hours and is free can be booked. And every closed slot gets `reason: "blocked"` (line 136),
whether it is outside working hours, in time off, or already booked.

**Exercise — Goal:** test the anchor. **Check:** with a 9:00-17:00 rule and 60-minute appointments, request availability from
09:30 local; state the first slot (09:30-10:30) and whether a direct booking at 09:15 is accepted (yes, if free).

## Source excerpt

From [src/lib/availability/schedule.ts](../src/lib/availability/schedule.ts).

```ts
function isWithinWorkingHours(
  slot: TimeWindow,
  timeZone: string,
  workingHoursRules: WorkingHoursRuleLike[],
) {
  const start = getZonedParts(slot.startsAt, timeZone);
  const end = getZonedParts(slot.endsAt, timeZone);
  const localDayIndex = DAY_NAMES.indexOf(start.weekday);
  const localStart = start.hour * 60 + start.minute + slot.startsAt.getUTCSeconds() / 60 + slot.startsAt.getUTCMilliseconds() / 60_000;
  let localEnd = end.hour * 60 + end.minute + slot.endsAt.getUTCSeconds() / 60 + slot.endsAt.getUTCMilliseconds() / 60_000;
  if (start.dateKey !== end.dateKey) {
    // A midnight endpoint belongs to the preceding day only when it ends that day exactly.
    const preceding = getZonedParts(new Date(slot.endsAt.getTime() - 1), timeZone);
    if (localEnd !== 0 || preceding.dateKey !== start.dateKey) return false;
    localEnd = 1440;
  }
  // An interval that travels backward on a folded local clock is not offered by this policy.
  if (localEnd <= localStart) return false;

  return workingHoursRules.some((rule) => {
    if (!rule.active || rule.dayOfWeek !== localDayIndex) {
      return false;
    }

    return localStart >= rule.startMinute && localEnd <= rule.endMinute;
  });
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
