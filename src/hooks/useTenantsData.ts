import { useQuery } from "@tanstack/react-query";

interface UseTenantsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

const MOCK_TENANTS = [
  { id: '1', name: 'Mato Galić', email: 'gali.mato@gmail.com', phone: '+385 91 123 4567', address: 'Antuna Starčevića 15, Stan 3', city: 'Vinkovci', area: '65 m²', monthlyRate: '65.55 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'email' },
  { id: '2', name: 'Ana Babić', email: 'babic.ana@gmail.com', phone: '+385 92 234 5678', address: 'Ohridska 7, Stan 2', city: 'Vinkovci', area: '78 m²', monthlyRate: '78.90 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'email' },
  { id: '3', name: 'Petar Horvat', email: 'horvat.p@gmail.com', phone: '+385 93 345 6789', address: 'Marmontova 12, Stan 5', city: 'Split', area: '95 m²', monthlyRate: '95.00 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'email' },
  { id: '4', name: 'Ivana Kovač', email: 'kovac.ivana@gmail.com', phone: '+385 91 456 7890', address: 'Trg bana J. Jelačića 3, Stan 1', city: 'Split', area: '52 m²', monthlyRate: '52.30 €', balance: '-234.50 €', balanceNum: -234.50, status: 'overdue', deliveryMethod: 'email' },
  { id: '5', name: 'Marko Novak', email: 'marko.novak@gmail.com', phone: '+385 92 567 8901', address: 'Vukovarska 25, Stan 4', city: 'Vinkovci', area: '88 m²', monthlyRate: '88.20 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'email' },
  { id: '6', name: 'Lucija Jurić', email: 'lucija.juric@gmail.com', phone: '', address: 'Dioklecijanova 5, Stan 2', city: 'Split', area: '70 m²', monthlyRate: '70.45 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'pošta' },
  { id: '7', name: 'Tomislav Vuković', email: 'vukovic.t@gmail.com', phone: '+385 91 678 9012', address: 'Matice hrvatske 8, Stan 1', city: 'Vinkovci', area: '60 m²', monthlyRate: '60.75 €', balance: '-187.20 €', balanceNum: -187.20, status: 'overdue', deliveryMethod: 'email' },
  { id: '8', name: 'Petra Šimić', email: 'petra.simic@gmail.com', phone: '+385 92 789 0123', address: 'Zvonimirova 11, Stan 3', city: 'Split', area: '82 m²', monthlyRate: '82.60 €', balance: '-156.80 €', balanceNum: -156.80, status: 'overdue', deliveryMethod: 'email' },
  { id: '9', name: 'Josip Matić', email: '', phone: '+385 91 890 1234', address: 'Kralja Tomislava 22, Stan 6', city: 'Vukovar', area: '55 m²', monthlyRate: '55.90 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'pošta' },
  { id: '10', name: 'Maja Knežević', email: 'maja.knezevic@gmail.com', phone: '+385 92 901 2345', address: 'Zrinsko-Frankopanska 4, Stan 2', city: 'Split', area: '73 m²', monthlyRate: '73.25 €', balance: '0.00 €', balanceNum: 0, status: 'paid', deliveryMethod: 'email' },
];

export const useTenants = ({ page = 1, pageSize = 25, search = "" }: UseTenantsParams = {}) => {
  return useQuery({
    queryKey: ["tenants", page, pageSize, search],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const from = (page - 1) * pageSize;
      const to = from + pageSize;

      let filteredTenants = MOCK_TENANTS;

      // Apply search filter
      if (search) {
        const term = search.toLowerCase();
        filteredTenants = MOCK_TENANTS.filter(t =>
          t.name.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          t.address.toLowerCase().includes(term) ||
          t.phone.includes(term)
        );
      }

      const paginatedData = filteredTenants.slice(from, to);

      return {
        data: paginatedData,
        totalCount: filteredTenants.length,
      };
    },
  });
};
