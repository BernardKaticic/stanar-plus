import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { invoicesApi, locationsApi, suppliersApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type SupplierOption = { id: string; name: string };
type BuildingOption = { id: string; name: string };
type InvoiceItem = {
  description: string;
  qty: number | "";
  unitPrice: number | "";
  taxRate?: number | "" | null;
  amount?: number;
};
type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  supplierId?: string | null;
  buildingId?: string | null;
  date?: string | null;
  dueDate?: string | null;
  amountNum?: number;
  status?: "pending" | "booked" | "unmatched" | string;
  category?: string | null;
  type?: string | null;
  direction?: "incoming" | "outgoing";
  recipientName?: string | null;
  paymentDate?: string | null;
  items?: InvoiceItem[];
};

const CATEGORIES = ["Energija", "Komunalije", "Čišćenje", "Održavanje", "Ostalo"];

const toIsoLocalDate = (date?: Date): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromIsoOrHrDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const hr = String(value).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (hr) return new Date(Number(hr[3]), Number(hr[2]) - 1, Number(hr[1]));
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const cleanId = (id?: string | null) => String(id || "").replace(/^building-/, "");

const InvoiceEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [direction, setDirection] = useState<"incoming" | "outgoing">("incoming");
  const [supplierId, setSupplierId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Ostalo");
  const [status, setStatus] = useState<"pending" | "booked">("pending");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [buildingQuery, setBuildingQuery] = useState("");

  const updateLineItem = (index: number, patch: Partial<InvoiceItem>) => {
    setLineItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0, taxRate: null }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const { data: locationsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const { data: suppliersList = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.getAll(),
  });
  const detailQuery = useQuery({
    queryKey: ["invoice", id],
    enabled: isEdit,
    queryFn: () => invoicesApi.getById(String(id)) as Promise<InvoiceDetail>,
  });

  const suppliers = useMemo(
    () =>
      (Array.isArray(suppliersList) ? suppliersList : [])
        .map((s) => s as SupplierOption)
        .filter((s) => s?.id != null)
        .map((s) => ({ id: String(s.id), name: s.name || "-" })),
    [suppliersList]
  );

  const buildings = useMemo(
    () =>
      (Array.isArray(locationsList) ? locationsList : [])
        .map((b) => b as BuildingOption)
        .filter((b) => typeof b?.id === "string" && typeof b?.name === "string")
        .map((b) => ({ id: cleanId(b.id), name: b.name }))
        .filter((b) => b.id),
    [locationsList]
  );
  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 200);
    return suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 200);
  }, [suppliers, supplierQuery]);
  const filteredBuildings = useMemo(() => {
    const q = buildingQuery.trim().toLowerCase();
    if (!q) return buildings.slice(0, 200);
    return buildings
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 200);
  }, [buildings, buildingQuery]);

  useEffect(() => {
    if (!detailQuery.data) return;
    const inv = detailQuery.data;
    setInvoiceNumber(inv.invoiceNumber || "");
    setDirection(inv.direction === "outgoing" ? "outgoing" : "incoming");
    setSupplierId(inv.supplierId || "");
    setRecipientName(inv.recipientName || "");
    setBuildingId(inv.buildingId || "");
    setDate(fromIsoOrHrDate(inv.date));
    setDueDate(fromIsoOrHrDate(inv.dueDate));
    setAmount(String(inv.amountNum ?? 0));
    setCategory(inv.category || "Ostalo");
    setStatus(inv.status === "booked" ? "booked" : "pending");
    setPaymentDate(fromIsoOrHrDate(inv.paymentDate));
    setLineItems(Array.isArray(inv.items) ? inv.items : []);
  }, [detailQuery.data]);

  const itemsTotal = lineItems.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) return sum;
    return sum + qty * unitPrice;
  }, 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const base = Number(item.qty || 0) * Number(item.unitPrice || 0);
    const rate = Number(item.taxRate || 0);
    if (!Number.isFinite(base) || !Number.isFinite(rate)) return sum;
    return sum + (base * rate) / 100;
  }, 0);
  const grandTotal = itemsTotal + taxTotal;

  useEffect(() => {
    if (lineItems.length > 0) {
      setAmount(itemsTotal.toFixed(2));
    }
  }, [itemsTotal, lineItems.length]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceNumber.trim()) throw new Error("Broj računa je obavezan");
      if (!date) throw new Error("Datum je obavezan");
      if (direction === "incoming" && !supplierId) throw new Error("Dobavljač je obavezan za ulazni račun");
      if (direction === "outgoing" && !recipientName.trim()) throw new Error("Primatelj je obavezan za izlazni račun");
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        direction,
        supplierId: direction === "incoming" ? supplierId || null : null,
        recipientName: direction === "outgoing" ? (recipientName.trim() || null) : null,
        buildingId: buildingId || null,
        date: toIsoLocalDate(date),
        dueDate: toIsoLocalDate(dueDate) || null,
        amount: Number(amount || 0),
        status: isEdit ? status : "pending",
        paymentDate: isEdit && status === "booked" ? toIsoLocalDate(paymentDate) || toIsoLocalDate(new Date()) : null,
        category: category || null,
        type: "manual",
        items: lineItems
          .map((item) => ({
            description: String(item.description || "").trim(),
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            taxRate: item.taxRate == null || item.taxRate === 0 ? null : Number(item.taxRate),
          }))
          .filter((item) => item.description && item.qty > 0),
      };
      if (isEdit) {
        return invoicesApi.update(String(id), payload);
      }
      return invoicesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast({ title: isEdit ? "Račun ažuriran" : "Račun kreiran" });
      navigate("/e-invoices");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Spremanje nije uspjelo";
      toast({ title: "Greška", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Natrag na račune"
            onClick={() => navigate("/e-invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="page-title">{isEdit ? "Uredi račun" : "Novi račun"}</h1>
        </div>
      </header>

      <Card className="rounded-lg border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Podaci računa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Unesite osnovne podatke, zatim dodajte stavke. Sustav automatski računa iznose i PDV.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">1. Osnovno</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vrsta računa *</Label>
                    <Select value={direction} onValueChange={(v) => setDirection(v as "incoming" | "outgoing")}>
                      <SelectTrigger className="min-h-[36px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incoming">Ulazni račun</SelectItem>
                        <SelectItem value="outgoing">Izlazni račun</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Ulazni = račun dobavljača, izlazni = račun koji vi izdajete.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Broj računa *</Label>
                    <Input
                      className="min-h-[36px]"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="2026-001"
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-border/70" />
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">2. Partner i lokacija</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    {direction === "incoming" ? (
                      <>
                        <Label>Dobavljač *</Label>
                        <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={supplierOpen}
                              className="w-full justify-between min-h-[36px] font-normal"
                            >
                              <span className={cn("truncate", !supplierId && "text-muted-foreground")}>
                                {supplierId ? (suppliers.find((s) => s.id === supplierId)?.name || "Odaberi dobavljača") : "Odaberi dobavljača"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Pretraži dobavljače..." value={supplierQuery} onValueChange={setSupplierQuery} />
                              <CommandList>
                                <CommandEmpty>Nema rezultata.</CommandEmpty>
                                <CommandGroup>
                                  {filteredSuppliers.map((s) => (
                                    <CommandItem
                                      key={s.id}
                                      value={`${s.name} ${s.id}`}
                                      onSelect={() => {
                                        setSupplierId(s.id);
                                        setSupplierOpen(false);
                                        setSupplierQuery("");
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", supplierId === s.id ? "opacity-100" : "opacity-0")} />
                                      {s.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </>
                    ) : (
                      <>
                        <Label>Primatelj *</Label>
                        <Input
                          className="min-h-[36px]"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Naziv kupca / primatelja"
                        />
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Zgrada (opcionalno)</Label>
                    <Popover open={buildingOpen} onOpenChange={setBuildingOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={buildingOpen}
                          className="w-full justify-between min-h-[36px] font-normal"
                        >
                          <span className={cn("truncate", !buildingId && "text-muted-foreground")}>
                            {buildingId ? (buildings.find((b) => b.id === buildingId)?.name || "Odaberi zgradu") : "Bez zgrade"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pretraži zgrade..." value={buildingQuery} onValueChange={setBuildingQuery} />
                          <CommandList>
                            <CommandEmpty>Nema rezultata.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="Bez zgrade"
                                onSelect={() => {
                                  setBuildingId("");
                                  setBuildingOpen(false);
                                  setBuildingQuery("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", !buildingId ? "opacity-100" : "opacity-0")} />
                                Bez zgrade
                              </CommandItem>
                              {filteredBuildings.map((b) => (
                                <CommandItem
                                  key={b.id}
                                  value={`${b.name} ${b.id}`}
                                  onSelect={() => {
                                    setBuildingId(b.id);
                                    setBuildingOpen(false);
                                    setBuildingQuery("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", buildingId === b.id ? "opacity-100" : "opacity-0")} />
                                  {b.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Kategorija</Label>
                    <Select value={category || "Ostalo"} onValueChange={setCategory}>
                      <SelectTrigger className="min-h-[36px] w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <div className="border-t border-border/70" />
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">3. Datumi i status</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Datum *</Label>
                    <DatePicker date={date} onDateChange={setDate} className="w-full" placeholder="dd.MM.yyyy" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dospijeće</Label>
                    <DatePicker date={dueDate} onDateChange={setDueDate} className="w-full" placeholder="dd.MM.yyyy" />
                  </div>
                </div>

                {isEdit && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as "pending" | "booked")}>
                        <SelectTrigger className="min-h-[36px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Na čekanju</SelectItem>
                          <SelectItem value="booked">Knjiženo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {status === "booked" && (
                      <div className="space-y-2">
                        <Label>Datum plaćanja</Label>
                        <DatePicker date={paymentDate} onDateChange={setPaymentDate} className="w-full" placeholder="dd.MM.yyyy" />
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="border-t border-border/70" />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">4. Stavke računa</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[36px]"
                    onClick={addLineItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj stavku
                  </Button>
                </div>
                {lineItems.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Nema stavki. Ako ih ne dodate, unesite ukupni iznos ručno.</p>
                    <div className="space-y-2">
                      <Label>Iznos (€) *</Label>
                      <Input
                        className="min-h-[36px] w-full text-right tabular-nums"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[56px]">Rbr</TableHead>
                            <TableHead>Opis stavke</TableHead>
                            <TableHead className="w-[110px] text-right">Količina</TableHead>
                            <TableHead className="w-[150px] text-right">Jed. cijena</TableHead>
                            <TableHead className="w-[110px] text-right">PDV %</TableHead>
                            <TableHead className="w-[160px] text-right">Iznos</TableHead>
                            <TableHead className="w-[56px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((item, idx) => {
                            const rowAmount = Number(item.qty || 0) * Number(item.unitPrice || 0);
                            return (
                              <TableRow key={`item-${idx}`}>
                                <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                                <TableCell>
                                  <Input
                                    className="min-h-[36px]"
                                    placeholder="npr. Pričuva za 05/2026"
                                    value={item.description}
                                    onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    className="min-h-[36px] text-right tabular-nums"
                                    value={item.qty}
                                    onChange={(e) => updateLineItem(idx, { qty: e.target.value === "" ? "" : Number(e.target.value) })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    className="min-h-[36px] text-right tabular-nums"
                                    value={item.unitPrice}
                                    onChange={(e) => updateLineItem(idx, { unitPrice: e.target.value === "" ? "" : Number(e.target.value) })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="min-h-[36px] text-right tabular-nums"
                                    value={item.taxRate ?? ""}
                                    onChange={(e) => updateLineItem(idx, { taxRate: e.target.value === "" ? "" : Number(e.target.value) })}
                                    onBlur={() => {
                                      if (item.taxRate === "") updateLineItem(idx, { taxRate: null });
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                  {rowAmount.toFixed(2).replace(".", ",")} €
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[36px] text-destructive"
                                    onClick={() => removeLineItem(idx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="ml-auto w-full max-w-sm rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Međuzbroj</span>
                        <span className="tabular-nums">{itemsTotal.toFixed(2).replace(".", ",")} €</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-muted-foreground">PDV ukupno</span>
                        <span className="tabular-nums">{taxTotal.toFixed(2).replace(".", ",")} €</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                        <span>Ukupno</span>
                        <span className="tabular-nums">{grandTotal.toFixed(2).replace(".", ",")} €</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" className="min-h-[36px]" onClick={() => navigate("/e-invoices")}>Odustani</Button>
        <Button className="min-h-[36px]" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || detailQuery.isLoading}>
          {saveMutation.isPending ? "Spremanje..." : isEdit ? "Spremi promjene" : "Kreiraj račun"}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceEditor;
