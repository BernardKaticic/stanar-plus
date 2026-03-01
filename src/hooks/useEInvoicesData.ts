import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";

export const useEInvoices = (params?: { status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["invoices", params?.status, params?.search],
    queryFn: () => invoicesApi.getAll(params),
  });
};
