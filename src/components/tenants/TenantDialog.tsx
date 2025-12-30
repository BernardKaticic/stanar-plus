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

const tenantSchema = z.object({
  email: z.string().trim().email("Neispravna email adresa").max(255, "Email je predugačak"),
  full_name: z.string().trim().min(1, "Ime je obavezno").max(100, "Ime je predugačko"),
  phone: z.string().trim().max(20, "Broj telefona je predugačak").optional(),
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
      email: "",
      full_name: "",
      phone: "",
      apartment_id: "",
    },
  });

  const { data: apartments } = useQuery({
    queryKey: ["available-apartments"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: '3', apartment_number: '3', tenant_id: null, building: { number: '15', name: null, street: { name: 'Antuna Starčevića', city: { name: 'Vinkovci' } } } },
        { id: '6', apartment_number: '1', tenant_id: null, building: { number: '7', name: null, street: { name: 'Ohridska', city: { name: 'Vinkovci' } } } },
        { id: '7', apartment_number: '4', tenant_id: null, building: { number: '12', name: null, street: { name: 'Marmontova', city: { name: 'Split' } } } },
      ];
    },
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
          <DialogTitle>Dodaj novog stanara</DialogTitle>
          <DialogDescription>
            Unesite podatke o novom stanaru i dodijelite mu stan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
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
                  <FormLabel>Email adresa</FormLabel>
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
                      {apartments?.map((apt) => (
                        <SelectItem key={apt.id} value={apt.id}>
                          {apt.building?.street?.city?.name} - {apt.building?.street?.name} {apt.building?.number}, Stan {apt.apartment_number}
                        </SelectItem>
                      ))}
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
              <Button type="submit">Dodaj stanara</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
