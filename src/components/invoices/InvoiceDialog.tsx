import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Building2, Truck, ChevronsUpDown, Check, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const invoiceCreateSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1, "Broj računa je obavezan"),
    direction: z.enum(["incoming", "outgoing"]).default("incoming"),
    supplierId: z.string().optional(),
    recipientName: z.string().optional(),
    buildingId: z.string().optional(),
    date: z.string().min(1, "Datum je obavezan"),
    dueDate: z.string().optional(),
    amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Unesite valjani iznos"),
    category: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.direction === "incoming" && !data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplierId"],
        message: "Dobavljač je obavezan za ulazni račun",
      });
    }
    if (data.direction === "outgoing" && !String(data.recipientName || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipientName"],
        message: "Primatelj je obavezan za izlazni račun",
      });
    }
  });

export type InvoiceLineItem = {
  description: string;
  qty: number | "";
  unitPrice: number | "";
  taxRate?: number | "" | null;
  amount?: number;
};

export type InvoiceFormData = z.infer<typeof invoiceCreateSchema> & { items?: InvoiceLineItem[] };
export type InvoiceEditPayload = InvoiceFormData & { id: string };

export type InvoiceEditItem = {
  id: string;
  invoiceNumber: string;
  supplier?: string;
  supplierId?: string;
  buildingId?: string;
  date?: string;
  dueDate?: string;
  amount?: string;
  amountNum?: number;
  status: string;
  category?: string;
  accountingGroup?: string;
  type?: string;
  paymentDate?: string;
  direction?: "incoming" | "outgoing";
  recipientName?: string | null;
  items?: InvoiceLineItem[];
};

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: InvoiceFormData | InvoiceEditPayload) => void;
  editItem?: InvoiceEditItem | null;
  suppliers: { id: string; name: string }[];
  buildings: { id: string; name: string }[];
  isPending?: boolean;
}

const CATEGORIES = ["Energija", "Komunalije", "Čišćenje", "Održavanje", "Ostalo"];

const toIsoLocalDate = (date?: Date): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromIsoOrHrDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const hr = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (hr) {
    const d = new Date(Number(hr[3]), Number(hr[2]) - 1, Number(hr[1]));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const InvoiceDialog = ({
  open,
  onOpenChange,
  onSave,
  editItem,
  suppliers,
  buildings,
  isPending,
}: InvoiceDialogProps) => {
  const isEdit = !!editItem;
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  const createForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceCreateSchema),
    defaultValues: {
      invoiceNumber: "",
      direction: "incoming",
      supplierId: "",
      recipientName: "",
      buildingId: "",
      date: "",
      dueDate: "",
      amount: "",
      category: "Ostalo",
    },
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        createForm.reset({
          invoiceNumber: editItem.invoiceNumber || "",
          direction: editItem.direction === "outgoing" ? "outgoing" : "incoming",
          supplierId: editItem.supplierId || "",
          recipientName: editItem.recipientName || "",
          buildingId: editItem.buildingId || "",
          date: toIsoLocalDate(fromIsoOrHrDate(editItem.date)),
          dueDate: toIsoLocalDate(fromIsoOrHrDate(editItem.dueDate)),
          amount:
            editItem.amountNum != null
              ? String(editItem.amountNum)
              : String(editItem.amount || "").replace(/[^\d.,-]/g, "").replace(",", "."),
          category: editItem.category || "Ostalo",
        });
        setLineItems(Array.isArray(editItem.items) ? editItem.items : []);
      } else {
        createForm.reset({
          invoiceNumber: "",
          direction: "incoming",
          supplierId: "",
          recipientName: "",
          buildingId: "",
          date: "",
          dueDate: "",
          amount: "",
          category: "Ostalo",
        });
        setLineItems([]);
      }
    }
  }, [open, editItem, createForm]);

  const createDirection = createForm.watch("direction");
  const lineItemsTotal = lineItems.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) return sum;
    return sum + qty * unitPrice;
  }, 0);

  useEffect(() => {
    if (!open || lineItems.length === 0) return;
    createForm.setValue("amount", lineItemsTotal.toFixed(2), { shouldValidate: true });
  }, [lineItemsTotal, lineItems.length, open, createForm]);

  const onSubmitCreate = (data: InvoiceFormData) => {
    const payload: InvoiceFormData = {
      ...data,
      date: toIsoLocalDate(fromIsoOrHrDate(data.date)),
      dueDate: toIsoLocalDate(fromIsoOrHrDate(data.dueDate)),
      items: lineItems
        .map((item) => ({
          description: String(item.description || "").trim(),
          qty: Number(item.qty || 0),
          unitPrice: Number(item.unitPrice || 0),
          taxRate: item.taxRate == null || item.taxRate === 0 ? null : Number(item.taxRate),
        }))
        .filter((item) => item.description && item.qty > 0),
    };
    if (editItem) {
      onSave({
        ...payload,
        id: editItem.id,
        status: editItem.status as "pending" | "booked",
        paymentDate: toIsoLocalDate(fromIsoOrHrDate(editItem.paymentDate)),
      });
      return;
    }
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi račun" : "Kreiraj račun"}</DialogTitle>
        </DialogHeader>
        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
          {createDirection === "incoming" && suppliers.length === 0 && (
            <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/5 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Nema dobavljača</p>
              <p className="text-muted-foreground mt-1">
                Prije kreiranja računa dodajte barem jednog dobavljača.
              </p>
              <Link
                to="/suppliers"
                className="inline-flex mt-2 text-primary hover:underline font-medium"
                onClick={() => onOpenChange(false)}
              >
                Idi na Dobavljače →
              </Link>
            </div>
          )}
          <FormField
            control={createForm.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <Label>Vrsta računa *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="incoming">Ulazni račun</SelectItem>
                    <SelectItem value="outgoing">Izlazni račun</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <Label>{createDirection === "outgoing" ? "Dobavljač (opcionalno)" : "Dobavljač *"}</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={suppliers.length === 0}
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {field.value
                            ? suppliers.find((s) => s.id === field.value)?.name
                            : suppliers.length === 0
                              ? "Nema dobavljača – dodajte ih prvo"
                              : "Odaberi dobavljača..."}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Pretraži dobavljače..." />
                      <CommandList>
                        <CommandEmpty>Nema rezultata</CommandEmpty>
                        <CommandGroup>
                          {suppliers.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                field.onChange(s.id);
                                setSupplierOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === s.id ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {createDirection === "outgoing" && (
            <FormField
              control={createForm.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <Label>Primatelj *</Label>
                  <FormControl>
                    <Input {...field} placeholder="Naziv kupca / primatelja računa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={createForm.control}
            name="buildingId"
            render={({ field }) => (
              <FormItem>
                <Label>Zgrada (opcionalno)</Label>
                <Popover open={buildingOpen} onOpenChange={setBuildingOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {field.value
                            ? buildings.find((b) => b.id === field.value)?.name
                            : "Odaberi zgradu..."}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Pretraži zgrade..." />
                      <CommandList>
                        <CommandEmpty>Nema rezultata</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              field.onChange("");
                              setBuildingOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                            Bez zgrade
                          </CommandItem>
                          {buildings.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                field.onChange(b.id);
                                setBuildingOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === b.id ? "opacity-100" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <Label>Broj računa *</Label>
                  <FormControl>
                    <Input {...field} placeholder="2025-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Label>Kategorija</Label>
                  <Select value={field.value || "Ostalo"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <Label>Datum *</Label>
                  <DatePicker
                    date={fromIsoOrHrDate(field.value)}
                    onDateChange={(d) => field.onChange(toIsoLocalDate(d))}
                    placeholder="dd.MM.yyyy"
                    className="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <Label>Dospijeće</Label>
                  <DatePicker
                    date={fromIsoOrHrDate(field.value)}
                    onDateChange={(d) => field.onChange(toIsoLocalDate(d))}
                    placeholder="dd.MM.yyyy"
                    className="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={createForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <Label>Iznos (€) *</Label>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    readOnly={lineItems.length > 0}
                  />
                </FormControl>
                {lineItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">Iznos se automatski računa iz stavki računa.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label>Stavke računa</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[36px]"
                onClick={() =>
                  setLineItems((prev) => [
                    ...prev,
                    { description: "", qty: 1, unitPrice: 0, taxRate: null },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj stavku
              </Button>
            </div>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nema stavki. Ako ih ne dodate, koristi se ručni iznos.
              </p>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={`item-${idx}`} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-12 sm:col-span-5"
                      placeholder="Opis stavke"
                      value={item.description}
                      onChange={(e) =>
                        setLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, description: e.target.value } : it)))
                      }
                    />
                    <Input
                      className="col-span-4 sm:col-span-2"
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Kol."
                      value={item.qty}
                      onChange={(e) =>
                        setLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: e.target.value === "" ? "" : Number(e.target.value) } : it)))
                      }
                    />
                    <Input
                      className="col-span-4 sm:col-span-2"
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Cijena"
                      value={item.unitPrice}
                      onChange={(e) =>
                        setLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, unitPrice: e.target.value === "" ? "" : Number(e.target.value) } : it)))
                      }
                    />
                    <Input
                      className="col-span-3 sm:col-span-2"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="PDV %"
                      value={item.taxRate ?? ""}
                      onChange={(e) =>
                        setLineItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, taxRate: e.target.value === "" ? "" : Number(e.target.value) } : it))
                        )
                      }
                      onBlur={() =>
                        setLineItems((prev) =>
                          prev.map((it, i) => (i === idx && it.taxRate === "" ? { ...it, taxRate: null } : it))
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="col-span-1 min-h-[36px] text-destructive"
                      onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-sm font-medium tabular-nums text-right">
                  Ukupno stavke: {lineItemsTotal.toFixed(2).replace(".", ",")} €
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Odustani
            </Button>
            <Button type="submit" disabled={isPending || (createDirection === "incoming" && suppliers.length === 0)}>
              {isPending ? "Spremanje..." : isEdit ? "Spremi" : "Kreiraj"}
            </Button>
          </div>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
