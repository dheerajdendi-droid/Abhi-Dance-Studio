import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";

// ---- Classes ----

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: () => api.get("/classes") });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/classes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/classes/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

// ---- Students ----

export function useStudents(includeInactive = false) {
  return useQuery({
    queryKey: ["students", { includeInactive }],
    queryFn: () => api.get(`/students${includeInactive ? "?include_inactive=true" : ""}`),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/students", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/students/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentHistory"] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useStudentHistory(studentId) {
  return useQuery({
    queryKey: ["studentHistory", studentId],
    queryFn: () => api.get(`/students/${studentId}/history`),
    enabled: !!studentId,
  });
}

// ---- Payments ----

export function useTogglePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, month, paid }) => api.put(`/payments/${studentId}/${month}`, { paid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studentHistory"] });
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

// ---- Settings (rates) ----

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings") });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
