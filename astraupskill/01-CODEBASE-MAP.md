# Trace preview, booking and cancellation

availabilityService.ts assembles working-hour rules, time-off blocks and booked appointments for a staff member. It delegates to buildAvailabilitySlots in src/lib/availability/schedule.ts. The returned slot DTO contains ISO start and end timestamps, isOpen and an optional blocked reason. Direct booking validation calls isSlotOpen from the same module, so preview and command paths share the local-day and overlap policy.

appointmentService.ts coordinates the lifecycle. bookAppointment requires the client role, parses the direct command, loads the staff profile and validates its stored duration before constructing the interval. It checks availability and conflicts, then creates the appointment. Only a recognized Prisma integrity error naming the existing exclusion constraint is translated into a slot conflict. Unrelated errors propagate to the generic route error boundary.

cancelAppointment parses its fields and obtains the appointment through findScopedAppointmentById. appointmentScopes.ts defines the existing role predicates: a client is scoped by clientId, staff by staffProfileId and an administrator can access all appointments. Missing staff profile identity produces an impossible staff scope rather than a broad query. The cancellation repository applies that same scope with BOOKED status to updateMany, then performs a scoped read for the response.

The validation module contains both the HTTP string schema and a Date-based command schema for direct service callers. The distinction matters because routes turn an accepted timestamp string into a Date before calling the service. TypeScript annotations alone cannot prevent an invalid Date or malformed runtime object from reaching that method.

Finally, inspect prisma/migrations/0001_initial/migration.sql. Its btree_gist extension and exclusion constraint encode overlap protection beyond the Prisma model. Applying db push is not equivalent to running this hand-written migration. Keep the SQL file with the schema when preparing a development database, and do not infer migration execution from passing mocked tests.

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
