// Authentication service for login, logout, and session hydration.
// What calls this file: auth route handlers and route guards.
// What it calls: user and session repositories plus password/session helpers.
// Junior pitfall: checking passwords in the route before you know the user exists and the session is valid.

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  getSessionCookieOptions,
  hashSessionToken,
} from "@/lib/auth/session";
import { UnauthorizedAppError } from "@/lib/errors";
import { findActiveSessionByTokenHash, createSession, revokeSessionByTokenHash } from "@/repositories/sessionRepository";
import { findUserByEmail } from "@/repositories/userRepository";
import { verifyPassword } from "@/lib/auth/password";
import type { RequestActor } from "@/types/domain";
import type { NextRequest } from "next/server";

export async function login(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new UnauthorizedAppError("Invalid email or password");
  }

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) {
    throw new UnauthorizedAppError("Invalid email or password");
  }

  const sessionToken = createSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await createSession({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffProfileId: user.staffProfile?.id ?? null,
    },
    sessionToken,
    expiresAt,
  };
}

export async function logout(sessionToken: string) {
  if (!sessionToken) {
    return { revoked: false };
  }

  const tokenHash = hashSessionToken(sessionToken);
  const result = await revokeSessionByTokenHash(tokenHash);
  return { revoked: result.count > 0 };
}

export async function getActorFromSessionToken(sessionToken: string): Promise<RequestActor | null> {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const session = await findActiveSessionByTokenHash(tokenHash);
  if (!session) {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    staffProfileId: session.user.staffProfile?.id ?? null,
  };
}

export async function getActorFromRequest(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "";
  return getActorFromSessionToken(sessionToken);
}

export function getSessionCookieOptionsForResponse() {
  return getSessionCookieOptions();
}

export function assertAuthenticatedActor(actor: RequestActor | null): asserts actor is RequestActor {
  if (!actor) {
    throw new UnauthorizedAppError();
  }
}
