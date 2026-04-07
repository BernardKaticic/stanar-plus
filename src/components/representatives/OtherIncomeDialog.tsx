import { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { representativesApi } from "@/lib/api";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [recipientComboboxOpen, setRecipientComboboxOpen] = useState(false);
  const { data: representativesResponse = [] } = useQuery({
    queryKey: ["representatives", "other-income-recipient"],
    queryFn: () => representativesApi.getAll(),
    enabled: open,
  });
  const recipients = (Array.isArray(representativesResponse) ? representativesResponse : [])
    .map((r: any) => ({
      id: String(r?.id || ""),
      name: String(r?.name || ""),
      iban: typeof r?.iban === "string" ? r.iban : "",
    }))
    .filter((r) => r.id && r.name);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { recipientId: "", name: "", service: "", frequency: "monthly", amount: "", iban: "" },
  });
  const selectedRecipientId = watch("recipientId");
  const selectedRecipient = recipients.find((r) => r.id === String(selectedRecipientId));

  useEffect(() => {
    if (editItem) {
      const matched = recipients.find((r) => r.name.trim().toLowerCase() === (editItem.name || "").trim().toLowerCase());
      reset({
        recipientId: matched?.id || "",
        name: editItem.name || "",
        service: editItem.service || "",
        frequency: editItem.frequency || "monthly",
        amount: editItem.amount?.replace(/[^\d,]/g, "").replace(",", ".") || "",
        iban: editItem.iban || "",
      });
    } else {
      reset({ recipientId: "", name: "", service: "", frequency: "monthly", amount: "", iban: "" });
    }
  }, [editItem, open, recipients, reset]);

  useEffect(() => {
    if (!selectedRecipient) return;
    setValue("name", selectedRecipient.name, { shouldDirty: true });
    if (!watch("iban") && selectedRecipient.iban) {
      setValue("iban", selectedRecipient.iban, { shouldDirty: true });
    }
  }, [selectedRecipient, setValue, watch]);

  const onSubmit = (data: { recipientId: string; name: string; service: string; frequency: string; amount: string; iban: string }) => {
    if (!selectedRecipient) return;
    onSave({
      name: selectedRecipient.name,
      service: data.service,
      frequency: data.frequency,
      amount: parseFloat(String(data.amount || "0").replace(",", ".")),
      iban: data.iban || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi dohodak" : "Dodaj dohodak"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSection>
            <div className="space-y-2">
              <Label>Primatelj dohotka (predstavnik)</Label>
              <Popover open={recipientComboboxOpen} onOpenChange={setRecipientComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={recipientComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedRecipient?.name || "Odaberi predstavnika"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pretraži predstavnika..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {recipients.map((r) => (
                          <CommandItem
                            key={r.id}
                            value={r.name}
                            onSelect={() => {
                              setValue("recipientId", r.id, { shouldDirty: true });
                              setRecipientComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                String(selectedRecipientId) === String(r.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{r.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label>Ime i prezime</Label>
                <Input value={selectedRecipient?.name || "—"} disabled className="w-full" />
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
            <Button type="submit" disabled={isPending || !selectedRecipient}>
              {isPending ? "Spremanje..." : editItem ? "Spremi" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
