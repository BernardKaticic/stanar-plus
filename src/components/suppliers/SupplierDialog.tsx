import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Energija", "Komunalije", "Čišćenje", "Održavanje", "Ostalo"];

export interface SupplierFormData {
  name: string;
  category: string;
  email?: string;
  contact?: string;
  oib?: string;
  iban?: string;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SupplierFormData) => void;
  editItem?: { id: string; name: string; category: string; email?: string; contact?: string; oib?: string; iban?: string } | null;
  isPending?: boolean;
}

export const SupplierDialog = ({ open, onOpenChange, onSave, editItem, isPending }: SupplierDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      category: "Ostalo",
      email: "",
      contact: "",
      oib: "",
      iban: "",
    },
  });

  useEffect(() => {
    if (editItem) {
      reset({
        name: editItem.name || "",
        category: editItem.category || "Ostalo",
        email: editItem.email || "",
        contact: editItem.contact || "",
        oib: editItem.oib || "",
        iban: editItem.iban || "",
      });
    } else {
      reset({ name: "", category: "Ostalo", email: "", contact: "", oib: "", iban: "" });
    }
  }, [editItem, open, reset]);

  const onSubmit = (data: SupplierFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi dobavljača" : "Dodaj dobavljača"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Naziv</Label>
                <Input {...register("name", { required: true })} placeholder="npr. HEP d.o.o." className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Kategorija</Label>
                <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input {...register("email")} type="email" placeholder="info@firma.hr" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Kontakt</Label>
                <Input {...register("contact")} placeholder="+385 1 123 4567" className="w-full" />
              </div>
            </div>
          </FormSection>
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>OIB</Label>
                <Input {...register("oib")} placeholder="11 znamenki" maxLength={11} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input {...register("iban")} placeholder="HR..." className="w-full" />
              </div>
            </div>
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Odustani
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Spremanje..." : editItem ? "Spremi" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
