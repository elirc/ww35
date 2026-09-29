// Main dashboard orchestration component.
// What calls this file: the dashboard page.
// What it calls: all query hooks and the child presentation components.
// Junior pitfall: letting the component become a service layer by pushing rule logic into JSX.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppointmentsQuery, useBookAppointmentMutation, useCancelAppointmentMutation } from "@/hooks/useAppointments";
import { useAvailabilityQuery } from "@/hooks/useAvailability";
import {
  useCreateStaffMutation,
  useCreateTimeOffMutation,
  useCreateWorkingHoursMutation,
  useStaffQuery,
} from "@/hooks/useStaff";
import { useLogoutMutation, useMeQuery } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api-client";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { AppointmentList } from "@/components/AppointmentList";
import { AdminStaffForm } from "@/components/AdminStaffForm";
import { AdminAvailabilityForms } from "@/components/AdminAvailabilityForms";

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function BookingDashboard() {
  const router = useRouter();
  const me = useMeQuery();
  const staff = useStaffQuery(Boolean(me.data?.user));
  const appointments = useAppointmentsQuery(Boolean(me.data?.user));
  const logout = useLogoutMutation();
  const book = useBookAppointmentMutation();
  const cancel = useCancelAppointmentMutation();
  const createStaff = useCreateStaffMutation();
  const createHours = useCreateWorkingHoursMutation();
  const createTimeOff = useCreateTimeOffMutation();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const from = useMemo(() => new Date().toISOString(), []);
  const to = useMemo(() => addDays(new Date(), 7).toISOString(), []);
  const availability = useAvailabilityQuery({
    staffProfileId: selectedStaffId,
    from,
    to,
  });
  const selectedStaff = staff.data?.staff?.find((item) => item.id === selectedStaffId);

  useEffect(() => {
    if (me.error instanceof ApiClientError && me.error.status === 401) {
      router.push("/login");
      return;
    }

    if (me.data?.user && !selectedStaffId) {
      setSelectedStaffId(staff.data?.staff?.[0]?.id ?? "");
    }
  }, [me.data?.user, me.error, router, selectedStaffId, staff.data?.staff]);

  if (me.isLoading) {
    return <div className="card p-8 text-sm text-ink-600">Checking session...</div>;
  }

  return (
    <div className="space-y-8">
      <header className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-700">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Appointment operations</h1>
          <p className="text-sm text-ink-600">
            Signed in as {me.data?.user ? `${me.data.user.name} (${me.data.user.role})` : "loading..."}
          </p>
        </div>
        <button
          className="btn-secondary"
          type="button"
          onClick={async () => {
            await logout.mutateAsync();
            router.push("/login");
          }}
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <label className="mb-2 block text-sm font-medium">Staff member</label>
            <select
              className="field"
              value={selectedStaffId}
              onChange={(event) => {
                setSelectedStaffId(event.target.value);
                setSelectedSlot(null);
              }}
            >
              <option value="">Select a staff member</option>
              {staff.data?.staff?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </div>

          {availability.data?.slots ? (
            <AvailabilityCalendar
              slots={availability.data.slots}
              selectedSlot={selectedSlot}
              timeZone={selectedStaff?.timezone}
              onSelectSlot={(slot) => setSelectedSlot(slot.startsAt)}
            />
          ) : (
            <div className="card p-6 text-sm text-ink-500">Pick a staff member to load availability.</div>
          )}
        </div>

        <div className="space-y-6">
          {me.data?.user?.role === "CLIENT" ? (
            <div className="card space-y-4 p-6">
              <h2 className="text-lg font-semibold">Book appointment</h2>
              <p className="text-sm text-ink-600">
                The selected slot is passed to <code>/api/appointments</code>, where the service checks calendar
                rules before the insert reaches PostgreSQL.
              </p>
              <button
                className="btn-primary"
                type="button"
                disabled={!selectedStaffId || !selectedSlot || book.isPending}
                onClick={async () => {
                  if (!selectedStaffId || !selectedSlot) {
                    return;
                  }

                  await book.mutateAsync({
                    staffProfileId: selectedStaffId,
                    startsAt: selectedSlot,
                  });
                }}
              >
                {book.isPending ? "Booking..." : "Book selected slot"}
              </button>
            </div>
          ) : (
            <div className="card p-6 text-sm text-ink-600">
              Only clients can create appointments here. Staff and admins use the same availability view to inspect
              calendars and manage schedules.
            </div>
          )}

          <AppointmentList
            appointments={appointments.data?.appointments ?? []}
            onCancel={async (appointmentId) => {
              await cancel.mutateAsync({ appointmentId });
            }}
          />

          {me.data?.user?.role === "ADMIN" ? (
            <div className="space-y-4">
              <AdminStaffForm
                onSubmit={async (input) => {
                  await createStaff.mutateAsync(input);
                }}
              />
              <AdminAvailabilityForms
                staffOptions={staff.data?.staff?.map((item) => ({ id: item.id, displayName: item.displayName })) ?? []}
                onCreateWorkingHours={async (input) => {
                  await createHours.mutateAsync(input);
                }}
                onCreateTimeOff={async (input) => {
                  await createTimeOff.mutateAsync(input);
                }}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
