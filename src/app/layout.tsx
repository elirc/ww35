// Root layout for the appointment booking app.
// What calls this file: Next.js app router for every page render.
// What it calls: AppProviders and the app-wide stylesheet.
// Junior pitfall: forgetting to wrap the tree in the query provider and wondering why hooks fail later.

import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "Appointment Booking System",
  description: "Availability calendars, double-booking prevention, and cancellations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
