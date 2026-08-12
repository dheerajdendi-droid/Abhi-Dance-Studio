import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";

export function useAuthStatus() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me"),
    staleTime: Infinity,
  });
}

export function useSetupPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin) => api.post("/auth/setup", { pin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin) => api.post("/auth/login", { pin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}
