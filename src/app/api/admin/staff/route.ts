// Admin-only staff creation endpoint.
// What calls this file: the admin setup workflow.
// What it calls: withRole, validation, password hashing, and the staff creation service.
// Junior pitfall: creating a user row without a staff profile, which breaks calendar ownership later.

import { jsonResponse } from "@/lib/http";
import { withRole } from "@/lib/auth/with-role";
import { readJsonBody } from "@/lib/http/request";
import { createStaffMemberSchema } from "@/lib/validation/appointmentSchemas";
import { hashPassword } from "@/lib/auth/password";
import { createStaffMember } from "@/services/availabilityService";

export const POST = withRole(["ADMIN"], async (request, _context, actor) => {
  const body = createStaffMemberSchema.parse(await readJsonBody(request));
  const staff = await createStaffMember(actor, {
    ...body,
    passwordHash: await hashPassword(body.password),
  });

  return jsonResponse({ staff }, 201);
});
