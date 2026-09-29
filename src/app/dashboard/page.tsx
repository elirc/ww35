// Dashboard route that assembles the booking workflow.
// What calls this file: authenticated users entering the main app.
// What it calls: the BookingDashboard client component.
// Junior pitfall: fetching appointments directly in a server component and losing the reactive booking flow.

import { BookingDashboard } from "@/components/BookingDashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <BookingDashboard />
    </main>
  );
}
