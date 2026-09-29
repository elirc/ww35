// Role guard for admin and privileged actions.
// What calls this file: route handlers that should not rely on UI-level role gating.
// What it calls: withAuth and requireRole.
// Junior pitfall: forgetting to test the forbidden path because the happy path works locally.

import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireRole } from "@/lib/auth/permissions";
import { withAuth } from "@/lib/auth/with-auth";
import type { RequestActor, Role } from "@/types/domain";

type RoleHandler<TContext> = (
  request: NextRequest,
  context: { params: TContext },
  actor: RequestActor,
) => Promise<Response>;

export function withRole<TContext = Record<string, string | string[]>>(
  roles: Role[],
  handler: RoleHandler<TContext>,
) {
  return withAuth<TContext>(async (request, context, actor) => {
    try {
      requireRole(actor, roles);
      return await handler(request, context, actor);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
