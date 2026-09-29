// Route guard that injects the authenticated actor.
// What calls this file: protected route handlers in src/app/api.
// What it calls: authService.getActorFromRequest and the shared route error wrapper.
// Junior pitfall: checking auth in the UI instead of making the API reject unauthenticated requests.

import type { NextRequest } from "next/server";
import { UnauthorizedAppError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { getActorFromRequest } from "@/services/authService";
import type { RequestActor } from "@/types/domain";

type AuthenticatedHandler<TContext> = (
  request: NextRequest,
  context: { params: TContext },
  actor: RequestActor,
) => Promise<Response>;

export function withAuth<TContext = Record<string, string | string[]>>(
  handler: AuthenticatedHandler<TContext>,
) {
  return async (request: NextRequest, context: { params: Promise<TContext> }) => {
    try {
      const actor = await getActorFromRequest(request);
      if (!actor) {
        throw new UnauthorizedAppError();
      }

      return await handler(request, { params: await context.params }, actor);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
