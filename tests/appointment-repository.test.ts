import { beforeEach, expect, it, vi } from "vitest";
import type { RequestActor } from "@/types/domain";
const db=vi.hoisted(()=>({updateMany:vi.fn(),findFirst:vi.fn()}));vi.mock("@/lib/db",()=>({prisma:{appointment:db}}));
import { cancelAppointment, findScopedAppointmentById } from "@/repositories/appointmentRepository";
const base:RequestActor={role:"CLIENT",userId:"client",staffProfileId:null,sessionId:"s",email:"client@test.com",name:"Client"};
beforeEach(()=>{vi.resetAllMocks();db.updateMany.mockResolvedValue({count:1});db.findFirst.mockResolvedValue({id:"booking",status:"CANCELLED"});});
it.each([[{...base}, {clientId:"client"}],[{...base,role:"STAFF",staffProfileId:"staff"},{staffProfileId:"staff"}],[{...base,role:"STAFF"},{staffProfileId:"__missing_staff_profile__"}],[{...base,role:"ADMIN"},{}]] as const)("conditional cancellation and returned read retain actor scope %#",async(actor,scope)=>{
 await cancelAppointment(actor,{appointmentId:"booking",cancellationReason:"reason"});expect(db.updateMany).toHaveBeenCalledWith({where:{id:"booking",...scope,status:"BOOKED"},data:{status:"CANCELLED",cancellationReason:"reason",cancelledAt:expect.any(Date)}});expect(db.findFirst.mock.calls[0][0].where).toEqual({id:"booking",...scope});
});
it("a losing cancellation has no follow-up read and does not overwrite timestamps",async()=>{db.updateMany.mockResolvedValue({count:0});expect(await cancelAppointment(base,{appointmentId:"booking"})).toBeNull();expect(db.findFirst).not.toHaveBeenCalled();expect(db.updateMany).toHaveBeenCalledTimes(1);});
it("direct detail reads require the same actor scope",async()=>{await findScopedAppointmentById(base,"foreign");expect(db.findFirst.mock.calls[0][0].where).toEqual({id:"foreign",clientId:"client"});});
