import { beforeEach, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ConflictAppError, NotFoundAppError, ValidationAppError } from "@/lib/errors";
import type { RequestActor } from "@/types/domain";
const mocks=vi.hoisted(()=>({scoped:vi.fn(),unscoped:vi.fn(),cancel:vi.fn(),create:vi.fn(),conflict:vi.fn(),staff:vi.fn(),open:vi.fn()}));
vi.mock("@/repositories/appointmentRepository",()=>({findScopedAppointmentById:mocks.scoped,findAppointmentById:mocks.unscoped,cancelAppointment:mocks.cancel,createAppointment:mocks.create,findConflictingAppointment:mocks.conflict,listAppointmentsForActor:vi.fn()}));
vi.mock("@/repositories/staffRepository",()=>({findStaffProfileById:mocks.staff}));
vi.mock("@/services/availabilityService",()=>({canBookSlot:mocks.open}));
import { cancelAppointment, bookAppointment } from "@/services/appointmentService";
const actor:RequestActor={userId:"client",role:"CLIENT",staffProfileId:null,sessionId:"s",email:"client@test.com",name:"Client"};
const booking={id:"booking",clientId:"client",staffProfileId:"staff",status:"BOOKED"};
beforeEach(()=>{vi.resetAllMocks();mocks.scoped.mockResolvedValue(booking);mocks.cancel.mockResolvedValue({...booking,status:"CANCELLED",cancellationReason:"Plans changed"});mocks.staff.mockResolvedValue({id:"staff",appointmentDurationMinutes:30});mocks.open.mockResolvedValue(true);mocks.conflict.mockResolvedValue(null);mocks.create.mockResolvedValue(booking);});
it("reads within actor scope before inspecting lifecycle and never falls back to unrestricted ID",async()=>{
 mocks.scoped.mockResolvedValue(null);await expect(cancelAppointment(actor,"foreign",{})).rejects.toBeInstanceOf(NotFoundAppError);
 expect(mocks.scoped).toHaveBeenCalledWith(actor,"foreign");expect(mocks.unscoped).not.toHaveBeenCalled();expect(mocks.cancel).not.toHaveBeenCalled();
});
it("passes normalized reason and actor to conditional cancellation and returns its DTO",async()=>{
 const result=await cancelAppointment(actor,"booking",{cancellationReason:"  Plans changed  "});expect(result.status).toBe("CANCELLED");expect(result.cancellationReason).toBe("Plans changed");
 expect(mocks.cancel).toHaveBeenCalledWith(actor,{appointmentId:"booking",cancellationReason:"Plans changed"});
});
it("a stale conditional write becomes conflict without a retry or overwrite",async()=>{
 mocks.cancel.mockResolvedValue(null);await expect(cancelAppointment(actor,"booking",{})).rejects.toBeInstanceOf(ConflictAppError);expect(mocks.cancel).toHaveBeenCalledTimes(1);
});
it("validates direct calls before database reads",async()=>{
 await expect(cancelAppointment(actor,"booking",{cancellationReason:" "})).rejects.toBeInstanceOf(ValidationAppError);expect(mocks.scoped).not.toHaveBeenCalled();
 await expect(bookAppointment(actor,{staffProfileId:"",startsAt:new Date()})).rejects.toBeInstanceOf(ValidationAppError);
 await expect(bookAppointment(actor,{staffProfileId:"staff",startsAt:new Date("invalid")})).rejects.toBeInstanceOf(ValidationAppError);expect(mocks.staff).not.toHaveBeenCalled();
});
it.each([0,-1,Infinity,0.5])("rejects corrupt stored duration %s without checking/inserting a slot",async duration=>{
 mocks.staff.mockResolvedValue({id:"staff",appointmentDurationMinutes:duration});await expect(bookAppointment(actor,{staffProfileId:"staff",startsAt:new Date("2099-01-01T10:00Z")})).rejects.toBeInstanceOf(ValidationAppError);expect(mocks.open).not.toHaveBeenCalled();expect(mocks.create).not.toHaveBeenCalled();
});
it("books a valid interval and translates only the typed named exclusion failure",async()=>{
 const input={staffProfileId:"staff",startsAt:new Date("2099-01-01T10:00Z")};await bookAppointment(actor,input);expect(mocks.create).toHaveBeenCalledWith({...input,clientId:"client",endsAt:new Date("2099-01-01T10:30Z")});
 const excluded=new Prisma.PrismaClientKnownRequestError("constraint failed",{code:"P2004",clientVersion:"6",meta:{database_error:'23P01: exclusion constraint "Appointment_staffProfileId_time_window_excl"'}});mocks.create.mockRejectedValue(excluded);await expect(bookAppointment(actor,input)).rejects.toBeInstanceOf(ConflictAppError);
 for(const error of [new Error("network conflict"),new Prisma.PrismaClientKnownRequestError("different constraint",{code:"P2004",clientVersion:"6",meta:{database_error:"23P01: another exclusion constraint"}})]) {mocks.create.mockRejectedValue(error);await expect(bookAppointment(actor,input)).rejects.toBe(error);}
});
