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

const tenantSchema = z.object({
  name: z.string().trim().min(1, "Ime je obavezno").max(200, "Ime je predugačko"),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email("Neispravna email adresa").max(255).optional()),
  phone: z.string().trim().max(50, "Broj telefona je predugačak").optional(),
  apartment_id: z.string().min(1, "Stan je obavezan"),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TenantFormData) => void;
}

export const TenantDialog = ({ open, onOpenChange, onSave }: TenantDialogProps) => {
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      apartment_id: "",
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
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj suvlasnika</DialogTitle>
          <DialogDescription>
            Unesite podatke o novom suvlasniku i dodijelite mu stan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime i prezime</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Marko Marić" {...field} />
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
                  <FormLabel>Email adresa (opcionalno)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="npr@primjer.hr" {...field} />
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
                  <FormLabel>Broj telefona (opcionalno)</FormLabel>
                  <FormControl>
                    <Input placeholder="+385 91 234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apartment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dodjeli stan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite slobodan stan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apartments.map((apt: any) => {
                        const b = apt.buildings || apt.building;
                        const city = b?.streets?.cities?.name || b?.street?.city?.name || "";
                        const street = b?.streets?.name || b?.street?.name || "";
                        const num = b?.number || "";
                        const addr = [city, street, num].filter(Boolean).join(" - ");
                        return (
                          <SelectItem key={apt.id} value={apt.id}>
                            {addr ? `${addr}, Stan ${apt.apartment_number}` : `Stan ${apt.apartment_number}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">Dodaj suvlasnika</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
