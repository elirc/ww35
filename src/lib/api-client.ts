// Tiny fetch wrapper for the React Query hooks.
// What calls this file: client hooks under src/hooks and a few client components.
// What it calls: the browser fetch API.
// Junior pitfall: duplicating the same error parsing logic in every hook.

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new ApiClientError(error.message ?? "Request failed", response.status, error.code ?? "REQUEST_FAILED");
  }

  return payload as T;
}
