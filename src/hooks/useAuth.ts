// Auth hooks for the current session and login/logout mutations.
// What calls this file: login and dashboard client components.
// What it calls: /api/me, /api/auth/login, and /api/auth/logout.
// Junior pitfall: caching auth state in local storage and bypassing the server cookie.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { RequestActor } from "@/types/domain";

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: RequestActor }>("/api/me"),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiFetch<{ user: RequestActor }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.removeQueries({ queryKey: ["appointments"] });
      await queryClient.removeQueries({ queryKey: ["availability"] });
    },
  });
}
