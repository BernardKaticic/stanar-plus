import { useQuery } from "@tanstack/react-query";

interface UsePaymentSlipsParams {
  page?: number;
  pageSize?: number;
}

const MOCK_PAYMENT_SLIPS = [
  { period: 'Listopad 2025', date: '15.10.2025.', count: 45, email: 38, print: 7, amount: 4567.89 },
  { period: 'Rujan 2025', date: '15.09.2025.', count: 45, email: 38, print: 7, amount: 4567.89 },
  { period: 'Kolovoz 2025', date: '15.08.2025.', count: 43, email: 36, print: 7, amount: 4389.23 },
  { period: 'Srpanj 2025', date: '15.07.2025.', count: 45, email: 38, print: 7, amount: 4567.89 },
  { period: 'Lipanj 2025', date: '15.06.2025.', count: 44, email: 37, print: 7, amount: 4478.56 },
  { period: 'Svibanj 2025', date: '15.05.2025.', count: 45, email: 38, print: 7, amount: 4567.89 },
];

export const usePaymentSlips = ({ page = 1, pageSize = 25 }: UsePaymentSlipsParams = {}) => {
  return useQuery({
    queryKey: ["payment-slips", page, pageSize],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = MOCK_PAYMENT_SLIPS.slice(from, to);

      return {
        data: paginatedData,
        totalCount: MOCK_PAYMENT_SLIPS.length,
      };
    },
  });
};
