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
import { ApartmentMultiSelect } from "./ApartmentMultiSelect";

const tenantSchema = z.object({
  name: z.string().trim().min(1, "Ime je obavezno").max(200, "Ime je predugačko"),
  oib: z.string().trim().max(11, "OIB ima 11 znamenki").optional().or(z.literal("")),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email("Neispravna email adresa").max(255).optional()),
  phone: z.string().trim().max(50, "Broj telefona je predugačak").optional(),
  apartment_ids: z.array(z.string()).min(1, "Odaberi barem jedan stan"),
  delivery_method: z.enum(["email", "pošta", "both"]).optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TenantFormData) => void;
  isPending?: boolean;
}

export const TenantDialog = ({ open, onOpenChange, onSave, isPending }: TenantDialogProps) => {
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      oib: "",
      email: "",
      phone: "",
      apartment_ids: [],
      delivery_method: "email" as const,
    },
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentsApi.getAll(),
    enabled: open,
  });

  const handleSubmit = (data: TenantFormData) => {
    onSave(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,28rem)] overflow-y-auto p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg">Dodaj suvlasnika</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Unesite podatke i odaberite stanove. Možete odabrati više stanova za istu osobu. Email kreira račun za web pristup.
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
                  <Select onValueChange={field.onChange} value={field.value || "email"}>
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
              name="apartment_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Stanovi *</FormLabel>
                  <ApartmentMultiSelect
                    apartments={apartments}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Pretraži i odaberi prazne stanove..."
                    emptyMessage="Nema slobodnih stanova"
                    emptyOnly
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Dodavanje..." : "Dodaj suvlasnika"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
