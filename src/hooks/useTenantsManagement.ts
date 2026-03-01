import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { tenantsApi } from "@/lib/api";

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      apartment_id: string;
      name: string;
      email?: string;
      phone?: string;
    }) =>
      tenantsApi.create({
        apartment_id: data.apartment_id,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
      toast({
        title: "Suvlasnik dodan",
        description: "Novi suvlasnik je uspješno dodan.",
      });
    },
    onError: (err: Error & { body?: { message?: string } }) => {
      toast({
        title: "Greška",
        description: err.body?.message || err.message || "Nije moguće dodati suvlasnika.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string } }) =>
      tenantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Suvlasnik ažuriran", description: "Podaci su uspješno spremljeni." });
    },
    onError: (err: Error & { body?: { message?: string } }) => {
      toast({
        title: "Greška",
        description: err.body?.message || "Nije moguće ažurirati.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Suvlasnik uklonjen", description: "Suvlasnik je uklonjen s popisa." });
    },
    onError: (err: Error & { body?: { message?: string } }) => {
      toast({
        title: "Greška",
        description: err.body?.message || "Nije moguće ukloniti.",
        variant: "destructive",
      });
    },
  });
};
