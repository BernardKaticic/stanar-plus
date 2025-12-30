import { useQuery } from "@tanstack/react-query";

interface UseDebtorsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

const MOCK_DEBTORS = [
  { id: '4', name: 'Ivana Kovač', email: 'kovac.ivana@gmail.com', address: 'Trg bana J. Jelačića 3, Stan 1', city: 'Split', amount: '234.50 €', amountNum: 234.50, months: 3, lastReminder: '10.10.2025.', warningsSent: 2 },
  { id: '7', name: 'Tomislav Vuković', email: 'vukovic.t@gmail.com', address: 'Matice hrvatske 8, Stan 1', city: 'Vinkovci', amount: '187.20 €', amountNum: 187.20, months: 2, lastReminder: '12.10.2025.', warningsSent: 1 },
  { id: '8', name: 'Petra Šimić', email: 'petra.simic@gmail.com', address: 'Zvonimirova 11, Stan 3', city: 'Split', amount: '156.80 €', amountNum: 156.80, months: 2, lastReminder: null, warningsSent: 0 },
  { id: '11', name: 'Ivan Marić', email: 'ivan.maric@gmail.com', address: 'Vukovarska 18, Stan 2', city: 'Vinkovci', amount: '125.40 €', amountNum: 125.40, months: 2, lastReminder: '08.10.2025.', warningsSent: 1 },
  { id: '12', name: 'Kristina Pavlović', email: '', address: 'Dioklecijanova 9, Stan 4', city: 'Split', amount: '98.70 €', amountNum: 98.70, months: 1, lastReminder: null, warningsSent: 0 },
  { id: '13', name: 'Nikola Đurić', email: 'nikola.djuric@gmail.com', address: 'Marmontova 8, Stan 7', city: 'Split', amount: '87.50 €', amountNum: 87.50, months: 1, lastReminder: '11.10.2025.', warningsSent: 1 },
  { id: '14', name: 'Marina Babić', email: 'marina.babic@gmail.com', address: 'Kralja Tomislava 15, Stan 3', city: 'Vukovar', amount: '76.20 €', amountNum: 76.20, months: 1, lastReminder: null, warningsSent: 0 },
  { id: '15', name: 'Stjepan Kovačić', email: 'stjepan.k@gmail.com', address: 'Ohridska 12, Stan 5', city: 'Vinkovci', amount: '65.55 €', amountNum: 65.55, months: 1, lastReminder: '13.10.2025.', warningsSent: 1 },
];

export const useDebtors = ({ page = 1, pageSize = 25, search = "" }: UseDebtorsParams = {}) => {
  return useQuery({
    queryKey: ["debtors", page, pageSize, search],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let filteredDebtors = MOCK_DEBTORS;

      // Apply search filter
      if (search) {
        const term = search.toLowerCase();
        filteredDebtors = MOCK_DEBTORS.filter(d =>
          d.name.toLowerCase().includes(term) ||
          d.email.toLowerCase().includes(term) ||
          d.address.toLowerCase().includes(term) ||
          d.city.toLowerCase().includes(term)
        );
      }

      // Apply pagination
      const totalCount = filteredDebtors.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredDebtors.slice(from, to);

      return {
        data: paginatedData,
        totalCount,
      };
    },
  });
};
