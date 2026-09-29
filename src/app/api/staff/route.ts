// Staff listing endpoint for calendar selection.
// What calls this file: the dashboard staff picker.
// What it calls: withAuth and the staff repository.
// Junior pitfall: exposing staff lists without auth when the rest of the app assumes a private workspace.

import { jsonResponse } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { listStaff } from "@/services/availabilityService";

export const GET = withAuth(async () => {
  const staff = await listStaff();
  return jsonResponse({ staff });
});
