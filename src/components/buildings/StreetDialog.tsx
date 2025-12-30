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
import { streetSchema } from "@/hooks/useBuildingsData";

type StreetFormData = z.infer<typeof streetSchema>;

interface StreetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StreetFormData) => void;
  editStreet?: { id: string; name: string } | null;
  cityName: string;
}

export const StreetDialog = ({ open, onOpenChange, onSave, editStreet, cityName }: StreetDialogProps) => {
  const form = useForm<StreetFormData>({
    resolver: zodResolver(streetSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (editStreet) {
      form.reset({ name: editStreet.name });
    } else {
      form.reset({ name: "" });
    }
  }, [editStreet, form]);

  const handleSubmit = (data: StreetFormData) => {
    onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editStreet ? "Uredi ulicu" : "Dodaj novu ulicu"}</DialogTitle>
          <DialogDescription>
            {editStreet ? `Izmijeni podatke ulice u gradu ${cityName}.` : `Dodaj novu ulicu u grad ${cityName}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv ulice</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. Trg kralja Tomislava" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">{editStreet ? "Spremi" : "Dodaj"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
