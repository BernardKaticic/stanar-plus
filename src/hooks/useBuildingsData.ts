import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schemas
export const citySchema = z.object({
  name: z.string().trim().min(1, "Naziv grada je obavezan").max(100, "Naziv je predugačak"),
});

export const streetSchema = z.object({
  name: z.string().trim().min(1, "Naziv ulice je obavezan").max(100, "Naziv je predugačak"),
});

export const buildingSchema = z.object({
  number: z.string().trim().min(1, "Broj zgrade je obavezan").max(20, "Broj je predugačak"),
  name: z.string().trim().max(100, "Naziv je predugačak").optional(),
});

export const apartmentSchema = z.object({
  apartment_number: z.string().trim().min(1, "Broj stana je obavezan").max(20, "Broj je predugačak"),
  floor: z.number().int().min(-1, "Kat mora biti broj").max(50, "Kat je prevelik"),
  size_m2: z.number().min(0, "Površina mora biti pozitivna").max(10000, "Površina je prevelika").optional(),
  rooms: z.number().int().min(0, "Broj soba mora biti pozitivan").max(50, "Broj soba je prevelik").optional(),
});

const MOCK_CITIES_DATA = [
  {
    id: '1',
    name: 'Vinkovci',
    totalApartments: 45,
    totalDebt: 1234.56,
    streets: [
      {
        id: '1',
        name: 'Antuna Starčevića',
        buildings: [
          {
            id: '1',
            name: '15',
            number: '15',
            iban: 'HR9242485293857229485',
            oib: '12345678901',
            representative: 'Alerić Mato',
            representativePhone: '+385 91 123 4567',
            fees: {
              cleaning: 95.5,
              loan: 180,
              reservePerSqm: 1.85,
            },
            apartments: [
              { id: '1', number: '1', area: 60, floor: 0, rooms: 2, owner: 'Mato Galić', tenant: 'Mato Galić', contact: '+385 91 123 4567', email: 'gali.mato@gmail.com', phone: '+385 91 123 4567', debt: 0, reserve: 650.50, transactions: [] },
              { id: '2', number: '2', area: 75, floor: 1, rooms: 3, owner: 'Ana Babić', tenant: 'Ana Babić', contact: '+385 92 234 5678', email: 'babic.ana@gmail.com', phone: '+385 92 234 5678', debt: 0, reserve: 780.90, transactions: [] },
              { id: '3', number: '3', area: 65, floor: 1, rooms: 2, owner: 'Petar Horvat', tenant: 'Petar Horvat', contact: '+385 93 345 6789', email: 'horvat.p@gmail.com', phone: '+385 93 345 6789', debt: 0, reserve: 655.55, transactions: [] },
            ],
            debt: 0,
            reserve: 2086.95,
          },
        ],
      },
      {
        id: '2',
        name: 'Ohridska',
        buildings: [
          {
            id: '2',
            name: '7',
            number: '7',
            iban: 'HR1542485293857229486',
            oib: '23456789012',
            representative: 'Babić Ana',
            representativePhone: '+385 92 234 5678',
            fees: {
              cleaning: 72.3,
              loan: 140,
              reservePerSqm: 1.6,
            },
            apartments: [
              { id: '4', number: '2', area: 78, floor: 1, rooms: 3, owner: 'Ivana Kovač', tenant: 'Ivana Kovač', contact: '+385 91 456 7890', email: 'kovac.ivana@gmail.com', phone: '+385 91 456 7890', debt: 234.50, reserve: 0, transactions: [] },
            ],
            debt: 234.50,
            reserve: 0,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Split',
    totalApartments: 38,
    totalDebt: 578.50,
    streets: [
      {
        id: '3',
        name: 'Marmontova',
        buildings: [
          {
            id: '3',
            name: '12',
            number: '12',
            iban: 'HR8765432109876543210',
            oib: '98765432109',
            representative: 'Horvat Petar',
            representativePhone: '+385 93 345 6789',
            fees: {
              cleaning: 88,
              loan: 0,
              reservePerSqm: 2.1,
            },
            apartments: [
              { id: '5', number: '5', area: 95, floor: 2, rooms: 4, owner: 'Marko Novak', tenant: 'Marko Novak', contact: '+385 92 567 8901', email: 'marko.novak@gmail.com', phone: '+385 92 567 8901', debt: 0, reserve: 950.00, transactions: [] },
            ],
            debt: 0,
            reserve: 950.00,
          },
        ],
      },
      {
        id: '4',
        name: 'Dioklecijanova',
        buildings: [
          {
            id: '6',
            name: '5',
            number: '5',
            iban: 'HR5555555555555555555',
            oib: '55555555555',
            representative: 'Jurić Lucija',
            representativePhone: '',
            fees: {
              cleaning: 60,
              loan: 90,
              reservePerSqm: 1.45,
            },
            apartments: [
              { id: '6', number: '2', area: 70, floor: 1, rooms: 3, owner: 'Lucija Jurić', tenant: 'Lucija Jurić', contact: '', email: 'lucija.juric@gmail.com', phone: '', debt: 0, reserve: 704.50, transactions: [] },
            ],
            debt: 0,
            reserve: 704.50,
          },
        ],
      },
    ],
  },
];

// Fetch all cities with nested data
export const useCities = () => {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_CITIES_DATA;
    },
  });
};

// City CRUD
export const useCreateCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof citySchema>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof citySchema> }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
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
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Grad obrisan", description: "Grad je uspješno obrisan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati grad.", variant: "destructive" });
    },
  });
};

// Street CRUD
export const useCreateStreet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cityId, data }: { cityId: string; data: z.infer<typeof streetSchema> }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof streetSchema> }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Ulica obrisana", description: "Ulica je uspješno obrisana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati ulicu.", variant: "destructive" });
    },
  });
};

// Building CRUD
export const useCreateBuilding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ streetId, data }: { streetId: string; data: z.infer<typeof buildingSchema> }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof buildingSchema> }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
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
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Zgrada obrisana", description: "Zgrada je uspješno obrisana." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati zgradu.", variant: "destructive" });
    },
  });
};

// Apartment CRUD
export const useCreateApartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ buildingId, data }: { buildingId: string; data: any }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
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
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({ title: "Stan obrisan", description: "Stan je uspješno obrisan." });
    },
    onError: () => {
      toast({ title: "Greška", description: "Nije moguće obrisati stan.", variant: "destructive" });
    },
  });
};
