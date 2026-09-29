// Session echo endpoint used by the frontend to hydrate auth state.
// What calls this file: the dashboard and navbar.
// What it calls: withAuth and the session-derived actor object.
// Junior pitfall: returning user identity from client state instead of the server session.

import { jsonResponse } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth(async (_request, _context, actor) => {
  return jsonResponse({ user: actor });
});
