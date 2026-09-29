// Login page that talks to the auth hooks.
// What calls this file: the /login route.
// What it calls: the LoginForm client component.
// Junior pitfall: managing auth state locally instead of using the server session and a query hook.

import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
      <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Access</p>
          <h1 className="text-5xl font-semibold tracking-tight text-ink-900">Sign in to manage bookings.</h1>
          <p className="max-w-xl text-lg leading-8 text-ink-600">
            The login form posts to <code>/api/auth/login</code>, which validates credentials, creates a session
            row, and sets the secure cookie that every protected route reads.
          </p>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
