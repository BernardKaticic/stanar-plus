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
import { useEffect } from "react";
import { citySchema } from "@/hooks/useBuildingsData";

type CityFormData = z.infer<typeof citySchema>;

interface CityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CityFormData) => void;
  editCity?: { id: string; name: string } | null;
  isPending?: boolean;
}

export const CityDialog = ({ open, onOpenChange, onSave, editCity, isPending }: CityDialogProps) => {
  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(editCity ? { name: editCity.name } : { name: "" });
    }
  }, [open, editCity, form]);

  const handleSubmit = (data: CityFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editCity ? "Uredi grad" : "Dodaj novi grad"}</DialogTitle>
          <DialogDescription>
            {editCity ? "Izmijeni podatke grada." : "Unesite naziv novog grada."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Naziv grada</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Vinkovci" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Spremanje..." : editCity ? "Spremi" : "Dodaj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
