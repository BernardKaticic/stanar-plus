import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";

const apartmentSchema = z.object({
  number: z.string().trim().min(1, "Broj stana je obavezan").max(20, "Broj stana je predug"),
  area: z.string().trim().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Površina mora biti pozitivan broj",
  }),
  owner: z.string().trim().max(200, "Ime vlasnika je predugo").optional(),
  tenant: z.string().trim().max(200, "Ime stanara je predugo").optional(),
  contact: z.string().trim().max(100, "Kontakt je predug").optional(),
  email: z.string().trim().email("Neispravna email adresa").max(255, "Email je predug").optional().or(z.literal("")),
  phone: z.string().trim().max(50, "Telefon je predug").optional(),
  notes: z.string().trim().max(1000, "Bilješke su predugo").optional(),
});

type ApartmentFormData = z.infer<typeof apartmentSchema>;

interface BuildingFees {
  cleaning: number;
  loan: number;
  reservePerSqm: number;
}

interface Apartment {
  id: string;
  number: string;
  area: number;
  owner?: string;
  tenant?: string;
  contact?: string;
  email?: string;
  phone?: string;
  debt: number;
  reserve: number;
  notes?: string;
}

interface ApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Apartment, 'id' | 'debt' | 'reserve'>) => void;
  editApartment?: Apartment | null;
  buildingName: string;
  fees?: BuildingFees;
}

export const ApartmentDialog = ({
  open,
  onOpenChange,
  onSave,
  editApartment,
  buildingName,
  fees,
}: ApartmentDialogProps) => {
  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      number: "",
      area: "",
      owner: "",
      tenant: "",
      contact: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editApartment) {
      form.reset({
        number: editApartment.number,
        area: editApartment.area.toString(),
        owner: editApartment.owner || "",
        tenant: editApartment.tenant || "",
        contact: editApartment.contact || "",
        email: editApartment.email || "",
        phone: editApartment.phone || "",
        notes: editApartment.notes || "",
      });
    } else {
      form.reset({
        number: "",
        area: "",
        owner: "",
        tenant: "",
        contact: "",
        email: "",
        phone: "",
        notes: "",
      });
    }
  }, [editApartment, form, open]);

  const rawArea = form.watch("area");
  const areaValue = parseFloat(rawArea || "0");
  const hasValidArea = !Number.isNaN(areaValue) && areaValue > 0;
  const reserveCharge = fees && hasValidArea ? fees.reservePerSqm * areaValue : 0;
  const loanCharge = fees && hasValidArea ? fees.loan * areaValue : 0;
  const totalCharge = fees ? reserveCharge + loanCharge + fees.cleaning : 0;

  const onSubmit = (data: ApartmentFormData) => {
    onSave({
      number: data.number,
      area: Number(data.area),
      owner: data.owner || undefined,
      tenant: data.tenant || undefined,
      contact: data.contact || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editApartment ? "Uredi stan" : "Dodaj stan"} - Ulaz {buildingName}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broj stana *</FormLabel>
                    <FormControl>
                      <Input placeholder="1, 2A, prizemlje..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Površina (m²) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="45.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {fees && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Procjena mjesečnih naknada
                </h4>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Čišćenje</span>
                    <span className="font-medium">
                      {fees.cleaning.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kredit</span>
                    <span className="font-medium">
                      {hasValidArea
                        ? loanCharge.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "-"} € ({fees.loan.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/m²)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pričuva</span>
                    <span className="font-medium">
                      {hasValidArea
                        ? reserveCharge.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "-"} € ({fees.reservePerSqm.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/m²)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ukupno mjesečno</span>
                    <span className="font-semibold">
                      {hasValidArea
                        ? totalCharge.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "-"} €
                    </span>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vlasnik</FormLabel>
                  <FormControl>
                    <Input placeholder="Ime i prezime vlasnika" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stanar</FormLabel>
                  <FormControl>
                    <Input placeholder="Ime i prezime stanara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+385 91 234 5678" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dodatni kontakt</FormLabel>
                  <FormControl>
                    <Input placeholder="Alternativni kontakt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bilješke</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Dodatne informacije o stanu..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" className="min-h-[32px]" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit" className="min-h-[32px]">
                {editApartment ? "Spremi" : "Dodaj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
