import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apartmentsApi } from "@/lib/api";

const NONE_APARTMENT = "__none__";

const tenantEditSchema = z.object({
  name: z.string().trim().min(1, "Ime je obavezno").max(200, "Ime je predugačko"),
  oib: z.string().trim().max(11, "OIB ima 11 znamenki").optional().or(z.literal("")),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email("Neispravna email adresa").max(255).optional()),
  phone: z.string().trim().max(50, "Broj telefona je predugačak").optional(),
  apartment_id: z.string().optional(),
  delivery_method: z.enum(["email", "pošta", "both"]).optional(),
});

type TenantEditFormData = z.infer<typeof tenantEditSchema>;

interface TenantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    oib?: string | null;
    email?: string;
    phone?: string;
    apartment_id?: string | null;
    deliveryMethod?: string | null;
  } | null;
  onSave: (data: TenantEditFormData) => void;
  isPending?: boolean;
}

export const TenantEditDialog = ({
  open,
  onOpenChange,
  tenant,
  onSave,
  isPending,
}: TenantEditDialogProps) => {
  const form = useForm<TenantEditFormData>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues: {
      name: "",
      oib: "",
      email: "",
      phone: "",
      apartment_id: "",
      delivery_method: "email" as const,
    },
  });

  const { data: allApartments = [] } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentsApi.getAll(),
    enabled: open,
  });

  // Prikaži samo prazne stanove + trenutni stan ovog suvlasnika (ako ga mijenjamo)
  const apartments = allApartments.filter(
    (apt: { id: string; has_tenant?: boolean }) =>
      !apt.has_tenant || (tenant?.apartment_id && apt.id === tenant.apartment_id)
  );

  useEffect(() => {
    if (tenant && open) {
      form.reset({
        name: tenant.name || "",
        oib: tenant.oib || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        apartment_id: tenant.apartment_id || NONE_APARTMENT,
        delivery_method:
          tenant.deliveryMethod === "pošta" ||
          tenant.deliveryMethod === "email" ||
          tenant.deliveryMethod === "both"
            ? tenant.deliveryMethod
            : "email",
      });
    }
  }, [tenant, open]);

  const handleSubmit = (data: TenantEditFormData) => {
    onSave({
      ...data,
      oib: data.oib?.trim() || null,
      apartment_id: data.apartment_id && data.apartment_id !== NONE_APARTMENT ? data.apartment_id : null,
      delivery_method: data.delivery_method || null,
    });
  };

  if (!tenant) return null;

  const formatApartmentLabel = (apt: any) => {
    const b = apt.buildings || apt.building;
    const city = b?.streets?.cities?.name || b?.street?.city?.name || "";
    const street = b?.streets?.name || b?.street?.name || "";
    const num = b?.number || "";
    const addr = [city, street, num].filter(Boolean).join(", ");
    return addr ? `${addr}, Stan ${apt.apartment_number}` : `Stan ${apt.apartment_number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,28rem)] overflow-y-auto p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg">Uredi suvlasnika</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Promijenite podatke ili dodijelite drugi stan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Ime i prezime *</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Marko Marić" {...field} className="min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="oib"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">OIB</FormLabel>
                  <FormControl>
                    <Input placeholder="11 znamenki (opcionalno)" {...field} className="min-w-0 font-mono" maxLength={11} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="npr@primjer.hr (opcionalno)" {...field} className="min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+385 91 234 5678 (opcionalno)" {...field} className="min-w-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delivery_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Način dostave</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "email"}
                  >
                    <FormControl>
                      <SelectTrigger className="min-w-0">
                        <SelectValue placeholder="Odaberite način" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="pošta">Pošta</SelectItem>
                      <SelectItem value="both">E-mail i pošta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apartment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Stan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || NONE_APARTMENT}
                  >
                    <FormControl>
                      <SelectTrigger className="min-w-0">
                        <SelectValue placeholder="Odaberite stan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[min(16rem,50vh)] min-w-[var(--radix-select-trigger-width)] max-w-[min(22rem,95vw)]">
                      <SelectItem value={NONE_APARTMENT} className="py-2">
                        — Nije dodijeljen —
                      </SelectItem>
                      {apartments.map((apt: any) => {
                        const label = formatApartmentLabel(apt);
                        return (
                          <SelectItem key={apt.id} value={apt.id} className="py-2.5">
                            <span className="block min-w-0 truncate pr-2" title={label}>{label}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Spremanje..." : "Spremi promjene"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
