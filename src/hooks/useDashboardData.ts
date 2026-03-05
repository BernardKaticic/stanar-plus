import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: FIVE_MINUTES_MS,
    placeholderData: keepPreviousData,
  });
};

export const useDashboardActivities = () => {
  return useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: () => dashboardApi.getActivities(),
    refetchInterval: FIVE_MINUTES_MS,
    placeholderData: keepPreviousData,
  });
};

export const useDashboardDebtors = () => {
  return useQuery({
    queryKey: ["dashboard-debtors"],
    queryFn: () => dashboardApi.getDebtors(),
    refetchInterval: FIVE_MINUTES_MS,
    placeholderData: keepPreviousData,
  });
};
