// Admin controls for working-hours rules and time-off blocks.
// What calls this file: the dashboard when the current user is an admin.
// What it calls: the admin availability mutations supplied by the parent.
// Junior pitfall: exposing staff management without any way to shape the calendar behind it.

"use client";

import { useState } from "react";

export function AdminAvailabilityForms({
  staffOptions,
  onCreateWorkingHours,
  onCreateTimeOff,
}: {
  staffOptions: Array<{ id: string; displayName: string }>;
  onCreateWorkingHours: (input: {
    staffProfileId: string;
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    active?: boolean;
  }) => Promise<unknown>;
  onCreateTimeOff: (input: { staffProfileId: string; startsAt: string; endsAt: string; reason?: string }) => Promise<unknown>;
}) {
  const [hoursStaffId, setHoursStaffId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startMinute, setStartMinute] = useState(540);
  const [endMinute, setEndMinute] = useState(1020);
  const [timeOffStaffId, setTimeOffStaffId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="card space-y-4 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await onCreateWorkingHours({
            staffProfileId: hoursStaffId,
            dayOfWeek,
            startMinute,
            endMinute,
            active: true,
          });
        }}
      >
        <h2 className="text-lg font-semibold">Working hours</h2>
        <select className="field" value={hoursStaffId} onChange={(event) => setHoursStaffId(event.target.value)}>
          <option value="">Select staff</option>
          {staffOptions.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.displayName}
            </option>
          ))}
        </select>
        <input className="field" type="number" min={0} max={6} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} />
        <input className="field" type="number" min={0} max={1439} value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))} />
        <input className="field" type="number" min={1} max={1440} value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))} />
        <button className="btn-primary w-full" type="submit">
          Save working hours
        </button>
      </form>

      <form
        className="card space-y-4 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await onCreateTimeOff({
            staffProfileId: timeOffStaffId,
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            reason: reason || undefined,
          });
        }}
      >
        <h2 className="text-lg font-semibold">Time off</h2>
        <select className="field" value={timeOffStaffId} onChange={(event) => setTimeOffStaffId(event.target.value)}>
          <option value="">Select staff</option>
          {staffOptions.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.displayName}
            </option>
          ))}
        </select>
        <input className="field" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <input className="field" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        <button className="btn-primary w-full" type="submit">
          Block time
        </button>
      </form>
    </div>
  );
}
