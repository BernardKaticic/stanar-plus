import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Energija", "Komunalije", "Čišćenje", "Održavanje", "Ostalo"];

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  editItem?: { id: string; name: string; category: string; email?: string; contact?: string; oib?: string; iban?: string } | null;
}

export const SupplierDialog = ({ open, onOpenChange, onSave, editItem }: SupplierDialogProps) => {
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

  const onSubmit = (data: any) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi dobavljača" : "Dodaj dobavljača"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Izmijeni podatke dobavljača." : "Unesite podatke novog dobavljača."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Naziv</Label>
            <Input {...register("name", { required: true })} placeholder="npr. HEP d.o.o." />
          </div>
          <div>
            <Label>Kategorija</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger>
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
          <div>
            <Label>E-mail</Label>
            <Input {...register("email")} type="email" placeholder="info@firma.hr" />
          </div>
          <div>
            <Label>Kontakt</Label>
            <Input {...register("contact")} placeholder="+385 1 123 4567" />
          </div>
          <div>
            <Label>OIB</Label>
            <Input {...register("oib")} placeholder="11 znamenki" maxLength={11} />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input {...register("iban")} placeholder="HR..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button type="submit">{editItem ? "Spremi" : "Dodaj"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
