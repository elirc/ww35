// Admin-only working-hours creation endpoint.
// What calls this file: the admin staff setup screen.
// What it calls: withRole and the availability service.
// Junior pitfall: storing a working-hours rule with endMinute <= startMinute and assuming the calendar will self-correct.

import { jsonResponse } from "@/lib/http";
import { withRole } from "@/lib/auth/with-role";
import { readJsonBody } from "@/lib/http/request";
import { createWorkingHoursRuleSchema } from "@/lib/validation/appointmentSchemas";
import { createWorkingHours } from "@/services/availabilityService";

export const POST = withRole(["ADMIN"], async (request, _context, actor) => {
  const body = createWorkingHoursRuleSchema.parse(await readJsonBody(request));
  const rule = await createWorkingHours(actor, body);
  return jsonResponse({ rule }, 201);
});
