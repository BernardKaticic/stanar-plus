import { useQuery } from "@tanstack/react-query";
import { tenantsApi } from "@/lib/api";

interface UseTenantsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const useTenants = ({ page = 1, pageSize = 25, search = "" }: UseTenantsParams = {}) => {
  return useQuery({
    queryKey: ["tenants", page, pageSize, search],
    queryFn: () => tenantsApi.getAll({ page, pageSize, search }),
  });
};
