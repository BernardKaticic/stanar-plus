import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { personsApi } from "@/lib/api";
import { useState } from "react";

const apartmentAddSchema = z.object({
  number: z.string().trim().min(1, "Broj stana je obavezan").max(20, "Broj stana je predug"),
  floor: z.string().trim().max(20, "Kat je predug").optional(),
  area: z.string().trim().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Površina mora biti pozitivan broj",
  }),
  ownerMode: z.enum(["existing", "new"]),
  personId: z.string().optional(),
  ownerName: z.string().trim().max(200, "Ime je predugo").optional(),
  ownerOib: z.string().trim().max(11, "OIB ima 11 znamenki").optional().or(z.literal("")),
  email: z.string().trim().email("Neispravna email adresa").max(255, "Email je predug").optional().or(z.literal("")),
  phone: z.string().trim().max(50, "Telefon je predug").optional(),
  delivery_method: z.enum(["email", "pošta", "both"]).optional(),
  notes: z.string().trim().max(1000, "Bilješke su predugo").optional(),
}).refine(
  (data) => {
    if (data.ownerMode === "existing") return !!data.personId;
    return true;
  },
  { message: "Odaberi suvlasnika iz liste.", path: ["personId"] }
);

const apartmentEditSchema = z.object({
  number: z.string().trim().min(1, "Broj stana je obavezan").max(20, "Broj stana je predug"),
  floor: z.string().trim().max(20, "Kat je predug").optional(),
  area: z.string().trim().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Površina mora biti pozitivan broj",
  }),
  personId: z.string().optional(),
  notes: z.string().trim().max(1000, "Bilješke su predugo").optional(),
});

type ApartmentAddFormData = z.infer<typeof apartmentAddSchema>;
type ApartmentEditFormData = z.infer<typeof apartmentEditSchema>;

interface BuildingFees {
  cleaning: number;
  loan: number;
  reservePerSqm: number;
  savingsFixed?: number;
  extraFixed?: number;
  electricityFixed?: number;
  savingsPerSqm?: number;
}

interface Apartment {
  id: string;
  number: string;
  area: number;
  owner?: string;
  tenant?: string;
  contact?: string;
  email?: string;
  phone?: string;
  debt: number;
  reserve: number;
  notes?: string;
  tenant_id?: string;
}

interface ApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ApartmentFormPayload) => void;
  editApartment?: Apartment | null;
  buildingName: string;
  fees?: BuildingFees;
  isPending?: boolean;
}

export type ApartmentFormPayload =
  | { mode: "add"; number: string; floor?: string | null; area: number; personId?: string; tenantId?: string; ownerName?: string; ownerOib?: string; email?: string; phone?: string; delivery_method?: "email" | "pošta" | "both"; notes?: string }
  | { mode: "edit"; number: string; floor?: string | null; area: number; personId?: string; tenantId?: string; notes?: string };

export const ApartmentDialog = ({
  open,
  onOpenChange,
  onSave,
  editApartment,
  buildingName,
  fees,
  isPending,
}: ApartmentDialogProps) => {
  const isEdit = !!editApartment;

  const addForm = useForm<ApartmentAddFormData>({
    resolver: zodResolver(apartmentAddSchema),
    defaultValues: {
      number: "",
      floor: "",
      area: "",
      ownerMode: "new",
      personId: "",
      ownerName: "",
      email: "",
      phone: "",
      delivery_method: "email",
      notes: "",
    },
  });

  const editForm = useForm<ApartmentEditFormData>({
    resolver: zodResolver(apartmentEditSchema),
    defaultValues: {
      number: "",
      floor: "",
      area: "",
      personId: "",
      notes: "",
    },
  });

  const { data: personsData } = useQuery({
    queryKey: ["persons", "list"],
    queryFn: () => personsApi.getAll({ pageSize: 500 }),
    enabled: open,
  });

  const persons = personsData?.data ?? [];
  const [tenantComboboxOpen, setTenantComboboxOpen] = useState(false);

  useEffect(() => {
    if (editApartment && open) {
      const tenantId = (editApartment as Apartment & { tenant_id?: string }).tenant_id;
      const matchingPerson = tenantId && persons.length
        ? persons.find((p: { apartments?: { tenantId?: string }[] }) =>
            p.apartments?.some((a) => a.tenantId === tenantId)
          )
        : null;
      const aptWithFloor = editApartment as Apartment & { floor?: string | null };
      editForm.reset({
        number: editApartment.number,
        floor: aptWithFloor.floor ?? "",
        area: editApartment.area.toString(),
        personId: matchingPerson?.id ?? "",
        notes: editApartment.notes || "",
      });
    } else if (!editApartment && open) {
      addForm.reset({
        number: "",
        floor: "",
        area: "",
        ownerMode: "new",
        personId: "",
        ownerName: "",
        ownerOib: "",
        email: "",
        phone: "",
        delivery_method: "email",
        notes: "",
      });
    }
    // personsData (ne persons) da izbjegnemo novi [] ref svaki render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editApartment?.id, open, personsData]);

  const form = isEdit ? editForm : addForm;
  const rawArea = form.watch("area");
  const areaValue = parseFloat(rawArea || "0");
  const hasValidArea = !Number.isNaN(areaValue) && areaValue > 0;
  const reserveCharge = fees && hasValidArea ? (fees.reservePerSqm ?? 0) * areaValue : 0;
  const loanCharge = fees && hasValidArea ? (fees.loan ?? 0) * areaValue : 0;
  const savingsPerSqmCharge = fees && hasValidArea ? (fees.savingsPerSqm ?? 0) * areaValue : 0;
  const fixedFees = fees
    ? (fees.cleaning ?? 0) + (fees.savingsFixed ?? 0) + (fees.extraFixed ?? 0) + (fees.electricityFixed ?? 0)
    : 0;
  const totalCharge = fees ? reserveCharge + loanCharge + savingsPerSqmCharge + fixedFees : 0;

  const onSubmitAdd = (data: ApartmentAddFormData) => {
    onSave({
      mode: "add",
      number: data.number,
      floor: data.floor?.trim() || null,
      area: Number(data.area),
      personId: data.ownerMode === "existing" ? data.personId : undefined,
      ownerName: data.ownerMode === "new" ? data.ownerName || undefined : undefined,
      ownerOib: data.ownerMode === "new" ? (data.ownerOib?.trim() || undefined) : undefined,
      email: data.ownerMode === "new" ? data.email || undefined : undefined,
      phone: data.ownerMode === "new" ? data.phone || undefined : undefined,
      delivery_method: data.ownerMode === "new" ? data.delivery_method : undefined,
      notes: data.notes || undefined,
    });
  };

  const onSubmitEdit = (data: ApartmentEditFormData) => {
    onSave({
      mode: "edit",
      number: data.number,
      floor: data.floor?.trim() || null,
      area: Number(data.area),
      personId: data.personId || undefined,
      notes: data.notes || undefined,
    });
  };

  const handleSubmit = isEdit
    ? form.handleSubmit(onSubmitEdit)
    : form.handleSubmit(onSubmitAdd);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Uredi stan" : "Dodaj stan"} - Ulaz {buildingName}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Broj stana *</FormLabel>
                    <FormControl>
                      <Input placeholder="1, 2A, prizemlje..." {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Kat</FormLabel>
                    <FormControl>
                      <Input placeholder="0, 1, P+1..." {...field} className="w-full" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Površina (m²) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="45.50" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </FormSection>

            {fees && (() => {
              const items = [
                { label: "Čišćenje", show: (fees.cleaning ?? 0) !== 0, fmt: () => (fees.cleaning ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" },
                { label: "Kredit", show: (fees.loan ?? 0) !== 0, fmt: () => (hasValidArea ? loanCharge : 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € (" + (fees.loan ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €/m²)" },
                { label: "Pričuva", show: (fees.reservePerSqm ?? 0) !== 0, fmt: () => (hasValidArea ? reserveCharge : 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € (" + (fees.reservePerSqm ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €/m²)" },
                { label: "Štednja (fiksno)", show: (fees.savingsFixed ?? 0) !== 0, fmt: () => (fees.savingsFixed ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" },
                { label: "Izvanredni", show: (fees.extraFixed ?? 0) !== 0, fmt: () => (fees.extraFixed ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" },
                { label: "Struja", show: (fees.electricityFixed ?? 0) !== 0, fmt: () => (fees.electricityFixed ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" },
                { label: "Štednja (€/m²)", show: (fees.savingsPerSqm ?? 0) !== 0, fmt: () => (hasValidArea ? savingsPerSqmCharge : 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € (" + (fees.savingsPerSqm ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €/m²)" },
              ].filter((x) => x.show);
              if (totalCharge !== 0) items.push({ label: "Ukupno mjesečno", val: totalCharge, fmt: () => totalCharge.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €", isTotal: true });
              if (items.length === 0) return null;
              return (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Procjena mjesečnih naknada</h4>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {items.map(({ label, fmt, isTotal }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={isTotal ? "font-semibold" : "font-medium"}>{fmt()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <FormSection>
            {isEdit ? (
              <FormField
                control={editForm.control}
                name="personId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Suvlasnik / vlasnik</FormLabel>
                    <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={tenantComboboxOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? (() => {
                                  const p = persons.find((p: { id: string }) => p.id === field.value) as { name: string; oib?: string | null } | undefined;
                                  if (!p) return field.value;
                                  return p.oib ? `${p.name} – ${p.oib}` : p.name;
                                })()
                              : "Odaberi suvlasnika..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pretraži suvlasnike..." />
                          <CommandList>
                            <CommandEmpty>Nema pronađenih suvlasnika</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="Nema suvlasnika"
                                onSelect={() => {
                                  field.onChange("");
                                  setTenantComboboxOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                Nema suvlasnika
                              </CommandItem>
                              {persons.map((p: { id: string; name: string; oib?: string | null }) => {
                                const label = p.oib ? `${p.name} – ${p.oib}` : p.name;
                                return (
                                  <CommandItem
                                    key={p.id}
                                    value={`${p.name} ${p.oib || ""}`.trim()}
                                    onSelect={() => {
                                      field.onChange(p.id);
                                      setTenantComboboxOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                    {label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel className="text-sm font-medium">Suvlasnik/Vlasnik</FormLabel>
                  <FormField
                    control={addForm.control}
                    name="ownerMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="existing" id="owner-existing" />
                              <Label htmlFor="owner-existing" className="font-normal cursor-pointer">
                                Odaberi postojećeg suvlasnika
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="new" id="owner-new" />
                              <Label htmlFor="owner-new" className="font-normal cursor-pointer">
                                Unesi podatke novog suvlasnika
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {addForm.watch("ownerMode") === "existing" ? (
                  <FormField
                    control={addForm.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Postojeći suvlasnik</FormLabel>
                        <Popover open={tenantComboboxOpen} onOpenChange={setTenantComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={tenantComboboxOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? (() => {
                                      const p = persons.find((p: { id: string }) => p.id === field.value) as { name: string; oib?: string | null } | undefined;
                                      if (!p) return field.value;
                                      return p.oib ? `${p.name} – ${p.oib}` : p.name;
                                    })()
                                  : "Odaberi suvlasnika..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Pretraži suvlasnike..." />
                              <CommandList>
                                <CommandEmpty>Nema pronađenih suvlasnika</CommandEmpty>
                                <CommandGroup>
                                  {persons.map((p: { id: string; name: string; oib?: string | null }) => {
                                    const label = p.oib ? `${p.name} – ${p.oib}` : p.name;
                                    return (
                                      <CommandItem
                                        key={p.id}
                                        value={`${p.name} ${p.oib || ""}`.trim()}
                                        onSelect={() => {
                                          field.onChange(p.id);
                                          setTenantComboboxOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                        {label}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">Email omogućuje web pristup.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Ime i prezime</FormLabel>
                            <FormControl>
                              <Input placeholder="Ime i prezime suvlasnika" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="ownerOib"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>OIB</FormLabel>
                            <FormControl>
                              <Input placeholder="11 znamenki" {...field} className="w-full font-mono" maxLength={11} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="+385 91 234 5678" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addForm.control}
                      name="delivery_method"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Način dostave</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "email"}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Odaberite način" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="pošta">Pošta</SelectItem>
                              <SelectItem value="both">E-mail i pošta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}
            </FormSection>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Bilješke</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatne informacije o stanu..."
                      className="resize-none w-full"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" className="min-h-[32px]" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" className="min-h-[32px]" disabled={isPending}>
                {isPending ? "Spremanje..." : isEdit ? "Spremi" : "Dodaj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
