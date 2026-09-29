// Small request helpers for JSON route handlers.
// What calls this file: route handlers in src/app/api.
// What it calls: the built-in request.json() parser.
// Junior pitfall: calling request.json() twice or forgetting to validate the parsed object.

import { ValidationAppError } from "@/lib/errors";
import type { NextRequest } from "next/server";

export async function readJsonBody<T>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationAppError("Request body must be valid JSON");
  }
}
