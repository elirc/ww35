// Staff hooks for calendar selection and admin setup.
// What calls this file: the booking dashboard and admin forms.
// What it calls: /api/staff and admin mutation endpoints.
// Junior pitfall: mixing staff list fetching with appointment creation in the same hook.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useStaffQuery(enabled = true) {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch<{ staff: Array<{ id: string; displayName: string; timezone: string; appointmentDurationMinutes: number; user: { name: string; email: string } }> }>("/api/staff"),
    enabled,
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      email: string;
      name: string;
      displayName: string;
      timezone: string;
      appointmentDurationMinutes: number;
      password: string;
    }) =>
      apiFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useCreateWorkingHoursMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      staffProfileId: string;
      dayOfWeek: number;
      startMinute: number;
      endMinute: number;
      active?: boolean;
    }) =>
      apiFetch("/api/admin/working-hours", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCreateTimeOffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      staffProfileId: string;
      startsAt: string;
      endsAt: string;
      reason?: string;
    }) =>
      apiFetch("/api/admin/time-off", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
