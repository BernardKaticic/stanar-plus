import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";

export const useEInvoices = (params?: { status?: string; search?: string; direction?: string }) => {
  return useQuery({
    queryKey: ["invoices", params?.status, params?.search, params?.direction],
    queryFn: () => invoicesApi.getAll(params),
  });
};
