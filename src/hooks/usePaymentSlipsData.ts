import { useQuery } from "@tanstack/react-query";
import { paymentSlipsApi } from "@/lib/api";

interface UsePaymentSlipsParams {
  page?: number;
  pageSize?: number;
}

export const usePaymentSlips = ({ page = 1, pageSize = 25 }: UsePaymentSlipsParams = {}) => {
  return useQuery({
    queryKey: ["payment-slips", page, pageSize],
    queryFn: () => paymentSlipsApi.getAll({ page, pageSize }),
  });
};
