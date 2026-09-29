// Centralized role checks for the booking app.
// What calls this file: auth guards, route handlers, and service methods.
// What it calls: shared error types only.
// Junior pitfall: checking the role in the UI and assuming the API is secure.

import { ForbiddenAppError } from "@/lib/errors";
import type { RequestActor, Role } from "@/types/domain";

export function hasRole(actor: RequestActor | null | undefined, roles: Role[]) {
  return Boolean(actor && roles.includes(actor.role));
}

export function requireRole(actor: RequestActor | null | undefined, roles: Role[]) {
  if (!hasRole(actor, roles)) {
    throw new ForbiddenAppError("This action is limited to a different role");
  }
}

export function isActorOwner(actor: RequestActor, ownerUserId: string) {
  return actor.userId === ownerUserId;
}
