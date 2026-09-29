import { ZodError } from "zod";
// App-specific error classes and status mapping.
// What calls this file: services, repositories, and route handlers.
// What it calls: nothing; it is the shared boundary for predictable failures.
// Junior pitfall: throwing plain Error and losing the HTTP status contract.

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedAppError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenAppError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundAppError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictAppError extends AppError {
  constructor(message = "The requested change conflicts with current data") {
    super(message, 409, "CONFLICT");
  }
}

export class InvalidTransitionAppError extends AppError {
  constructor(message = "That state transition is not allowed") {
    super(message, 409, "INVALID_TRANSITION");
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) return { status: 400, body: { error: { code: "VALIDATION_ERROR", message: "Invalid request fields." } } };
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message } },
    };
  }

  return {
    status: 500,
    body: { error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error" } },
  };
}
