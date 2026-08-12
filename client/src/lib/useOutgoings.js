import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";

export function useOutgoings(classId, date) {
  return useQuery({
    queryKey: ["outgoings", classId, date],
    queryFn: () => api.get(`/outgoings?class_id=${classId}&date=${date}`),
    enabled: !!classId && !!date,
  });
}

export function useOutgoingSuggestions(classId) {
  return useQuery({
    queryKey: ["outgoings", "suggestions", classId],
    queryFn: () => api.get(`/outgoings/suggestions?class_id=${classId}`),
    enabled: !!classId,
  });
}

export function useAddOutgoing(classId, date) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/outgoings", { class_id: classId, session_date: date, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outgoings", classId, date] });
      qc.invalidateQueries({ queryKey: ["outgoings", "suggestions", classId] });
    },
  });
}

export function useDeleteOutgoing(classId, date) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/outgoings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outgoings", classId, date] }),
  });
}
