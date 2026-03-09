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

const FREQUENCIES = [
  { value: "monthly", label: "Mjesečno" },
  { value: "quarterly", label: "Kvartalno" },
  { value: "semi_annual", label: "Polugodišnje" },
  { value: "annual", label: "Godišnje" },
];

export interface OtherIncomeFormData {
  name: string;
  service: string;
  frequency: string;
  amount: number;
  iban: string | null;
}

interface OtherIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: OtherIncomeFormData) => void;
  editItem?: { id: string; name: string; service: string; frequency: string; amount: string; iban?: string } | null;
  isPending?: boolean;
}

export const OtherIncomeDialog = ({ open, onOpenChange, onSave, editItem, isPending }: OtherIncomeDialogProps) => {
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

  const onSubmit = (data: { name: string; service: string; frequency: string; amount: string; iban: string }) => {
    onSave({
      name: data.name,
      service: data.service,
      frequency: data.frequency,
      amount: parseFloat(String(data.amount || "0").replace(",", ".")),
      iban: data.iban || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi dohodak" : "Dodaj dohodak"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Naziv / Ime</Label>
                <Input {...register("name", { required: true })} placeholder="npr. Košir Josip" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Usluga</Label>
                <Input {...register("service", { required: true })} placeholder="npr. Održavanje lifta" className="w-full" />
              </div>
            </div>
          </FormSection>
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Učestalost</Label>
                <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Iznos (€)</Label>
                <Input {...register("amount", { required: true })} type="number" step="0.01" placeholder="200" className="w-full" />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>IBAN</Label>
              <Input {...register("iban")} placeholder="HR..." className="w-full" />
            </div>
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Odustani</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Spremanje..." : editItem ? "Spremi" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
