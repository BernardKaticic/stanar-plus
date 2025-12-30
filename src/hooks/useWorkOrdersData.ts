import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UseWorkOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const MOCK_WORK_ORDERS = [
  { id: '1', title: 'Popravak lifta', building: 'Antuna Starčevića 15', unit: 'Zajedničko', dateReported: '15.10.2025.', status: 'open', priority: 'urgent', assignedTo: 'Mate Instalater', description: 'Lift zapeo između katova' },
  { id: '2', title: 'Čišćenje spremišta', building: 'Ohridska 7', unit: 'Zajedničko', dateReported: '14.10.2025.', status: 'in-progress', priority: 'medium', assignedTo: 'Čistoća d.o.o.', description: 'Redovno čišćenje podrumskog spremišta' },
  { id: '3', title: 'Curenje krovne oluči', building: 'Marmontova 12', unit: '5', dateReported: '13.10.2025.', status: 'open', priority: 'high', assignedTo: '-', description: 'Voda curi s krova u stan' },
  { id: '4', title: 'Zamjena rasvjete', building: 'Vukovarska 25', unit: 'Zajedničko', dateReported: '12.10.2025.', status: 'completed', priority: 'low', assignedTo: 'Elektro-servis', description: 'Zamjena LED rasvjete u hodniku' },
  { id: '5', title: 'Popravak ograde', building: 'Dioklecijanova 5', unit: 'Zajedničko', dateReported: '11.10.2025.', status: 'in-progress', priority: 'medium', assignedTo: 'Bravarija Horvat', description: 'Varenje pukle ograde na balkonu' },
  { id: '6', title: 'Servis kotlovnice', building: 'Matice hrvatske 8', unit: 'Zajedničko', dateReported: '10.10.2025.', status: 'open', priority: 'high', assignedTo: '-', description: 'Godišnji servis kotlovnice' },
  { id: '7', title: 'Čišćenje sniješka', building: 'Kralja Tomislava 22', unit: 'Zajedničko', dateReported: '09.10.2025.', status: 'completed', priority: 'urgent', assignedTo: 'Komunalno poduzeće', description: 'Čišćenje snijega s krova i prilaza' },
  { id: '8', title: 'Popravak domofona', building: 'Zvonimirova 11', unit: '3', dateReported: '08.10.2025.', status: 'open', priority: 'low', assignedTo: '-', description: 'Domofon ne radi' },
];

export const useWorkOrders = ({
  page = 1,
  pageSize = 25,
  search = "",
  statusFilter = "all",
  priorityFilter = "all",
}: UseWorkOrdersParams = {}) => {
  return useQuery({
    queryKey: ["work-orders", page, pageSize, search, statusFilter, priorityFilter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = MOCK_WORK_ORDERS;

      // Apply filters
      if (statusFilter !== "all") {
        filtered = filtered.filter(wo => wo.status === statusFilter);
      }
      if (priorityFilter !== "all") {
        filtered = filtered.filter(wo => wo.priority === priorityFilter);
      }
      if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter(wo =>
          wo.title.toLowerCase().includes(term) ||
          wo.description.toLowerCase().includes(term) ||
          wo.building.toLowerCase().includes(term)
        );
      }

      // Apply pagination
      const totalCount = filtered.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filtered.slice(from, to);

      return {
        data: paginatedData,
        totalCount,
      };
    },
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      toast({
        title: "Radni nalog kreiran",
        description: "Novi radni nalog je uspješno kreiran.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće kreirati radni nalog.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      toast({
        title: "Radni nalog ažuriran",
        description: "Radni nalog je uspješno ažuriran.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati radni nalog.",
        variant: "destructive",
      });
    },
  });
};
