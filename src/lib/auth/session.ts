// Session token creation and cookie policy.
// What calls this file: authService and route handlers that mint or clear login state.
// What it calls: Node crypto for token generation.
// Junior pitfall: reusing user IDs as session tokens instead of generating opaque secrets.

import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "appointment_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
