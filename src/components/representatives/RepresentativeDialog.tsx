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
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api";

interface RepresentativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  editItem?: { id: string; buildingId: string; name: string; email?: string; phone?: string; oib?: string; iban?: string; monthlyIncome?: string; status?: string } | null;
  isPending?: boolean;
}

export const RepresentativeDialog = ({ open, onOpenChange, onSave, editItem, isPending }: RepresentativeDialogProps) => {
  const { data: buildings = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
    enabled: open,
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      buildingId: "",
      name: "",
      email: "",
      phone: "",
      oib: "",
      iban: "",
      monthlyIncome: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (editItem) {
      reset({
        buildingId: editItem.buildingId || "",
        name: editItem.name || "",
        email: editItem.email || "",
        phone: editItem.phone || "",
        oib: editItem.oib || "",
        iban: editItem.iban || "",
        monthlyIncome: editItem.monthlyIncome?.replace(/[^\d,]/g, "").replace(",", ".") || "",
        status: editItem.status || "active",
      });
    } else {
      reset({ buildingId: "", name: "", email: "", phone: "", oib: "", iban: "", monthlyIncome: "", status: "active" });
    }
  }, [editItem, open, reset]);

  const onSubmit = (data: any) => {
    const monthlyIncome = parseFloat(String(data.monthlyIncome || "0").replace(",", "."));
    onSave({
      ...data,
      buildingId: data.buildingId?.replace("building-", "") || data.buildingId,
      monthlyIncome: isNaN(monthlyIncome) ? 0 : monthlyIncome,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi predstavnika" : "Dodaj predstavnika"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Izmijeni podatke predstavnika." : "Unesite podatke novog predstavnika."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editItem && (
            <div className="space-y-2">
              <Label>Zgrada</Label>
              <Select
                value={watch("buildingId")}
                onValueChange={(v) => setValue("buildingId", v)}
                required={!editItem}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Odaberi zgradu" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b: any) => (
                    <SelectItem key={b.id} value={b.id?.replace?.("building-", "") || b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ime i prezime</Label>
              <Input {...register("name", { required: true })} placeholder="npr. Mato Aleric" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input {...register("email")} type="email" placeholder="email@example.com" className="w-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input {...register("phone")} placeholder="+385 91 123 4567" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>OIB</Label>
              <Input {...register("oib")} placeholder="11 znamenki" maxLength={11} className="w-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input {...register("iban")} placeholder="HR..." className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>Mjesečni dohodak (€)</Label>
              <Input {...register("monthlyIncome")} placeholder="150" type="number" step="0.01" className="w-full" />
            </div>
          </div>
          {editItem && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktivan</SelectItem>
                  <SelectItem value="inactive">Neaktivan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
