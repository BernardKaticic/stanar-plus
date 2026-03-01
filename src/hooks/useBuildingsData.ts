import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { buildingsApi } from "@/lib/api";

export const citySchema = z.object({
  name: z.string().trim().min(1, "Naziv grada je obavezan").max(100, "Naziv je predugačak"),
});

export const streetSchema = z.object({
  name: z.string().trim().min(1, "Naziv ulice je obavezan").max(100, "Naziv je predugačak"),
});

export const buildingSchema = z.object({
  number: z.string().trim().min(1, "Broj zgrade je obavezan").max(20, "Broj je predugačak"),
  name: z.string().trim().max(100, "Naziv je predugačak").optional(),
  iban: z.string().trim().max(34).optional().nullable(),
  oib: z.string().trim().max(11).optional().nullable(),
  representative: z.string().trim().max(200).optional().nullable(),
  representativePhone: z.string().trim().max(50).optional().nullable(),
  cleaningFee: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  loanFee: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  reservePerSqm: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  savingsFixed: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  extraFixed: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  electricityFixed: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
  savingsPerSqm: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).optional()),
});

export const apartmentSchema = z.object({
  apartment_number: z.string().trim().min(1, "Broj stana je obavezan").max(20, "Broj je predugačak"),
  floor: z.number().int().min(-1, "Kat mora biti broj").max(50, "Kat je prevelik"),
  size_m2: z.number().min(0, "Površina mora biti pozitivna").max(10000, "Površina je prevelika").optional(),
  rooms: z.number().int().min(0, "Broj soba mora biti pozitivan").max(50, "Broj soba je prevelik").optional(),
});

function toTreeFormat(data: any[]): any[] {
  return data.map((c: any) => ({
    ...c,
    id: String(c.id),
    streets: (c.streets || []).map((s: any) => ({
      ...s,
      id: String(s.id),
      buildings: (s.buildings || []).map((b: any) => ({
        ...b,
        id: String(b.id),
        apartments: (b.apartments || []).map((a: any) => ({
          ...a,
          id: String(a.id),
        })),
      })),
    })),
  }));
}

export const useCities = () => {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const data = await buildingsApi.getTree();
      return toTreeFormat(data);
    },
  });
};

export const useCreateCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: z.infer<typeof citySchema>) => buildingsApi.createCity(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Grad kreiran", description: "Novi grad je uspješno dodan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće kreirati grad.", variant: "destructive" });
    },
  });
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof citySchema> }) =>
      buildingsApi.updateCity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Grad ažuriran", description: "Grad je uspješno ažuriran." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće ažurirati grad.", variant: "destructive" });
    },
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => buildingsApi.deleteCity(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Grad obrisan", description: "Grad je uspješno obrisan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati grad.", variant: "destructive" });
    },
  });
};

export const useCreateStreet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ cityId, data }: { cityId: string; data: z.infer<typeof streetSchema> }) =>
      buildingsApi.createStreet({ cityId, name: data.name }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Ulica kreirana", description: "Nova ulica je uspješno dodana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće kreirati ulicu.", variant: "destructive" });
    },
  });
};

export const useUpdateStreet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof streetSchema> }) =>
      buildingsApi.updateStreet(id, { name: data.name }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Ulica ažurirana", description: "Ulica je uspješno ažurirana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće ažurirati ulicu.", variant: "destructive" });
    },
  });
};

export const useDeleteStreet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => buildingsApi.deleteStreet(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Ulica obrisana", description: "Ulica je uspješno obrisana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati ulicu.", variant: "destructive" });
    },
  });
};

export const useCreateBuilding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ streetId, data }: { streetId: string; data: z.infer<typeof buildingSchema> }) =>
      buildingsApi.createBuilding({
        streetId,
        name: data.name || data.number,
        number: data.number,
        cleaningFee: data.cleaningFee ?? 0,
        loanFee: data.loanFee ?? 0,
        reservePerSqm: data.reservePerSqm ?? 0,
        savingsFixed: data.savingsFixed ?? 0,
        extraFixed: data.extraFixed ?? 0,
        electricityFixed: data.electricityFixed ?? 0,
        savingsPerSqm: data.savingsPerSqm ?? 0,
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Zgrada kreirana", description: "Nova zgrada je uspješno dodana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće kreirati zgradu.", variant: "destructive" });
    },
  });
};

export const useUpdateBuilding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof buildingSchema> }) =>
      buildingsApi.updateBuilding(id, {
        name: data.name ?? data.number,
        number: data.number,
        iban: data.iban || null,
        oib: data.oib || null,
        representative: data.representative || null,
        representativePhone: data.representativePhone || null,
        cleaningFee: data.cleaningFee ?? 0,
        loanFee: data.loanFee ?? 0,
        reservePerSqm: data.reservePerSqm ?? 0,
        savingsFixed: data.savingsFixed ?? 0,
        extraFixed: data.extraFixed ?? 0,
        electricityFixed: data.electricityFixed ?? 0,
        savingsPerSqm: data.savingsPerSqm ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Zgrada ažurirana", description: "Zgrada je uspješno ažurirana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće ažurirati zgradu.", variant: "destructive" });
    },
  });
};

export const useDeleteBuilding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => buildingsApi.deleteBuilding(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Zgrada obrisana", description: "Zgrada je uspješno obrisana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati zgradu.", variant: "destructive" });
    },
  });
};

export const useCreateApartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ buildingId, data }: { buildingId: string; data: any }) =>
      buildingsApi.createApartment({
        buildingId,
        number: data.apartment_number,
        area: data.size_m2,
        floor: data.floor ?? 0,
        rooms: data.rooms ?? null,
        owner: data.owner ?? null,
        tenant: data.tenant ?? null,
        contact: data.contact ?? null,
        email: data.email || null,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Stan kreiran", description: "Novi stan je uspješno dodan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće kreirati stan.", variant: "destructive" });
    },
  });
};

export const useUpdateApartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      buildingsApi.updateApartment(id, {
        number: data.apartment_number,
        area: data.size_m2,
        floor: data.floor ?? 0,
        rooms: data.rooms ?? null,
        owner: data.owner ?? null,
        tenant: data.tenant ?? null,
        contact: data.contact ?? null,
        email: data.email || null,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Stan ažuriran", description: "Stan je uspješno ažuriran." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće ažurirati stan.", variant: "destructive" });
    },
  });
};

export const useDeleteApartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => buildingsApi.deleteApartment(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["cities"] });
      toast({ title: "Stan obrisan", description: "Stan je uspješno obrisan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati stan.", variant: "destructive" });
    },
  });
};
