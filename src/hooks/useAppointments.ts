// Appointment hooks for reading, booking, and cancelling.
// What calls this file: the booking dashboard.
// What it calls: /api/appointments and the cancel sub-route.
// Junior pitfall: mutating the list and forgetting to invalidate the canonical server query.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useAppointmentsQuery(enabled = true) {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch<{ appointments: any[] }>("/api/appointments"),
    enabled,
  });
}

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { staffProfileId: string; startsAt: string }) =>
      apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { appointmentId: string; cancellationReason?: string }) =>
      apiFetch(`/api/appointments/${input.appointmentId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancellationReason: input.cancellationReason }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
