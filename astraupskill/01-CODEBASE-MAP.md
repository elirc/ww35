# Trace preview, booking and cancellation

availabilityService.ts assembles working-hour rules, time-off blocks and booked appointments for a staff member. It delegates to buildAvailabilitySlots in src/lib/availability/schedule.ts. The returned slot DTO contains ISO start and end timestamps, isOpen and an optional blocked reason. Direct booking validation calls isSlotOpen from the same module, so preview and command paths share the local-day and overlap policy.

appointmentService.ts coordinates the lifecycle. bookAppointment requires the client role, parses the direct command, loads the staff profile and validates its stored duration before constructing the interval. It checks availability and conflicts, then creates the appointment. Only a recognized Prisma integrity error naming the existing exclusion constraint is translated into a slot conflict. Unrelated errors propagate to the generic route error boundary.

cancelAppointment parses its fields and obtains the appointment through findScopedAppointmentById. appointmentScopes.ts defines the existing role predicates: a client is scoped by clientId, staff by staffProfileId and an administrator can access all appointments. Missing staff profile identity produces an impossible staff scope rather than a broad query. The cancellation repository applies that same scope with BOOKED status to updateMany, then performs a scoped read for the response.

The validation module contains both the HTTP string schema and a Date-based command schema for direct service callers. The distinction matters because routes turn an accepted timestamp string into a Date before calling the service. TypeScript annotations alone cannot prevent an invalid Date or malformed runtime object from reaching that method.

Finally, inspect prisma/migrations/0001_initial/migration.sql. Its btree_gist extension and exclusion constraint encode overlap protection beyond the Prisma model. Applying db push is not equivalent to running this hand-written migration. Keep the SQL file with the schema when preparing a development database, and do not infer migration execution from passing mocked tests.

## Line-level map

| Concern | Location |
|---|---|
| Book | `src/services/appointmentService.ts:19-79` — client role (26), parse (28-30), staff lookup (31-34), stored duration check (36-37), interval (38-43), future-only (45-47), `canBookSlot` (49-52), conflict read (54-62), create with exclusion translation (65-78) |
| Cancel | `appointmentService.ts:81-108` — role (88), parse (89-91), scoped read (92-96), terminal check (98-100), conditional write (102-106) |
| Scope predicates | `src/lib/data/appointmentScopes.ts:8-19` — ADMIN `{}`, STAFF `staffProfileId` (or an impossible id), CLIENT `clientId` |
| Conditional cancel | `src/repositories/appointmentRepository.ts:150-160` — `updateMany` on id + scope + `status: "BOOKED"`; `count !== 1` returns `null` |
| Local-day check | `src/lib/availability/schedule.ts:71-97` |
| Preview grid | `schedule.ts:112-143`, called by `src/services/availabilityService.ts:107-147` |
| Session cookie | `src/lib/auth/session.ts:8-27` — `appointment_session`, SHA-256 hashed 32-byte token, 7 days |
| Auth wrapper | `src/lib/auth/with-auth.ts:18-33` — awaits Promise params, 401 without an actor |

**Exercise — Goal:** find the one unscoped read. **Check:** locate `findAppointmentById` (`appointmentRepository.ts:10-32`) and confirm by
search that no service calls it any more — the cancellation path uses `findScopedAppointmentById` (line 92).

## Source excerpt

From [src/repositories/appointmentRepository.ts](../src/repositories/appointmentRepository.ts).

```ts
export async function cancelAppointment(actor: RequestActor, input: {
  appointmentId: string;
  cancellationReason?: string | null;
}) {
  const result = await prisma.appointment.updateMany({
    where: { id: input.appointmentId, ...buildAppointmentListWhere(actor), status: "BOOKED" },
    data: { status: "CANCELLED", cancellationReason: input.cancellationReason ?? null, cancelledAt: new Date() },
  });
  if (result.count !== 1) return null;
  return findScopedAppointmentById(actor, input.appointmentId);
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
