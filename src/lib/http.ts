// Route response helpers.
// What calls this file: route handlers under src/app/api and a few tests.
// What it calls: NextResponse.json for the actual HTTP response.
// Junior pitfall: returning raw objects from route handlers and losing a consistent error contract.

import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";

export function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export function errorResponse(error: unknown) {
  const mapped = toErrorResponse(error);
  return NextResponse.json(mapped.body, { status: mapped.status });
}
