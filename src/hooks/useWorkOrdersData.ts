import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { workOrdersApi } from "@/lib/api";

interface UseWorkOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

export const useWorkOrders = ({
  page = 1,
  pageSize = 25,
  search = "",
  statusFilter = "all",
  priorityFilter = "all",
}: UseWorkOrdersParams = {}) => {
  return useQuery({
    queryKey: ["work-orders", page, pageSize, search, statusFilter, priorityFilter],
    queryFn: () =>
      workOrdersApi.getAll({
        page,
        pageSize,
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      }),
    placeholderData: keepPreviousData,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; building_id: string; apartment_id?: string; created_by: string; dateReported?: string; status?: string; priority?: string; assignedTo?: string }) =>
      workOrdersApi.create({
        title: data.title,
        description: data.description,
        building_id: data.building_id,
        apartment_id: data.apartment_id || null,
        dateReported: data.dateReported,
        status: data.status || "open",
        priority: data.priority || "medium",
        assignedTo: data.assignedTo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders", "stats"] });
      toast({ title: "Radni nalog kreiran", description: "Novi radni nalog je uspješno kreiran." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće kreirati radni nalog.", variant: "destructive" });
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; status?: string; priority?: string; building_id?: string; apartment_id?: string; assignedTo?: string } }) =>
      workOrdersApi.update(id, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        building_id: data.building_id,
        apartment_id: data.apartment_id,
        assignedTo: data.assignedTo,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders", variables.id] });
      toast({ title: "Radni nalog ažuriran", description: "Radni nalog je uspješno ažuriran." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće ažurirati radni nalog.", variant: "destructive" });
    },
  });
};
