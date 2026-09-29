import { bookAppointmentCommandSchema, cancelAppointmentSchema } from "@/lib/validation/appointmentSchemas";
import { isAppointmentExclusionViolation } from "@/lib/data/appointmentErrors";
// Appointment workflow service.
// What calls this file: appointment route handlers and cancellation actions.
// What it calls: appointment, staff, and availability repositories plus the shared slot calculator.
// Junior pitfall: checking for conflicts only after the insert and assuming the database will never race.

import { ConflictAppError, InvalidTransitionAppError, NotFoundAppError, ValidationAppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/permissions";
import { findConflictingAppointment, findScopedAppointmentById, listAppointmentsForActor, createAppointment, cancelAppointment as cancelAppointmentRecord } from "@/repositories/appointmentRepository";
import { findStaffProfileById } from "@/repositories/staffRepository";
import { canBookSlot } from "@/services/availabilityService";
import type { RequestActor } from "@/types/domain";

export async function listAppointments(actor: RequestActor) {
  return listAppointmentsForActor(actor);
}

export async function bookAppointment(
  actor: RequestActor,
  input: {
    staffProfileId: string;
    startsAt: Date;
  },
) {
  requireRole(actor, ["CLIENT"]);

  const parsed = bookAppointmentCommandSchema.safeParse(input);
  if (!parsed.success) throw new ValidationAppError("A staff ID and valid start timestamp are required.");
  input = parsed.data;
  const staff = await findStaffProfileById(input.staffProfileId);
  if (!staff) {
    throw new NotFoundAppError("Staff profile not found");
  }

  if (!Number.isSafeInteger(staff.appointmentDurationMinutes) || staff.appointmentDurationMinutes <= 0 || staff.appointmentDurationMinutes > 1440)
    throw new ValidationAppError("The staff appointment duration is invalid.");
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + staff.appointmentDurationMinutes * 60 * 1000);

  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
    throw new ValidationAppError("The requested start time is invalid");
  }

  if (startsAt.getTime() <= Date.now()) {
    throw new ValidationAppError("Appointments must be booked in the future");
  }

  const isOpen = await canBookSlot(actor, staff.id, startsAt, endsAt);
  if (!isOpen) {
    throw new ConflictAppError("That slot is not available");
  }

  const conflict = await findConflictingAppointment({
    staffProfileId: staff.id,
    startsAt,
    endsAt,
  });

  if (conflict) {
    throw new ConflictAppError("That slot was just taken");
  }

  // SENIOR NOTE: the database exclusion constraint is the last line of defense against concurrent double-booking.
  try {
    return await createAppointment({
      staffProfileId: staff.id,
      clientId: actor.userId,
      startsAt,
      endsAt,
    });
  } catch (error) {
    if (isAppointmentExclusionViolation(error)) {
      throw new ConflictAppError("That slot was just taken");
    }

    throw error;
  }
}

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

export async function getAppointment(actor: RequestActor, appointmentId: string) {
  const appointment = await findScopedAppointmentById(actor, appointmentId);
  if (!appointment) {
    throw new NotFoundAppError("Appointment not found");
  }

  return appointment;
}
