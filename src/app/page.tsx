// Lightweight landing page that routes users into login or the dashboard.
// What calls this file: the root route.
// What it calls: Next.js Link components only.
// Junior pitfall: putting business logic here instead of letting the authenticated dashboard own the workflow.

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
      <section className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Booking desk</p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-ink-900 md:text-7xl">
            Appointment scheduling with calendar-aware double-booking protection.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-ink-600">
            This learning project shows how the request flows through route handlers, guards, services,
            and Prisma queries before a single appointment is written.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/login">
              Sign in
            </Link>
            <Link className="btn-secondary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>

        <aside className="card p-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ink-500">What it teaches</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-700">
                <li>Route-level auth and role checks</li>
                <li>Zod validation at the API boundary</li>
                <li>Service-layer booking and cancellation logic</li>
                <li>PostgreSQL overlap prevention for conflicts</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
