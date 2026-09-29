// Availability hooks for the selected staff member and time window.
// What calls this file: the calendar view inside the dashboard.
// What it calls: the staff availability route.
// Junior pitfall: fetching availability with a broad date range and then rendering stale data without invalidation.

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useAvailabilityQuery(input?: { staffProfileId?: string; from?: string; to?: string }) {
  const staffProfileId = input?.staffProfileId ?? "";
  const from = input?.from ?? "";
  const to = input?.to ?? "";

  return useQuery({
    queryKey: ["availability", staffProfileId, from, to],
    queryFn: () =>
      apiFetch<{ slots: Array<{ startsAt: string; endsAt: string; isOpen: boolean; reason?: string }> }>(
        `/api/staff/${staffProfileId}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(staffProfileId && from && to),
  });
}
