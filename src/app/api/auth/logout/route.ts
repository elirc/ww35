// Logout endpoint that clears the session token if present.
// What calls this file: the app shell and login page.
// What it calls: session revocation and a cookie clear on the response.
// Junior pitfall: deleting the cookie but forgetting to revoke the server-side session row.

import { apiRoute } from "@/lib/http/route";
import { jsonResponse } from "@/lib/http";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logout } from "@/services/authService";

export const POST = apiRoute(async (request, _context) => {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "";
  await logout(sessionToken);

  const response = jsonResponse({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
});
