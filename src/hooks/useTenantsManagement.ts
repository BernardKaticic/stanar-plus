import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      full_name: string;
      phone?: string;
      apartment_id: string;
    }) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["available-apartments"] });
      toast({
        title: "Stanar dodan",
        description: "Novi stanar je uspješno dodan.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće dodati stanara.",
        variant: "destructive",
      });
    },
  });
};
