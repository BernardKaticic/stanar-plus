import { useQuery } from "@tanstack/react-query";
import { debtorsApi } from "@/lib/api";

interface UseDebtorsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const useDebtors = ({ page = 1, pageSize = 25, search = "" }: UseDebtorsParams = {}) => {
  return useQuery({
    queryKey: ["debtors", page, pageSize, search],
    queryFn: () => debtorsApi.getAll({ page, pageSize, search }),
  });
};
