// Admin-only time-off block creation endpoint.
// What calls this file: operational calendar management.
// What it calls: withRole and the availability service.
// Junior pitfall: blocking staff availability in the UI but not persisting the same blackout in the database.

import { z } from "zod";
import { jsonResponse } from "@/lib/http";
import { withRole } from "@/lib/auth/with-role";
import { readJsonBody } from "@/lib/http/request";
import { createTimeOff } from "@/services/availabilityService";

const createTimeOffSchema = z.object({
  staffProfileId: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  reason: z.string().max(500).optional(),
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
  message: "Time off must end after it starts",
  path: ["endsAt"],
});

export const POST = withRole(["ADMIN"], async (request, _context, actor) => {
  const body = createTimeOffSchema.parse(await readJsonBody(request));
  const timeOff = await createTimeOff(actor, {
    staffProfileId: body.staffProfileId,
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
    reason: body.reason,
  });

  return jsonResponse({ timeOff }, 201);
});
