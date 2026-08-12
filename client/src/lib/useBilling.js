import { useQuery } from "@tanstack/react-query";
import { api } from "./api.js";

export function useBillingMonth(month) {
  return useQuery({
    queryKey: ["billing", "month", month],
    queryFn: () => api.get(`/billing/${month}`),
    enabled: !!month,
  });
}

export function useBillingOutstanding() {
  return useQuery({
    queryKey: ["billing", "outstanding"],
    queryFn: () => api.get("/billing/outstanding"),
  });
}
