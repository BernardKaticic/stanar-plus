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
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { locationsApi, personsApi, type Person } from "@/lib/api";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type RepresentativeFormData = {
  buildingId: string;
  personId: string;
  iban?: string;
  monthlyIncome?: string;
  paymentFrequency: string;
};

type RepresentativePayload = {
  buildingId?: string;
  personId: string;
  name: string;
  email?: string;
  phone?: string;
  oib?: string;
  iban?: string;
  monthlyIncome: number;
  paymentFrequency?: string;
};

interface RepresentativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RepresentativePayload) => void;
  takenBuildingIds?: string[];
  editItem?: {
    id: string;
    personId?: string;
    buildingId: string;
    name: string;
    email?: string;
    phone?: string;
    oib?: string;
    iban?: string;
    monthlyIncome?: string;
    paymentFrequency?: string;
    status?: string;
  } | null;
  isPending?: boolean;
}

const PAYMENT_FREQUENCIES = [
  { value: "monthly", label: "Mjesečno" },
  { value: "quarterly", label: "Kvartalno" },
  { value: "semi_annual", label: "Polugodišnje" },
  { value: "annual", label: "Godišnje" },
];

export const RepresentativeDialog = ({
  open,
  onOpenChange,
  onSave,
  takenBuildingIds = [],
  editItem,
  isPending,
}: RepresentativeDialogProps) => {
  const [buildingComboboxOpen, setBuildingComboboxOpen] = useState(false);
  const [personComboboxOpen, setPersonComboboxOpen] = useState(false);
  const { data: buildingsResponse = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
    enabled: open,
  });
  const { data: personsResponse } = useQuery({
    queryKey: ["persons", "representative-picker"],
    queryFn: () => personsApi.getAll({ page: 1, pageSize: 1000 }),
    enabled: open,
  });
  const persons = ((personsResponse?.data ?? []) as Person[]).filter((p) => p.id && p.name);
  const buildings = (Array.isArray(buildingsResponse) ? buildingsResponse : [])
    .map((b: any) => ({
      id: String(b?.id?.replace?.("building-", "") || b?.id || ""),
      name: String(b?.name || ""),
    }))
    .filter((b) => b.id && b.name);
  const currentEditBuildingId = String(editItem?.buildingId || "").replace("building-", "");
  const availableBuildings = buildings.filter(
    (b) => !takenBuildingIds.includes(b.id) || (currentEditBuildingId !== "" && b.id === currentEditBuildingId)
  );

  const { register, handleSubmit, reset, setValue, watch } = useForm<RepresentativeFormData>({
    defaultValues: {
      buildingId: "",
      personId: "",
      iban: "",
      monthlyIncome: "",
      paymentFrequency: "monthly",
    },
  });
  const selectedPersonId = watch("personId");
  const selectedBuildingId = watch("buildingId");
  const selectedBuilding = buildings.find((b) => b.id === String(selectedBuildingId));
  const selectedPerson = persons.find((p) => String(p.id) === String(selectedPersonId));

  useEffect(() => {
    if (editItem) {
      reset({
        buildingId: editItem.buildingId || "",
        personId: editItem.personId || "",
        iban: editItem.iban || "",
        monthlyIncome: editItem.monthlyIncome?.replace(/[^\d,]/g, "").replace(",", ".") || "",
        paymentFrequency:
          editItem.paymentFrequency ||
          (["monthly", "quarterly", "semi_annual", "annual"].includes(editItem.status || "")
            ? String(editItem.status)
            : "monthly"),
      });
    } else {
      reset({ buildingId: "", personId: "", iban: "", monthlyIncome: "", paymentFrequency: "monthly" });
    }
  }, [editItem, open, reset]);

  useEffect(() => {
    if (!open || !editItem || selectedPersonId) return;
    const matched = persons.find(
      (p) =>
        p.name?.trim().toLowerCase() === (editItem.name || "").trim().toLowerCase() &&
        (p.oib || "").trim() === (editItem.oib || "").trim()
    );
    if (matched?.id) {
      setValue("personId", String(matched.id), { shouldDirty: false });
    }
  }, [editItem, open, persons, selectedPersonId, setValue]);

  const onSubmit = (data: RepresentativeFormData) => {
    if (!selectedPerson) return;
    const monthlyIncome = parseFloat(String(data.monthlyIncome || "0").replace(",", "."));
    onSave({
      personId: String(selectedPerson.id),
      name: selectedPerson.name,
      email: selectedPerson.email || undefined,
      phone: selectedPerson.phone || undefined,
      oib: selectedPerson.oib || undefined,
      iban: data.iban || undefined,
      buildingId: data.buildingId?.replace("building-", "") || data.buildingId,
      monthlyIncome: isNaN(monthlyIncome) ? 0 : monthlyIncome,
      paymentFrequency: data.paymentFrequency,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editItem ? "Uredi oznaku predstavnika" : "Označi suvlasnika kao predstavnika"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSection>
            <div className="space-y-2">
              <Label>Zgrada</Label>
              <Popover open={buildingComboboxOpen} onOpenChange={setBuildingComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={buildingComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedBuilding?.name || "Odaberi zgradu"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pretraži zgradu..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {availableBuildings.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setValue("buildingId", b.id, { shouldDirty: true });
                              setBuildingComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                String(selectedBuildingId) === String(b.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{b.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </FormSection>
          <FormSection>
            <div className="space-y-2">
              <Label>Suvlasnik (predstavnik)</Label>
              <Popover open={personComboboxOpen} onOpenChange={setPersonComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={personComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedPerson?.name || "Odaberi suvlasnika"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pretraži suvlasnika..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {persons.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.oib || ""} ${p.email || ""}`}
                            onSelect={() => {
                              setValue("personId", String(p.id), { shouldDirty: true });
                              setPersonComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                String(selectedPersonId) === String(p.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{p.name}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {[p.oib, p.email].filter(Boolean).join(" • ")}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </FormSection>
          <FormSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={selectedPerson?.email || "—"} disabled className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={selectedPerson?.phone || "—"} disabled className="w-full" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label>Ime i prezime</Label>
                <Input value={selectedPerson?.name || "—"} disabled className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>OIB</Label>
                <Input value={selectedPerson?.oib || "—"} disabled className="w-full" />
              </div>
            </div>
          </FormSection>
          <FormSection>
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
            <div className="space-y-2 mt-4">
              <Label>Način plaćanja</Label>
              <Select value={watch("paymentFrequency")} onValueChange={(v) => setValue("paymentFrequency", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Odustani
            </Button>
            <Button type="submit" disabled={isPending || !selectedPerson || !watch("buildingId")}>
              {isPending ? "Spremanje..." : editItem ? "Spremi" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
