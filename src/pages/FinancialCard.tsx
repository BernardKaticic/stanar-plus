import { useState, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { locationsApi, financialApi, suppliersApi } from "@/lib/api";

const FinancialCard = () => {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date>(startOfDay(new Date()));

  const { data: locationsList = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const locations = locationsList.map((l: any) => ({ id: l.id, label: l.name }));
  const buildingId = selectedAddress?.startsWith("building-") ? selectedAddress.replace("building-", "") : "";

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
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.getAll({}),
    enabled: !!buildingId,
  });

  const accountInfo = financial
    ? {
        currentBalance: financial.currentBalance,
        totalCharged: financial.totalCharged,
        totalPaid: financial.totalPaid,
        totalChargedAll: financial.totalChargedAll ?? financial.totalCharged,
        totalPaidAll: financial.totalPaidAll ?? financial.totalPaid,
        previousYearCarryover: (financial as any).previousYearCarryover ?? "0,00 €",
        totalExpenses: (financial as any).totalExpenses ?? "0,00 €",
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
  const transactions = financial?.transactions ?? [];
  const supplierList = suppliers.map((s: any) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    monthlyAvg: s.monthlyAverage,
    yearly: s.yearlyTotal,
    status: "active",
  }));

  useEffect(() => {
    if (locations.length && !selectedAddress) {
      setSelectedAddress(locations[0]?.id ?? "");
    }
  }, [locations, selectedAddress]);

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Financijska kartica</h1>
        <Button variant="outline" className="shrink-0">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </header>

      <Card className="rounded-md">
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
                    className="w-full justify-between"
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
                <PopoverContent className="w-[400px] p-0" align="start">
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
            <div className="page-kpi-card">
            <p className="page-kpi-label">Trenutno stanje</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <p className="page-kpi-value text-primary">{accountInfo.currentBalance}</p>
            )}
            </div>
            <div className="page-kpi-card">
            <p className="page-kpi-label">Donos (preth. god.)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <p className="page-kpi-value">{accountInfo.previousYearCarryover}</p>
            )}
            </div>
            <div className="page-kpi-card">
            <p className="page-kpi-label">Ukupno zaduženo (sveukupno)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <>
                <p className="page-kpi-value">{accountInfo.totalChargedAll}</p>
                {financial?.chargeEntryCount != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{financial.chargeEntryCount} stavki zaduženja</p>
                )}
              </>
            )}
          </div>
          <div className="page-kpi-card">
            <p className="page-kpi-label">Ukupno uplaćeno (sveukupno)</p>
            {financialLoading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <>
                <p className="page-kpi-value text-green-600 dark:text-green-500">{accountInfo.totalPaidAll}</p>
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
              <Card className="rounded-md">
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
                            <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                            <TableHead className="text-right text-xs font-medium">Broj</TableHead>
                            <TableHead className="text-right text-xs font-medium w-20">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4].map((i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
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
                      <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                          <TableHead className="text-xs font-medium">Kategorija</TableHead>
                          <TableHead className="text-right text-xs font-medium">
                            {dateFrom || dateTo ? "Ukupno u periodu" : "Mjesečni prosjek"}
                          </TableHead>
                          <TableHead className="text-right text-xs font-medium">
                            {dateFrom || dateTo ? "Broj računa" : "Godišnje"}
                          </TableHead>
                          <TableHead className="text-right text-xs font-medium">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierList.map((supplier, i) => (
                          <TableRow key={supplier.id ?? i} className="hover:bg-muted/30 transition-colors duration-150">
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell className="text-muted-foreground">{supplier.category}</TableCell>
                            <TableCell className="text-right font-medium">{supplier.monthlyAvg}</TableCell>
                            <TableCell className="text-right font-medium">{supplier.yearly}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Aktivan</Badge>
                            </TableCell>
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
                              <span className="text-muted-foreground">Iznos</span>
                              <span className="font-medium">{supplier.monthlyAvg}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{dateFrom || dateTo ? "Broj računa" : "Godišnje"}</span>
                              <span className="font-medium">{supplier.yearly}</span>
                            </div>
                            <Badge variant="secondary" className="mt-2">Aktivan</Badge>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Transakcije u razdoblju</CardTitle>
                  </CardHeader>
                  <CardContent>
                {financialLoading ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Datum</TableHead>
                          <TableHead className="text-xs font-medium">Tip</TableHead>
                          <TableHead className="text-xs font-medium">Opis</TableHead>
                          <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                          <TableHead className="text-right text-xs font-medium">Stanje</TableHead>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : transactions.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="Nema transakcija"
                    description="Nema transakcija za prikaz u odabranom periodu"
                    className="py-12"
                  />
                ) : (
                  <>
                    <div className="hidden md:block rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-medium">Datum</TableHead>
                            <TableHead className="text-xs font-medium">Tip</TableHead>
                            <TableHead className="text-xs font-medium">Opis</TableHead>
                            <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                            <TableHead className="text-right text-xs font-medium">Stanje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors duration-150">
                              <TableCell className="font-medium text-sm">{transaction.date}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === "uplata" ? "default" : "secondary"}>
                                  {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{transaction.description}</TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-medium text-sm tabular-nums",
                                  transaction.amount.startsWith("-") ? "text-destructive" : "text-foreground"
                                )}
                              >
                                {transaction.amount}
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm tabular-nums">
                                {transaction.balance}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden space-y-3">
                      {transactions.map((transaction, i) => (
                        <Card key={i} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <Badge variant={transaction.type === "uplata" ? "default" : "secondary"}>
                              {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                            </Badge>
                            <span className="text-sm font-medium tabular-nums">{transaction.amount}</span>
                          </div>
                          <p className="text-sm mt-1">{transaction.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{transaction.date}</span>
                            <span>Stanje: {transaction.balance}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                  </CardContent>
                </Card>

                <Card className="rounded-md">
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
                          <span className="font-semibold">{accountInfo.totalCharged}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Uplaćeno u razdoblju</span>
                        {financialLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <span className="font-semibold text-green-600 dark:text-green-500">{accountInfo.totalPaid}</span>
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
        <p className="text-sm text-muted-foreground">Odaberite zgradu za prikaz financijske kartice.</p>
      )}
    </div>
  );
};

export default FinancialCard;
