import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Building2, TrendingUp, TrendingDown, Download, Wallet, Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format, startOfDay, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { locationsApi, financialApi, suppliersApi } from "@/lib/api";

const FinancialCard = () => {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date>(startOfDay(new Date()));

  const { data: locationsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const locations = locationsList.map((l: any) => ({ id: l.id, label: l.name }));
  const buildingId = selectedAddress?.startsWith("building-") ? selectedAddress.replace("building-", "") : "";

  const { data: financial } = useQuery({
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
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.getAll({}),
    enabled: !!buildingId,
  });

  const accountInfo = financial
    ? {
        currentBalance: financial.currentBalance,
        totalCharged: financial.totalCharged,
        totalPaid: financial.totalPaid,
        previousYearCarryover: (financial as any).previousYearCarryover ?? "0,00 €",
        totalExpenses: (financial as any).totalExpenses ?? "0,00 €",
      }
    : {
        currentBalance: "0,00 €",
        totalCharged: "0,00 €",
        totalPaid: "0,00 €",
        previousYearCarryover: "0,00 €",
        totalExpenses: "0,00 €",
      };
  const transactions = financial?.transactions ?? [];
  const supplierList = suppliers.map((s: any) => ({
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Financijska kartica</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pregled financijskih podataka po adresi
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Filteri: Adresa i Datumi */}
      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          {/* Autocomplete za adresu */}
          <div className="space-y-2">
            <Label className="block text-sm">Pretraži adresu</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {selectedAddress
                        ? locations.find((loc) => loc.id === selectedAddress)?.label
                        : "Odaberi adresu..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Pretraži adresu..." />
                  <CommandList>
                    <CommandEmpty>Adresa nije pronađena.</CommandEmpty>
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
                              selectedAddress === location.id
                                ? "opacity-100"
                                : "opacity-0"
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

          {/* Date picker - Datum od */}
          <div className="space-y-2">
            <Label className="block text-sm">Datum od</Label>
            <DatePicker
              date={dateFrom}
              onDateChange={setDateFrom}
              placeholder="Odaberi datum"
            />
          </div>

          {/* Date picker - Datum do */}
          <div className="space-y-2">
            <Label className="block text-sm">Datum do</Label>
            <DatePicker
              date={dateTo}
              onDateChange={setDateTo}
              placeholder="Odaberi datum"
            />
          </div>
        </div>
      </Card>

      {/* Tabovi: Stanje i Dobavljači */}
      <Tabs defaultValue="balance" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="balance">Stanje</TabsTrigger>
          <TabsTrigger value="suppliers">Dobavljači</TabsTrigger>
        </TabsList>

        {/* Tab: Dobavljači */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-semibold mb-4">
              Dobavljači za odabranu adresu
            </h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dobavljač</TableHead>
                    <TableHead>Kategorija</TableHead>
                    <TableHead className="text-right">
                      {dateFrom || dateTo ? "Ukupno u periodu" : "Mjesečni prosjek"}
                    </TableHead>
                    <TableHead className="text-right">
                      {dateFrom || dateTo ? "Broj računa" : "Godišnje"}
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Nema dobavljača za odabranu adresu
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    supplierList.map((supplier, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.category}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {supplier.monthlyAvg}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {supplier.yearly}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">Aktivan</Badge>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Stanje */}
        <TabsContent value="balance" className="space-y-6">
          {/* KPI kartice */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trenutno stanje</p>
                  <p className="text-2xl font-bold text-primary">
                    {accountInfo.currentBalance}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Donos</p>
              <p className="text-xl font-bold">{accountInfo.previousYearCarryover}</p>
              <p className="text-xs text-muted-foreground mt-1">iz 2024.</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Ukupno zaduženo</p>
              <p className="text-xl font-bold text-success">
                {accountInfo.totalCharged}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs text-success">+5,2%</span>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Ukupni troškovi</p>
              <p className="text-xl font-bold text-destructive">
                {accountInfo.totalExpenses}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-xs text-destructive">-2,1%</span>
              </div>
            </Card>
          </div>

          {/* Transakcije */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-base font-semibold mb-4">Nedavne transakcije</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Opis</TableHead>
                      <TableHead className="text-right">Iznos</TableHead>
                      <TableHead className="text-right">Stanje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Nema transakcija za prikaz
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {transaction.date}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "uplata" ? "default" : "secondary"
                            }
                          >
                            {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.amount.startsWith("-")
                              ? "text-destructive"
                              : "text-success"
                          }`}
                        >
                          {transaction.amount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {transaction.balance}
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Rekapitulacija */}
            <div className="space-y-6">
              <Card className="p-4 sm:p-6">
                <h3 className="text-base font-semibold mb-4">
                  Rekapitulacija prometa
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Naplata</span>
                      <span className="font-semibold">84,5%</span>
                    </div>
                    <Progress value={84.5} className="h-2" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Ukupno zaduženo:
                      </span>
                      <span className="font-semibold">
                        {accountInfo.totalCharged}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Ukupno uplaćeno:
                      </span>
                      <span className="font-semibold text-success">
                        {accountInfo.totalPaid}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preostalo:</span>
                      <span className="font-semibold text-warning">
                        7.333,39 €
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialCard;
