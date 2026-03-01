import { useQuery } from "@tanstack/react-query";
import { personsApi } from "@/lib/api";

interface UsePersonsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const usePersons = ({ page = 1, pageSize = 25, search = "" }: UsePersonsParams = {}) => {
  return useQuery({
    queryKey: ["persons", page, pageSize, search],
    queryFn: () => personsApi.getAll({ page, pageSize, search }),
  });
};
