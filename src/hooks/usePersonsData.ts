import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { personsApi } from "@/lib/api";

interface UsePersonsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'all' | 'paid' | 'overdue' | 'pending';
  deliveryMethod?: 'all' | 'email' | 'pošta';
  city?: string;
}

export const usePersons = ({
  page = 1,
  pageSize = 25,
  search = "",
  status = "all",
  deliveryMethod = "all",
  city,
}: UsePersonsParams = {}) => {
  return useQuery({
    queryKey: ["persons", page, pageSize, search, status, deliveryMethod, city ?? ""],
    queryFn: () =>
      personsApi.getAll({
        page,
        pageSize,
        search,
        ...(status !== "all" && { status }),
        ...(deliveryMethod !== "all" && { deliveryMethod }),
        ...(city && city !== "all" && { city }),
      }),
    placeholderData: keepPreviousData,
  });
};
