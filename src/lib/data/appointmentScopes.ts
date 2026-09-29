// Query scopes that keep appointment reads and writes owner-aware.
// What calls this file: appointmentRepository and appointmentService.
// What it calls: nothing; it only builds Prisma where objects.
// Junior pitfall: moving the owner filter into a caller and forgetting it on one code path.

import type { RequestActor } from "@/types/domain";

export function buildAppointmentListWhere(actor: RequestActor) {
  if (actor.role === "ADMIN") {
    return {};
  }

  if (actor.role === "STAFF") {
    // SENIOR NOTE: if staffProfileId is missing, this query must not broaden access; keep it impossible to match.
    return { staffProfileId: actor.staffProfileId ?? "__missing_staff_profile__" };
  }

  return { clientId: actor.userId };
}

export function buildAppointmentAccessWhere(actor: RequestActor, appointmentId: string) {
  return {
    id: appointmentId,
    ...buildAppointmentListWhere(actor),
  };
}

export function buildStaffAvailabilityWhere(actor: RequestActor, staffProfileId: string) {
  if (actor.role === "ADMIN") {
    return { id: staffProfileId };
  }

  if (actor.role === "STAFF") {
    return {
      id: staffProfileId,
      userId: actor.userId,
    };
  }

  return { id: staffProfileId };
}
