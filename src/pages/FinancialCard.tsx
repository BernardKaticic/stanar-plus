import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Download, Wallet, Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { startOfDay, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { printPage } from "@/lib/export";
import { useQuery } from "@tanstack/react-query";
import { locationsApi, financialApi, invoicesApi } from "@/lib/api";

type LocationOption = {
  id: string;
  name: string;
};

type InvoiceItem = {
  supplier?: string | null;
  supplierName?: string | null;
  building?: string | null;
  buildingId?: string | null;
  building_id?: string | null;
  locationId?: string | null;
  location_id?: string | null;
  date?: string | null;
  invoiceDate?: string | null;
  invoice_date?: string | null;
  amount?: string | null;
  amountNum?: number;
  totalAmount?: number;
  total_amount?: number;
  direction?: string | null;
};

type TransactionItem = {
  date: string;
  type: string;
  description: string;
  amount: string;
  balance?: string;
};

const parseEuroAmount = (value: string | null | undefined): number =>
  parseFloat(String(value || "0").replace(/[^\d,-]/g, "").replace(",", ".")) || 0;

const parseDateToTime = (value?: string | null): number => {
  const v = String(value || "").trim();
  if (!v) return 0;
  const hr = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (hr) return new Date(Number(hr[3]), Number(hr[2]) - 1, Number(hr[1])).getTime();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getMonthLabel = (value?: string | null): string => {
  const v = String(value || "").trim();
  const hr = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (hr) return `${String(hr[2]).padStart(2, "0")}.${hr[3]}.`;
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[2]}.${iso[1]}.`;
  return "Nepoznato";
};

const cleanBuildingId = (value?: string | null): string => String(value || "").replace(/^building-/, "");

const FinancialCard = () => {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date>(startOfDay(new Date()));

  const { data: locationsList = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const locations = (Array.isArray(locationsList) ? locationsList : [])
    .map((l) => l as LocationOption)
    .filter((l) => typeof l?.id === "string" && typeof l?.name === "string")
    .map((l) => ({ id: l.id, label: l.name }));
  const buildingId = cleanBuildingId(selectedAddress);

  const { data: financial, isLoading: financialLoading } = useQuery({
    queryKey: [
      "financial",
      buildingId,
      dateFrom ? dateFrom.toISOString().slice(0, 10) : null,
      dateTo ? dateTo.toISOString().slice(0, 10) : null,
    ],
    queryFn: () =>
      financialApi.getByBuilding(
        buildingId,
        dateFrom ? dateFrom.toISOString().slice(0, 10) : undefined,
        dateTo ? dateTo.toISOString().slice(0, 10) : undefined
      ),
    enabled: !!buildingId,
  });
  const { data: invoices = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["invoices", "financial-card"],
    queryFn: () => invoicesApi.getAll({}),
    enabled: !!buildingId,
  });

  const accountInfo = financial
    ? {
        currentBalance: financial.currentBalance,
        totalCharged: financial.totalCharged,
        totalPaid: financial.totalPaid,
        totalChargedAll: financial.totalChargedAll ?? financial.totalCharged,
        totalPaidAll: financial.totalPaidAll ?? financial.totalPaid,
        previousYearCarryover: financial.previousYearCarryover ?? "0,00 €",
        totalExpenses: financial.totalExpenses ?? "0,00 €",
      }
    : {
        currentBalance: "0,00 €",
        totalCharged: "0,00 €",
        totalPaid: "0,00 €",
        totalChargedAll: "0,00 €",
        totalPaidAll: "0,00 €",
        previousYearCarryover: "0,00 €",
        totalExpenses: "0,00 €",
      };
  const transactions = (financial?.transactions ?? []) as TransactionItem[];
  const selectedBuildingName = locations.find((loc) => cleanBuildingId(loc.id) === buildingId)?.label || "";
  const groupedTransactions = useMemo(() => {
    const map = new Map<
      string,
      { month: string; type: string; description: string; count: number; total: number; latestDate: number }
    >();
    for (const tx of transactions) {
      const month = getMonthLabel(tx.date);
      const type = tx.type || "trošak";
      const description = tx.description || "Bez opisa";
      const key = `${month}||${type}||${description}`;
      const prev = map.get(key);
      const amount = parseEuroAmount(tx.amount);
      const latestDate = parseDateToTime(tx.date);
      if (prev) {
        prev.count += 1;
        prev.total += amount;
        if (latestDate >= prev.latestDate) {
          prev.latestDate = latestDate;
        }
      } else {
        map.set(key, { month, type, description, count: 1, total: amount, latestDate });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.latestDate - a.latestDate);
  }, [transactions]);
  const supplierList = useMemo(() => {
    const startMs = dateFrom ? startOfDay(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const endMs = dateTo ? startOfDay(dateTo).getTime() : Number.POSITIVE_INFINITY;
    const map = new Map<string, { id: string; name: string; category: string; total: number; count: number }>();

    for (const raw of Array.isArray(invoices) ? invoices : []) {
      const inv = raw as InvoiceItem;
      if (inv.direction === "outgoing") continue;
      const invDateMs = parseDateToTime(inv.date || inv.invoiceDate || inv.invoice_date);
      if (invDateMs < startMs || invDateMs > endMs) continue;
      const invBuildingId = cleanBuildingId(
        inv.buildingId || inv.building_id || inv.locationId || inv.location_id
      );
      const byId = invBuildingId && invBuildingId === buildingId;
      const byName =
        !invBuildingId &&
        selectedBuildingName &&
        String(inv.building || "").trim().toLowerCase() === selectedBuildingName.trim().toLowerCase();
      if (!byId && !byName) continue;

      const supplierName = String(inv.supplier || inv.supplierName || "Nepoznato");
      const amount =
        typeof inv.amountNum === "number"
          ? inv.amountNum
          : typeof inv.totalAmount === "number"
            ? inv.totalAmount
            : typeof inv.total_amount === "number"
              ? inv.total_amount
              : parseEuroAmount(inv.amount);
      const prev = map.get(supplierName);
      if (prev) {
        prev.total += amount;
        prev.count += 1;
      } else {
        map.set(supplierName, {
          id: supplierName,
          name: supplierName,
          category: "Trošak",
          total: amount,
          count: 1,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        totalPeriod: item.total.toLocaleString("hr-HR", { style: "currency", currency: "EUR" }),
        invoiceCount: item.count,
      }));
  }, [invoices, buildingId, selectedBuildingName, dateFrom, dateTo]);
  const netPeriodChange = parseEuroAmount(accountInfo.totalPaid) - parseEuroAmount(accountInfo.totalCharged);
  const currentBalanceNum = parseEuroAmount(accountInfo.currentBalance);
  const groupedTransactionsWithBalance = useMemo(() => {
    const ordered = [...groupedTransactions].sort((a, b) => a.latestDate - b.latestDate);
    const net = ordered.reduce((sum, tx) => sum + tx.total, 0);
    let running = currentBalanceNum - net;
    const rows = ordered.map((tx) => {
      running += tx.total;
      return {
        ...tx,
        computedBalance: running.toLocaleString("hr-HR", { style: "currency", currency: "EUR" }),
      };
    });
    return rows.sort((a, b) => b.latestDate - a.latestDate);
  }, [groupedTransactions, currentBalanceNum]);

  useEffect(() => {
    if (!locations.length) return;
    if (!selectedAddress) {
      setSelectedAddress(locations[0]?.id ?? "");
      return;
    }
    const exists = locations.some((loc) => loc.id === selectedAddress);
    if (!exists) {
      setSelectedAddress(locations[0]?.id ?? "");
    }
  }, [locations, selectedAddress]);

  useEffect(() => {
    if (dateFrom > dateTo) {
      setDateTo(dateFrom);
    }
  }, [dateFrom, dateTo]);

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Financijska kartica</h1>
        <Button variant="outline" className="shrink-0 min-h-[36px]" onClick={printPage}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </header>

      <Card className="rounded-lg border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Odabir zgrade i razdoblja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-2">
              <Label className="block text-sm font-medium">Zgrada</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[36px]"
                  >
                    <span className="truncate">
                      {locationsLoading
                        ? "Učitavanje..."
                        : selectedAddress
                          ? locations.find((loc) => loc.id === selectedAddress)?.label
                          : "Odaberi zgradu..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pretraži zgradu..." />
                    <CommandList>
                      <CommandEmpty>Nije pronađeno.</CommandEmpty>
                      <CommandGroup>
                        {locations.map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.label}
                            onSelect={() => {
                              setSelectedAddress(location.id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAddress === location.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {location.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 min-w-[160px]">
              <Label className="block text-sm font-medium">Datum od</Label>
              <DatePicker
                date={dateFrom}
                onDateChange={setDateFrom}
                placeholder="Odaberi datum"
              />
            </div>
            <div className="space-y-2 min-w-[160px]">
              <Label className="block text-sm font-medium">Datum do</Label>
              <DatePicker
                date={dateTo}
                onDateChange={setDateTo}
                placeholder="Odaberi datum"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {buildingId && (
        <div className="space-y-6">
          <div className="page-kpi">
            <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
            <p className="page-kpi-label">Trenutno stanje</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <p className="page-kpi-value tabular-nums text-primary">{accountInfo.currentBalance}</p>
            )}
            </div>
            <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
            <p className="page-kpi-label">Donos (preth. god.)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <p className="page-kpi-value tabular-nums">{accountInfo.previousYearCarryover}</p>
            )}
            </div>
            <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
            <p className="page-kpi-label">Ukupno zaduženo (sveukupno)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <>
                <p className="page-kpi-value tabular-nums">{accountInfo.totalChargedAll}</p>
                {financial?.chargeEntryCount != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{financial.chargeEntryCount} stavki zaduženja</p>
                )}
              </>
            )}
          </div>
          <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
            <p className="page-kpi-label">Ukupno uplaćeno (sveukupno)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <>
                <p className="page-kpi-value tabular-nums text-green-600 dark:text-green-500">{accountInfo.totalPaidAll}</p>
                {financial?.paymentEntryCount != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{financial.paymentEntryCount} stavki uplata</p>
                )}
              </>
            )}
            </div>
          </div>

          <Tabs defaultValue="balance" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="balance">Stanje</TabsTrigger>
              <TabsTrigger value="suppliers">Dobavljači</TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="space-y-6">
              <Card className="rounded-lg border border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Dobavljači za odabranu zgradu</CardTitle>
                </CardHeader>
                <CardContent>
                  {suppliersLoading ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                            <TableHead className="text-xs font-medium">Kategorija</TableHead>
                            <TableHead className="text-right text-xs font-medium">Ukupno u razdoblju</TableHead>
                            <TableHead className="text-right text-xs font-medium">Broj računa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4].map((i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : supplierList.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title="Nema dobavljača"
                      description="Nema dobavljača za odabranu zgradu"
                      className="py-12"
                    />
                  ) : (
                    <>
                      <div className="hidden md:block rounded-lg border border-border/80 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                          <TableHead className="text-xs font-medium">Kategorija</TableHead>
                          <TableHead className="text-right text-xs font-medium">Ukupno u razdoblju</TableHead>
                          <TableHead className="text-right text-xs font-medium">Broj računa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierList.map((supplier, i) => (
                          <TableRow key={supplier.id ?? i} className="hover:bg-muted/30 transition-colors duration-150">
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell className="text-muted-foreground">{supplier.category}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{supplier.totalPeriod}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{supplier.invoiceCount}</TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                      </div>
                      <div className="md:hidden space-y-3">
                        {supplierList.map((supplier, i) => (
                          <Card key={supplier.id ?? i} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                            <p className="font-semibold">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{supplier.category}</p>
                            <div className="flex justify-between text-sm mt-2">
                              <span className="text-muted-foreground">Ukupno u razdoblju</span>
                              <span className="font-medium tabular-nums">{supplier.totalPeriod}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Broj računa</span>
                              <span className="font-medium tabular-nums">{supplier.invoiceCount}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-3 rounded-lg border border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Grupirane transakcije u razdoblju</CardTitle>
                  </CardHeader>
                  <CardContent>
                {financialLoading ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Mjesec</TableHead>
                          <TableHead className="text-xs font-medium">Tip</TableHead>
                          <TableHead className="text-xs font-medium">Opis</TableHead>
                          <TableHead className="text-right text-xs font-medium">Broj stavki</TableHead>
                          <TableHead className="text-right text-xs font-medium">Ukupno</TableHead>
                          <TableHead className="text-right text-xs font-medium">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : groupedTransactionsWithBalance.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="Nema transakcija"
                    description="Nema transakcija za prikaz u odabranom periodu"
                    className="py-12"
                  />
                ) : (
                  <>
                    <div className="hidden md:block rounded-lg border border-border/80 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-medium">Mjesec</TableHead>
                            <TableHead className="text-xs font-medium">Tip</TableHead>
                            <TableHead className="text-xs font-medium">Opis</TableHead>
                            <TableHead className="text-right text-xs font-medium">Broj stavki</TableHead>
                            <TableHead className="text-right text-xs font-medium">Ukupno</TableHead>
                            <TableHead className="text-right text-xs font-medium">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedTransactionsWithBalance.map((transaction, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors duration-150">
                              <TableCell className="font-medium text-sm">{transaction.month}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === "uplata" ? "default" : "secondary"}>
                                  {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{transaction.description}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{transaction.count}</TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-medium text-sm tabular-nums",
                                  transaction.total < 0 ? "text-destructive" : "text-foreground"
                                )}
                              >
                                {transaction.total.toLocaleString("hr-HR", { style: "currency", currency: "EUR" })}
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm tabular-nums">
                                {transaction.computedBalance}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden space-y-3">
                      {groupedTransactionsWithBalance.map((transaction, i) => (
                        <Card key={i} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <Badge variant={transaction.type === "uplata" ? "default" : "secondary"}>
                              {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                            </Badge>
                            <span className={cn("text-sm font-medium tabular-nums", transaction.total < 0 ? "text-destructive" : "text-foreground")}>
                              {transaction.total.toLocaleString("hr-HR", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{transaction.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{transaction.month}</span>
                            <span>Stavki: {transaction.count}</span>
                          </div>
                          <div className="flex justify-end text-xs text-muted-foreground mt-1">
                            <span>Saldo: {transaction.computedBalance}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Rekapitulacija razdoblja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Zaduženo u razdoblju</span>
                        {financialLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span className="font-semibold tabular-nums">{accountInfo.totalCharged}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Uplaćeno u razdoblju</span>
                        {financialLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span className="font-semibold tabular-nums text-green-600 dark:text-green-500">{accountInfo.totalPaid}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Neto promjena u razdoblju</span>
                        {financialLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              netPeriodChange < 0 ? "text-destructive" : "text-green-600 dark:text-green-500"
                            )}
                          >
                            {netPeriodChange.toLocaleString("hr-HR", { style: "currency", currency: "EUR" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!buildingId && (
        <EmptyState
          icon={Building2}
          title="Odaberite zgradu"
          description="Za prikaz financijske kartice prvo odaberite zgradu."
          className="py-10"
        />
      )}
    </div>
  );
};

export default FinancialCard;
