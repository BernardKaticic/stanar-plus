import { useQuery } from "@tanstack/react-query";
import { representativesApi } from "@/lib/api";

export const useRepresentatives = (search?: string) => {
  return useQuery({
    queryKey: ["representatives", search],
    queryFn: () => representativesApi.getAll({ search: search || undefined }),
  });
};
