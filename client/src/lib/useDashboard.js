import { useQuery } from "@tanstack/react-query";
import { api } from "./api.js";

export function useDashboardSummary() {
  return useQuery({ queryKey: ["dashboard", "summary"], queryFn: () => api.get("/dashboard/summary") });
}

export function useDashboardClasses(month) {
  return useQuery({
    queryKey: ["dashboard", "classes", month],
    queryFn: () => api.get(`/dashboard/classes?month=${month}`),
    enabled: !!month,
  });
}
