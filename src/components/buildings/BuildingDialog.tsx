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
import { buildingSchema } from "@/hooks/useBuildingsData";

type BuildingFormData = z.infer<typeof buildingSchema>;

interface BuildingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BuildingFormData) => void;
  editBuilding?: { id: string; name: string } | null;
  streetName: string;
}

export const BuildingDialog = ({ open, onOpenChange, onSave, editBuilding, streetName }: BuildingDialogProps) => {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      number: "",
      name: "",
    },
  });

  useEffect(() => {
    if (editBuilding) {
      form.reset({
        number: editBuilding.name,
        name: "",
      });
    } else {
      form.reset({ number: "", name: "" });
    }
  }, [editBuilding, form]);

  const handleSubmit = (data: BuildingFormData) => {
    onSave({ name: data.number });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editBuilding ? "Uredi ulaz" : "Dodaj novi ulaz"}</DialogTitle>
          <DialogDescription>
            {editBuilding ? `Izmijeni podatke ulaza na ulici ${streetName}.` : `Dodaj novi ulaz na ulicu ${streetName}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj/naziv ulaza</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. 15A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">{editBuilding ? "Spremi" : "Dodaj"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
