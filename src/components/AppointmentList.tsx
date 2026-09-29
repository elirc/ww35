// Appointment list with cancellation affordances.
// What calls this file: the booking dashboard.
// What it calls: the cancel mutation supplied by the parent.
// Junior pitfall: showing cancel actions without checking the appointment status first.

"use client";

export function AppointmentList({
  appointments,
  onCancel,
}: {
  appointments: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    cancellationReason?: string | null;
    staffProfile: { displayName: string };
    client: { name: string };
  }>;
  onCancel?: (appointmentId: string) => void;
}) {
  return (
    <div className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Appointments</h2>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-ink-500">No appointments yet.</p>
        ) : null}
        {appointments.map((appointment) => (
          <article key={appointment.id} className="rounded-2xl border border-ink-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{appointment.staffProfile.displayName}</p>
                <p className="text-sm text-ink-600">{new Date(appointment.startsAt).toLocaleString()}</p>
                <p className="text-xs text-ink-500">Client: {appointment.client.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{appointment.status}</p>
                {appointment.status === "BOOKED" && onCancel ? (
                  <button className="btn-secondary mt-2" type="button" onClick={() => onCancel(appointment.id)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
            {appointment.cancellationReason ? (
              <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {appointment.cancellationReason}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
