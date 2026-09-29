# Instants, local days and half-open intervals

An appointment is stored as two increasing instants. Working hours are local calendar rules: weekday plus start and end minute in a named timezone. Translating an instant to a local clock loses information unless the local date is retained too. The dateKey in getZonedParts prevents a next-day endpoint from being compared as if it belonged to the starting day.

The policy treats ordinary working-hour rules as single-day windows. An appointment may end exactly at the following local midnight if the rule ends at minute 1440. The algorithm checks the instant immediately before the endpoint to prove that this midnight actually closes the starting local day. Any other cross-date interval is closed. Seconds and milliseconds are included in minute comparisons, so a meeting ending just beyond the boundary cannot slip through a truncation.

The formatter uses hourCycle h23 without the conflicting hour12 option. Midnight is therefore represented as 00 rather than 24 in labels and arithmetic. A DST boundary changes the relationship between local clock time and UTC, which is why the tests include a spring-transition local midnight and a folded clock interval. Intervals whose local end clock is not later than the start are rejected by this policy.

Overlap uses half-open semantics: a meeting ending at 10:00 may sit immediately before one starting at 10:00. Positive overlap is blocked. The existing SQL exclusion constraint uses the same interval convention for BOOKED rows; canceled rows do not occupy the calendar.

Validation is separate from availability. An increasing, well-formed interval can legitimately be unavailable. A zero step or invalid timestamp is malformed and should fail promptly, never produce an infinite loop or an apparently valid empty preview. Keeping those outcomes distinct makes both API behavior and tests easier to interpret.

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
