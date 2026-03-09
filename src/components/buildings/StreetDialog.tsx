import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormSection,
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
  isPending?: boolean;
}

export const StreetDialog = ({ open, onOpenChange, onSave, editStreet, cityName, isPending }: StreetDialogProps) => {
  const form = useForm<StreetFormData>({
    resolver: zodResolver(streetSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(editStreet ? { name: editStreet.name } : { name: "" });
    }
  }, [open, editStreet, form]);

  const handleSubmit = (data: StreetFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editStreet ? "Uredi ulicu" : "Dodaj novu ulicu"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormSection>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Naziv ulice</FormLabel>
                    <FormControl>
                      <Input placeholder="Npr. Trg kralja Tomislava" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Spremanje..." : editStreet ? "Spremi" : "Dodaj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
