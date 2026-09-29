// Shared appointment domain types.
// What calls this file: services, repositories, route handlers, and tests.
// What it calls: nothing; it keeps shape definitions at the edge of the app.
// Junior pitfall: re-declaring the same role or status literals in multiple layers.

export type Role = "ADMIN" | "STAFF" | "CLIENT";

export type AppointmentStatus = "BOOKED" | "CANCELLED";

export interface RequestActor {
  userId: string;
  email: string;
  name: string;
  role: Role;
  staffProfileId: string | null;
  sessionId: string;
}

export interface AppointmentView {
  id: string;
  staffProfileId: string;
  staffDisplayName: string;
  clientId: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  isOpen: boolean;
  reason?: string;
}
