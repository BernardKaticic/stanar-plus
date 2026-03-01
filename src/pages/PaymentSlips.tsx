import { Receipt, Mail, Printer, Calendar, Building2, Check, ChevronsUpDown, Plus, X } from "lucide-react";
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
import { usePaymentSlips } from "@/hooks/usePaymentSlipsData";
import { paymentSlipsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { startOfMonth } from "date-fns";
import { locationsApi } from "@/lib/api";

const PaymentSlips = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { data: historyData, isLoading } = usePaymentSlips({ page, pageSize });
  const history = historyData?.data || [];
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form state
  const [chargeLevel, setChargeLevel] = useState<string>(""); // city, street, building, owner
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>("single"); // single, range, current
  const [singleMonth, setSingleMonth] = useState<Date | undefined>(startOfMonth(new Date()));
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

  const handleGenerateSlips = async () => {
    if (!chargeLevel || !selectedLocation || (!sendEmail && !sendPrint)) return;
    if (periodType === "single" && !singleMonth) return;
    if (periodType === "range" && (!periodFrom || !periodTo)) return;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Uplatnice</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generiranje i slanje uplatnica
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Novo generiranje uplatnica</CardTitle>
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
                      setSingleMonth(startOfMonth(new Date()));
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
                  <div className="pl-8">
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 items-end md:items-center">
                      <Label className="text-sm">Odaberi mjesec:</Label>
                      <MonthPicker
                        date={singleMonth}
                        onDateChange={setSingleMonth}
                        placeholder="Odaberi mjesec"
                      />
                    </div>
                  </div>
                )}

                {periodType === "range" && (
                  <div className="space-y-3 pl-8">
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_1fr] gap-3 items-end">
                      <Label className="text-sm md:self-center">Od:</Label>
                      <MonthPicker
                        date={periodFrom}
                        onDateChange={setPeriodFrom}
                        placeholder="Od mjeseca"
                      />
                      <Label className="text-sm md:self-center">Do:</Label>
                      <MonthPicker
                        date={periodTo}
                        onDateChange={setPeriodTo}
                        placeholder="Do mjeseca"
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
            {selectedLocation && (periodType === "current" || (periodType === "single" && singleMonth) || (periodType === "range" && periodFrom && periodTo)) && (sendEmail || sendPrint) && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
                <p className="font-semibold flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4" />
                  Spremno za generiranje
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Razina</p>
                    <p className="font-semibold">{levels.find(l => l.id === chargeLevel)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Obuhvaća</p>
                    <p className="font-semibold">{locations.find(l => l.id === selectedLocation)?.count}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Lokacija</p>
                    <p className="font-semibold">{locations.find(l => l.id === selectedLocation)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Razdoblje</p>
                    <p className="font-semibold">
                      {periodType === "current" && (() => {
                        const months = ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"];
                        const date = new Date();
                        return `${months[date.getMonth()]} ${date.getFullYear()}`;
                      })()}
                      {periodType === "single" && singleMonth && (() => {
                        const months = ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"];
                        return `${months[singleMonth.getMonth()]} ${singleMonth.getFullYear()}`;
                      })()}
                      {periodType === "range" && periodFrom && periodTo && (() => {
                        const months = ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro"];
                        return `${months[periodFrom.getMonth()]} ${periodFrom.getFullYear()} - ${months[periodTo.getMonth()]} ${periodTo.getFullYear()}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Dostava</p>
                    <p className="font-semibold">
                      {sendEmail && "E-mail"}{sendEmail && sendPrint && " + "}{sendPrint && "Print"}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  (!sendEmail && !sendPrint)
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

        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-semibold mb-2">Brze akcije</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Automatski popuni najčešće kombinacije
          </p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start min-h-[32px]"
              onClick={() => {
                setChargeLevel("city");
                setSelectedLocation("");
                setPeriodType("current");
                setSingleMonth(startOfMonth(new Date()));
                setSendEmail(true);
                setSendPrint(false);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Tekući mjesec – odaberi grad
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start min-h-[32px]"
              onClick={() => {
                setChargeLevel("building");
                setSelectedLocation("");
                setPeriodType("current");
                setSingleMonth(startOfMonth(new Date()));
                setSendEmail(true);
                setSendPrint(false);
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Tekući mjesec – odaberi zgradu
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start min-h-[32px]"
              onClick={() => {
                setChargeLevel("city");
                setSelectedLocation("");
                setPeriodType("range");
                const now = new Date();
                setPeriodFrom(new Date(now.getFullYear(), 0, 1));
                setPeriodTo(new Date(now.getFullYear(), 5, 1));
                setSendEmail(true);
                setSendPrint(false);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Siječanj–Lipanj – odaberi grad
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Povijest poslanih uplatnica</CardTitle>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {history?.length || 0} ukupno
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, i) => (
              <Card key={i} className="p-4 hover:shadow-md transition-shadow">
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_auto] gap-4 items-center">
                  <div>
                    <p className="font-semibold text-sm">{item.period}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {item.date}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Mail className="mr-1 h-3 w-3" />
                      {item.email}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Printer className="mr-1 h-3 w-3" />
                      {item.print}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.count} uplatnica</p>
                    <p className="text-sm font-semibold text-primary">{item.amount.toFixed(2)} €</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setDetailsOpen(true);
                    }}
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    Detalji
                  </Button>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{item.period}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.count} uplatnica</p>
                      <p className="text-sm font-semibold text-primary">{item.amount.toFixed(2)} €</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs flex-1 justify-center">
                      <Mail className="mr-1 h-3 w-3" />
                      {item.email}
                    </Badge>
                    <Badge variant="outline" className="text-xs flex-1 justify-center">
                      <Printer className="mr-1 h-3 w-3" />
                      {item.print}
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full min-h-[32px]"
                    onClick={() => {
                      setSelectedItem(item);
                      setDetailsOpen(true);
                    }}
                  >
                    Pregledaj detalje
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Nema poslanih uplatnica</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generirane uplatnice će se prikazivati ovdje
            </p>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalji uplatnice</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Razdoblje</p>
                  <p className="font-semibold text-sm">{selectedItem.period}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Datum slanja</p>
                  <p className="font-semibold text-sm">{selectedItem.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Broj uplatnica</p>
                  <p className="font-semibold text-sm">{selectedItem.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ukupan iznos</p>
                  <p className="font-semibold text-sm text-primary">{selectedItem.amount.toFixed(2)} €</p>
                </div>
              </div>

              {/* Delivery Methods */}
              <div>
                <Label className="text-sm mb-3 block">Način dostave</Label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="px-3 py-2">
                    <Mail className="mr-2 h-4 w-4" />
                    E-mail: {selectedItem.email}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2">
                    <Printer className="mr-2 h-4 w-4" />
                    Print: {selectedItem.print}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm mb-3 block">Primatelji ({selectedItem.count})</Label>
                <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">
                  Detalji primatelja po uplatnici nisu dostupni.
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Preuzmi PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Ponovno pošalji
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSlips;
