// Client login form that posts to the session endpoint.
// What calls this file: the login page.
// What it calls: useLoginMutation from the auth hooks.
// Junior pitfall: treating a successful fetch as proof of login before the cookie has been set.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const login = useLoginMutation();
  const [email, setEmail] = useState("client@acme.test");
  const [password, setPassword] = useState("Client123!");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card space-y-5 p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        try {
          await login.mutateAsync({ email, password });
          router.push("/dashboard");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to sign in");
        }
      }}
    >
      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-xs leading-5 text-ink-500">
        Demo users are seeded in <code>prisma/seed.ts</code>.
      </p>
    </form>
  );
}
