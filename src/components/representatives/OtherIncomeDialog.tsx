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

const FREQUENCIES = [
  { value: "monthly", label: "Mjesečno" },
  { value: "quarterly", label: "Kvartalno" },
  { value: "semi_annual", label: "Polugodišnje" },
  { value: "annual", label: "Godišnje" },
];

interface OtherIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  editItem?: { id: string; name: string; service: string; frequency: string; amount: string; iban?: string } | null;
}

export const OtherIncomeDialog = ({ open, onOpenChange, onSave, editItem }: OtherIncomeDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: "", service: "", frequency: "monthly", amount: "", iban: "" },
  });

  useEffect(() => {
    if (editItem) {
      reset({
        name: editItem.name || "",
        service: editItem.service || "",
        frequency: editItem.frequency || "monthly",
        amount: editItem.amount?.replace(/[^\d,]/g, "").replace(",", ".") || "",
        iban: editItem.iban || "",
      });
    } else {
      reset({ name: "", service: "", frequency: "monthly", amount: "", iban: "" });
    }
  }, [editItem, open, reset]);

  const onSubmit = (data: any) => {
    onSave({
      name: data.name,
      service: data.service,
      frequency: data.frequency,
      amount: parseFloat(String(data.amount || "0").replace(",", ".")),
      iban: data.iban || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi dohodak" : "Dodaj novi dohodak"}</DialogTitle>
          <DialogDescription>Periodične isplate (upravitelji, čišćenje, revizija...)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Naziv / Ime</Label>
            <Input {...register("name", { required: true })} placeholder="npr. Košir Josip" />
          </div>
          <div>
            <Label>Usluga</Label>
            <Input {...register("service", { required: true })} placeholder="npr. Održavanje lifta" />
          </div>
          <div>
            <Label>Učestalost</Label>
            <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Iznos (€)</Label>
            <Input {...register("amount", { required: true })} type="number" step="0.01" placeholder="200" />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input {...register("iban")} placeholder="HR..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Odustani</Button>
            <Button type="submit">{editItem ? "Spremi" : "Dodaj"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
