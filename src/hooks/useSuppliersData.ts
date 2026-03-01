import { useQuery } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";

export const useSuppliers = (params?: { search?: string; category?: string }) => {
  return useQuery({
    queryKey: ["suppliers", params?.search, params?.category],
    queryFn: () => suppliersApi.getAll(params),
  });
};
