# Follow a cancellation loser through the real service

Start with a client actor and a booking that belongs to that client. Supply a valid cancellation reason with surrounding whitespace. The service validates the command and stores the parsed, trimmed reason. It then asks findScopedAppointmentById for the booking using the actor and ID, rather than loading an unrestricted record.

Assume the scoped result is BOOKED. Before the service writes, imagine a second authorized request successfully cancels the same row. The first request still holds its earlier snapshot. Its repository call sends the actor scope and BOOKED status with the ID to updateMany. Because the current row is now CANCELLED, the database reports count zero.

The repository returns null immediately. It does not issue another update, change cancelledAt, replace the winning reason or query an unrestricted row for a response. The service translates the null to ConflictAppError. The caller can refresh the appointment to see its current state, but the failed command has not created another cancellation event.

Now trace the successful path in isolation. updateMany affects one row. The repository performs findScopedAppointmentById again and returns the current included staff and client fields. The service returns that result without fabricating a DTO from stale pre-write values. In the test, the returned cancellation status and normalized reason come from the mocked persistence result.

Finish with a foreign client. The first scoped lookup returns null, so the flow ends with not found before status inspection or mutation. Compare that with an assigned staff actor and an administrator by inspecting their repository where objects. The exercise demonstrates why role permission, resource scope, lifecycle status and conditional mutation are separate checks that all belong in the completed path.

## Source excerpt

From [tests/appointment-repository.test.ts](../tests/appointment-repository.test.ts).

```ts
it.each([[{...base}, {clientId:"client"}],[{...base,role:"STAFF",staffProfileId:"staff"},{staffProfileId:"staff"}],[{...base,role:"STAFF"},{staffProfileId:"__missing_staff_profile__"}],[{...base,role:"ADMIN"},{}]] as const)("conditional cancellation and returned read retain actor scope %#",async(actor,scope)=>{
 await cancelAppointment(actor,{appointmentId:"booking",cancellationReason:"reason"});expect(db.updateMany).toHaveBeenCalledWith({where:{id:"booking",...scope,status:"BOOKED"},data:{status:"CANCELLED",cancellationReason:"reason",cancelledAt:expect.any(Date)}});expect(db.findFirst.mock.calls[0][0].where).toEqual({id:"booking",...scope});
});
it("a losing cancellation has no follow-up read and does not overwrite timestamps",async()=>{db.updateMany.mockResolvedValue({count:0});expect(await cancelAppointment(base,{appointmentId:"booking"})).toBeNull();expect(db.findFirst).not.toHaveBeenCalled();expect(db.updateMany).toHaveBeenCalledTimes(1);});
it("direct detail reads require the same actor scope",async()=>{await findScopedAppointmentById(base,"foreign");expect(db.findFirst.mock.calls[0][0].where).toEqual({id:"foreign",clientId:"client"});});
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
