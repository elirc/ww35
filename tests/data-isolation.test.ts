import { describe, expect, it } from "vitest";
import { buildAppointmentListWhere } from "@/lib/data/appointmentScopes";
import type { RequestActor } from "@/types/domain";

describe("data isolation", () => {
  it("keeps client appointment queries scoped to the authenticated user", () => {
    // This would catch a production bug where a broad list query accidentally exposes another user's booking.
    const actor: RequestActor = {
      sessionId: "session_1",
      userId: "client_1",
      email: "client@acme.test",
      name: "Client",
      role: "CLIENT",
      staffProfileId: null,
    };

    expect(buildAppointmentListWhere(actor)).toEqual({ clientId: "client_1" });
  });
});
