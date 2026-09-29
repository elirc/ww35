// Appointment list and booking endpoint.
// What calls this file: the dashboard list and booking form.
// What it calls: withAuth plus the appointment service.
// Junior pitfall: accepting booking input and skipping the service layer that enforces the slot rules.

import { jsonResponse } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { readJsonBody } from "@/lib/http/request";
import { bookAppointmentSchema } from "@/lib/validation/appointmentSchemas";
import { bookAppointment, listAppointments } from "@/services/appointmentService";

export const GET = withAuth(async (_request, _context, actor) => {
  const appointments = await listAppointments(actor);
  return jsonResponse({ appointments });
});

export const POST = withAuth(async (request, _context, actor) => {
  const body = bookAppointmentSchema.parse(await readJsonBody(request));
  const appointment = await bookAppointment(actor, {
    staffProfileId: body.staffProfileId,
    startsAt: new Date(body.startsAt),
  });

  return jsonResponse({ appointment }, 201);
});
