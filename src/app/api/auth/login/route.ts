// Login endpoint for session creation.
// What calls this file: the login page and any programmatic client.
// What it calls: login validation, authService.login, and cookie minting.
// Junior pitfall: authenticating in the UI and forgetting the API must still reject bad credentials.

import { apiRoute } from "@/lib/http/route";
import { readJsonBody } from "@/lib/http/request";
import { loginSchema } from "@/lib/validation/authSchemas";
import { login, getSessionCookieOptionsForResponse } from "@/services/authService";
import { jsonResponse } from "@/lib/http";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const POST = apiRoute(async (request, _context) => {
  const body = loginSchema.parse(await readJsonBody(request));
  const result = await login(body);

  const response = jsonResponse({
    user: result.user,
  });

  response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptionsForResponse());
  return response;
});
