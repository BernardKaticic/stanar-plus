import { Receipt, Mail, Printer, Calendar, Check, ChevronsUpDown, Plus, MoreVertical, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format, parseISO } from "date-fns";
import { usePaymentSlips } from "@/hooks/usePaymentSlipsData";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentSlipsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { locationsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatSlipDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  try {
    const d = dateStr.length === 10 ? parseISO(dateStr) : new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return format(d, "d.M.yyyy.");
  } catch {
    return dateStr ?? "—";
  }
}

/** Hrvatska sklonidba: 1 stan, 2–4 stana, 5+ stanova */
function pluralStan(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "stan";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "stana";
  return "stanova";
}

/** Hrvatska sklonidba: 1 uplatnica, 2–4 uplatnice, 5+ uplatnica */
function pluralUplatnica(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "uplatnica";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "uplatnice";
  return "uplatnica";
}

const PaymentSlips = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { data: historyData, isLoading } = usePaymentSlips({ page, pageSize });
  const history = historyData?.data || [];
  const totalCount = historyData?.totalCount ?? 0;
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ period?: string; periodMonth?: string; date?: string | null; count: number; amount: number } | null>(null);
  const { data: monthDetails, isLoading: monthDetailsLoading } = useQuery({
    queryKey: ["payment-slips", "by-month", selectedItem?.periodMonth],
    queryFn: () => paymentSlipsApi.getByMonth(selectedItem!.periodMonth!),
    enabled: detailsOpen && !!selectedItem?.periodMonth,
  });
  const monthBatches = monthDetails?.data ?? [];
  const monthSlips = monthDetails?.slips ?? [];

  // Form state
  const [chargeLevel, setChargeLevel] = useState<string>(""); // city, street, building, owner
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>(""); // "", "single", "range", "current"
  const [singleMonth, setSingleMonth] = useState<Date | undefined>(undefined);
  const [periodFrom, setPeriodFrom] = useState<Date | undefined>();
  const [periodTo, setPeriodTo] = useState<Date | undefined>();
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPrint, setSendPrint] = useState(false);

  const levels = [
    { id: "city", name: "Grad", description: "Sve zgrade u gradu" },
    { id: "street", name: "Ulica", description: "Sve zgrade na ulici" },
    { id: "building", name: "Zgrada", description: "Svi stanovi u zgradi" },
    { id: "owner", name: "Suvlasnik", description: "Pojedinačni suvlasnik" },
  ];

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", chargeLevel],
    queryFn: () =>
      locationsApi.getByLevel(
        (chargeLevel as "city" | "street" | "building" | "owner") || "city"
      ),
    enabled: !!chargeLevel,
  });

  const periodReady =
    periodType === "current" ||
    (periodType === "single" && singleMonth) ||
    (periodType === "range" && periodFrom && periodTo);
  const checkParams =
    chargeLevel && selectedLocation && periodReady
      ? {
          chargeLevel,
          locationId: selectedLocation,
          periodType: periodType as "current" | "single" | "range",
          singleMonth:
            periodType === "single" && singleMonth
              ? `${singleMonth.getFullYear()}-${String(singleMonth.getMonth() + 1).padStart(2, "0")}`
              : undefined,
          periodFrom:
            periodType === "range" && periodFrom
              ? `${periodFrom.getFullYear()}-${String(periodFrom.getMonth() + 1).padStart(2, "0")}`
              : undefined,
          periodTo:
            periodType === "range" && periodTo
              ? `${periodTo.getFullYear()}-${String(periodTo.getMonth() + 1).padStart(2, "0")}`
              : undefined,
        }
      : null;

  const { data: checkData, isLoading: checkLoading } = useQuery({
    queryKey: ["payment-slips", "check", checkParams],
    queryFn: () => paymentSlipsApi.check(checkParams!),
    enabled: !!checkParams,
  });

  const canGenerate = checkData?.canGenerate ?? false;
  const alreadyChargedCount = checkData?.alreadyCharged ?? 0;
  const toChargeCount = checkData?.toCharge ?? 0;

  const handleGenerateSlips = async () => {
    if (!chargeLevel || !selectedLocation || (!sendEmail && !sendPrint)) return;
    if (periodType === "single" && !singleMonth) return;
    if (periodType === "range" && (!periodFrom || !periodTo)) return;
    if (checkData && !checkData.canGenerate) return;

    setGenerating(true);
    try {
      const res = await paymentSlipsApi.generate({
        chargeLevel,
        locationId: selectedLocation,
        periodType: periodType as "current" | "single" | "range",
        singleMonth: singleMonth ? `${singleMonth.getFullYear()}-${String(singleMonth.getMonth() + 1).padStart(2, "0")}` : undefined,
        periodFrom: periodFrom ? `${periodFrom.getFullYear()}-${String(periodFrom.getMonth() + 1).padStart(2, "0")}` : undefined,
        periodTo: periodTo ? `${periodTo.getFullYear()}-${String(periodTo.getMonth() + 1).padStart(2, "0")}` : undefined,
        sendEmail,
        sendPrint,
      });
      queryClient.invalidateQueries({ queryKey: ["payment-slips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Uplatnice generirane",
        description: res.message,
      });
    } catch (err: any) {
      toast({
        title: "Greška",
        description: err.body?.message || err.message || "Generiranje nije uspjelo.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Uplatnice</h1>
      </header>

      <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-lg">Novo generiranje uplatnica</CardTitle>
            <CardDescription>
              Odaberite parametre za generiranje i slanje uplatnica
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-6">
            {/* Step 1: Charge Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <Label className="text-sm">Razina zaduženja</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {levels.map((level) => (
                  <Button
                    key={level.id}
                    variant={chargeLevel === level.id ? "default" : "outline"}
                    className="h-auto flex-col items-start p-4 gap-1"
                    onClick={() => {
                      setChargeLevel(level.id);
                      setSelectedLocation("");
                      setPeriodType("");
                      setSingleMonth(undefined);
                      setPeriodFrom(undefined);
                      setPeriodTo(undefined);
                    }}
                  >
                    <span className="font-semibold">{level.name}</span>
                    <span className="text-xs opacity-70 font-normal">{level.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Step 2: Location */}
            {chargeLevel && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    selectedLocation ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    2
                  </div>
                  <Label className="text-sm">
                    Odabir {chargeLevel === "city" ? "grada" : chargeLevel === "street" ? "ulice" : chargeLevel === "building" ? "zgrade" : "suvlasnika"}
                  </Label>
                </div>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={locationOpen}
                      className="w-full justify-between h-auto min-h-[32px]"
                    >
                      <span className="truncate">
                        {selectedLocation
                          ? locations.find((l) => l.id === selectedLocation)?.name
                          : "Odaberi..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Pretraži..." />
                      <CommandList>
                        <CommandEmpty>Nije pronađeno.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((location) => (
                            <CommandItem
                              key={location.id}
                              value={location.name}
                              onSelect={() => {
                                setSelectedLocation(location.id);
                                setPeriodType("");
                                setSingleMonth(undefined);
                                setPeriodFrom(undefined);
                                setPeriodTo(undefined);
                                setLocationOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedLocation === location.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{location.name}</p>
                                <p className="text-xs text-muted-foreground">{location.count}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Step 3: Period Type */}
            {selectedLocation && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    (periodType === "current" || (periodType === "single" && singleMonth) || (periodType === "range" && periodFrom && periodTo))
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    3
                  </div>
                  <Label className="text-sm">Razdoblje zaduženja</Label>
                </div>
                
                <div className="flex flex-wrap gap-2 pl-8">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors",
                    periodType === "current" 
                      ? "bg-primary/10 text-primary border-2 border-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                    onClick={() => {
                      setPeriodType("current");
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    Tekući mjesec
                  </div>
                  <div className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors",
                    periodType === "single" 
                      ? "bg-primary/10 text-primary border-2 border-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                    onClick={() => setPeriodType("single")}
                  >
                    Pojedinačni mjesec
                  </div>
                  <div className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors",
                    periodType === "range" 
                      ? "bg-primary/10 text-primary border-2 border-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                    onClick={() => setPeriodType("range")}
                  >
                    Raspon mjeseci
                  </div>
                </div>

                {/* Period inputs */}
                {periodType === "single" && (
                  <div className="pl-8 flex flex-wrap items-center gap-3">
                    <Label className="text-sm font-medium text-muted-foreground">Mjesec:</Label>
                    <MonthPicker
                      date={singleMonth}
                      onDateChange={setSingleMonth}
                      placeholder="Odaberi mjesec"
                      className="min-w-[180px]"
                    />
                  </div>
                )}

                {periodType === "range" && (
                  <div className="pl-8 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Od:</Label>
                      <MonthPicker
                        date={periodFrom}
                        onDateChange={setPeriodFrom}
                        placeholder="Mjesec"
                        className="min-w-[180px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Do:</Label>
                      <MonthPicker
                        date={periodTo}
                        onDateChange={setPeriodTo}
                        placeholder="Mjesec"
                        className="min-w-[180px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Delivery method */}
            {selectedLocation && (periodType === "current" || (periodType === "single" && singleMonth) || (periodType === "range" && periodFrom && periodTo)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    (sendEmail || sendPrint) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    4
                  </div>
                  <Label className="text-sm">Način slanja</Label>
                </div>
                <div className="flex gap-3 pl-8">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="email" 
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    />
                    <Label htmlFor="email" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="print"
                      checked={sendPrint}
                      onCheckedChange={(checked) => setSendPrint(checked as boolean)}
                    />
                    <Label htmlFor="print" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Print (PDF)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Summary preview */}
            {selectedLocation && periodReady && (sendEmail || sendPrint) && (() => {
              const loc = locations.find(l => l.id === selectedLocation);
              const MONTHS_FULL = ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"];
              const MONTHS_SHORT = ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro"];
              const periodLabel = periodType === "current"
                ? `${MONTHS_FULL[new Date().getMonth()]} ${new Date().getFullYear()}`
                : periodType === "single" && singleMonth
                  ? `${MONTHS_FULL[singleMonth.getMonth()]} ${singleMonth.getFullYear()}`
                  : periodType === "range" && periodFrom && periodTo
                    ? `${MONTHS_SHORT[periodFrom.getMonth()]} ${periodFrom.getFullYear()} – ${MONTHS_SHORT[periodTo.getMonth()]} ${periodTo.getFullYear()}`
                    : "";
              const deliveryLabel = [sendEmail && "E-mail", sendPrint && "Print"].filter(Boolean).join(" + ");
              const hasCheckResult = !checkLoading && checkData !== undefined;
              const toChargeAddresses = checkData?.toChargeAddresses ?? [];
              const apartmentCount = toChargeAddresses.length;
              const slipCount = toChargeCount;

              return (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
                <p className="font-semibold flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4" />
                  Spremno za generiranje
                </p>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Obuhvaća</p>
                    <div className="min-h-[52px]">
                      {checkLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-1">
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          <span className="text-sm">Provjera obuhvata i već zaduženih stanova…</span>
                        </div>
                      ) : hasCheckResult && toChargeAddresses.length > 0 ? (
                        <>
                          <ul className="font-medium text-foreground space-y-0.5 list-none pl-0">
                            {toChargeAddresses.map((addr, i) => (
                              <li key={i}>{addr}</li>
                            ))}
                          </ul>
                          <p className="text-muted-foreground text-xs mt-1">
                            {apartmentCount} {pluralStan(apartmentCount)} za odabrano razdoblje
                          </p>
                        </>
                      ) : hasCheckResult && checkData && !checkData.canGenerate && (checkData.total ?? 0) > 0 ? (
                        <p className="text-muted-foreground py-1">
                          Svi odabrani stanovi su već zaduženi za ovo razdoblje.
                        </p>
                      ) : hasCheckResult ? (
                        <p className="text-muted-foreground py-1">{loc?.name} — {loc?.count}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-primary/10">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Razina</p>
                      <p className="font-medium">{levels.find(l => l.id === chargeLevel)?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Razdoblje</p>
                      <p className="font-medium">{periodLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Dostava</p>
                      <p className="font-medium">{deliveryLabel}</p>
                    </div>
                  </div>
                </div>

                {hasCheckResult && (
                  <div className="pt-3 border-t border-primary/20">
                    {!canGenerate && (checkData?.total ?? 0) > 0 ? (
                      <p className="text-sm text-destructive font-medium">
                        Svi stanovi su već zaduženi za odabrano razdoblje. Nije moguće generirati nove uplatnice.
                      </p>
                    ) : slipCount > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Bit će generirano <strong>{slipCount}</strong> {pluralUplatnica(slipCount)}
                        {apartmentCount > 0 && (
                          <> za <strong>{apartmentCount}</strong> {pluralStan(apartmentCount)}</>
                        )}.
                        {alreadyChargedCount > 0 && (
                          <> <strong>{alreadyChargedCount}</strong> {pluralUplatnica(alreadyChargedCount)} preskočeno (već zaduženo).</>
                        )}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              );
            })()}

            {/* Action button */}
            <div className="pt-2">
              <Button
                className="w-full min-h-[48px]"
                onClick={handleGenerateSlips}
                disabled={
                  generating ||
                  !chargeLevel ||
                  !selectedLocation ||
                  (periodType === "single" && !singleMonth) ||
                  (periodType === "range" && (!periodFrom || !periodTo)) ||
                  (!sendEmail && !sendPrint) ||
                  (!!checkParams && (checkLoading || checkData === undefined || !canGenerate))
                }
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                {generating ? "Generiranje..." : "Generiraj i pošalji uplatnice"}
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>

      <Card className="rounded-md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Povijest poslanih uplatnica</CardTitle>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {history?.length || 0} ukupno
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
        {isLoading ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Razdoblje</TableHead>
                  <TableHead className="text-xs font-medium">Datum</TableHead>
                  <TableHead className="text-xs font-medium">Broj uplatnica</TableHead>
                  <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-10" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : history && history.length > 0 ? (
          <>
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium">Razdoblje</TableHead>
                    <TableHead className="text-xs font-medium">Datum</TableHead>
                    <TableHead className="text-xs font-medium">Broj uplatnica</TableHead>
                    <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                    <TableHead className="text-right text-xs font-medium w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item, i) => (
                    <TableRow
                      key={i}
                      className="hover:bg-muted/30 transition-colors duration-150"
                    >
                      <TableCell className="font-medium">{item.period ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatSlipDate(item.date)}</TableCell>
                      <TableCell>{item.count} {pluralUplatnica(item.count)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setDetailsOpen(true);
                              }}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Pregledaj detalje
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {history.map((item, i) => (
                <Card
                  key={i}
                  className="p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200 rounded-lg border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.period ?? "—"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{formatSlipDate(item.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{item.count} {pluralUplatnica(item.count)}</p>
                      <p className="text-sm font-semibold text-primary">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[32px] mt-3"
                    onClick={() => {
                      setSelectedItem(item);
                      setDetailsOpen(true);
                    }}
                  >
                    Pregledaj detalje
                  </Button>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Nema poslanih uplatnica"
            description="Generirane uplatnice će se prikazivati ovdje"
            className="py-12"
          />
        )}
        {!isLoading && history.length > 0 && (
          <PaginationControls
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
        </CardContent>
      </Card>

      {/* Details Dialog – sve uplatnice odabranog mjeseca */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uplatnice — {selectedItem?.period ?? "—"}</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Razdoblje</p>
                  <p className="font-semibold text-sm">{selectedItem.period ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ukupno uplatnica</p>
                  <p className="font-semibold text-sm">{selectedItem.count} {pluralUplatnica(selectedItem.count)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ukupan iznos</p>
                  <p className="font-semibold text-sm text-primary">{formatCurrency(selectedItem.amount)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm mb-3 block">Popis uplatnica ({monthSlips.length} {pluralUplatnica(monthSlips.length)})</Label>
                {monthDetailsLoading ? (
                  <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Učitavanje…
                  </div>
                ) : monthSlips.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">
                    Nema uplatnica za ovaj mjesec.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium whitespace-nowrap">Datum generiranja</TableHead>
                          <TableHead className="text-xs font-medium">Adresa (stan)</TableHead>
                          <TableHead className="text-right text-xs font-medium whitespace-nowrap">Iznos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthSlips.map((slip, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatSlipDate(slip.batchDate)}</TableCell>
                            <TableCell className="text-sm">{slip.address}</TableCell>
                            <TableCell className="text-right font-medium text-sm">{formatCurrency(slip.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSlips;
