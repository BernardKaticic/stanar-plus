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
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apartmentsApi } from "@/lib/api";
import { ApartmentMultiSelect } from "./ApartmentMultiSelect";

const addApartmentSchema = z.object({
  apartment_ids: z.array(z.string()).min(1, "Odaberi barem jedan stan"),
});

type AddApartmentFormData = z.infer<typeof addApartmentSchema>;

interface PersonForAddApartment {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  apartments: { apartmentId: string }[];
}

interface AddApartmentToPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: PersonForAddApartment | null;
  onSave: (apartmentIds: string[]) => Promise<void>;
  isPending?: boolean;
}

export const AddApartmentToPersonDialog = ({
  open,
  onOpenChange,
  person,
  onSave,
  isPending,
}: AddApartmentToPersonDialogProps) => {
  const form = useForm<AddApartmentFormData>({
    resolver: zodResolver(addApartmentSchema),
    defaultValues: { apartment_ids: [] },
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentsApi.getAll(),
    enabled: open,
  });

  // Samo prazni stanovi (has_tenant false) - ApartmentMultiSelect filtrira; person stanovi su zauzeti pa ih neće pokazati

  const handleSubmit = async (data: AddApartmentFormData) => {
    await onSave(data.apartment_ids);
    form.reset({ apartment_ids: [] });
    onOpenChange(false);
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,28rem)] overflow-y-auto p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg">Dodaj stan suvlasniku</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Odaberi stanove za <strong>{person.name}</strong>. Osoba će biti dodana kao suvlasnik odabranih stanova.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="apartment_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Stanovi</FormLabel>
                  <ApartmentMultiSelect
                    apartments={apartments}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Pretraži i odaberi prazne stanove..."
                    emptyMessage="Nema slobodnih stanova za dodavanje"
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
              <Button
                type="submit"
                disabled={isPending || (form.watch("apartment_ids") || []).length === 0}
              >
                {isPending ? "Dodavanje..." : "Dodaj stanove"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
