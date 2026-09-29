# Scope first, then condition the cancellation write

Consider two callers trying to cancel the same appointment. A service can read BOOKED twice before either write finishes. If the repository updates only by ID, both requests succeed and the second replaces the first cancellation reason and timestamp. A prior status check is useful for feedback but is not a concurrency condition on the write.

The repository now uses updateMany with the appointment ID, the actor's access predicate and status BOOKED in one where object. The database decides whether the row still matches when it performs the update. The winning call changes status, reason and cancelledAt. A losing call receives count zero and returns null without performing a fallback update or response read.

The service converts that null into ConflictAppError. A booking already observed as canceled produces the existing InvalidTransitionAppError. Both are 409 outcomes, but they describe different moments: one was terminal at the scoped read, while the other changed between read and write. Neither path changes history again.

Access is also checked in the correct order. The first lookup is findScopedAppointmentById, so a foreign client receives not found without learning whether the appointment was canceled. The conditional update repeats the scope in case access-related data changes after the read. The final response read also retains the same actor predicate.

The tests inspect these real repository arguments for client, assigned staff, missing staff profile and administrator. Service tests separately prove that unrestricted lookup is never called, reasons are normalized, the response comes from the successful repository operation, and a stale loser makes only one write attempt. This combination verifies the actual boundary wiring while remaining honest that no live database race was executed.

## Source excerpt

From [src/services/appointmentService.ts](../src/services/appointmentService.ts).

```ts
export async function cancelAppointment(
  actor: RequestActor,
  appointmentId: string,
  input: {
    cancellationReason?: string;
  },
) {
  requireRole(actor, ["CLIENT", "STAFF", "ADMIN"]);
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success || typeof appointmentId !== "string" || !appointmentId.trim()) throw new ValidationAppError("A booking ID and valid cancellation fields are required.");
  input = parsed.data;
  const appointment = await findScopedAppointmentById(actor, appointmentId);

  if (!appointment) {
    throw new NotFoundAppError("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new InvalidTransitionAppError("Cancelled appointments cannot be cancelled again");
  }

  const updated = await cancelAppointmentRecord(actor, {
    appointmentId,
    cancellationReason: input.cancellationReason,
  });
  if (!updated) throw new ConflictAppError("The appointment was already changed or is no longer accessible.");
  return updated;
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
