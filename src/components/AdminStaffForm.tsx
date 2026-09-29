// Admin-only staff creation form.
// What calls this file: the booking dashboard when the current user is an admin.
// What it calls: admin staff and working-hours mutations supplied by the parent.
// Junior pitfall: asking the UI to create a staff profile before the backend has created the user row.

"use client";

import { useState } from "react";

export function AdminStaffForm({
  onSubmit,
}: {
  onSubmit: (input: {
    email: string;
    name: string;
    displayName: string;
    timezone: string;
    appointmentDurationMinutes: number;
    password: string;
  }) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("new-staff@acme.test");
  const [name, setName] = useState("New Staff");
  const [displayName, setDisplayName] = useState("New Clinician");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [appointmentDurationMinutes, setAppointmentDurationMinutes] = useState(30);
  const [password, setPassword] = useState("Staff123!");

  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({ email, name, displayName, timezone, appointmentDurationMinutes, password });
      }}
    >
      <h2 className="text-lg font-semibold">Create staff</h2>
      <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
      <input className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Timezone" />
      <input
        className="field"
        type="number"
        value={appointmentDurationMinutes}
        onChange={(e) => setAppointmentDurationMinutes(Number(e.target.value))}
      />
      <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn-primary w-full" type="submit">
        Create staff member
      </button>
    </form>
  );
}
