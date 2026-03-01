import { useState } from "react";
import { User, Mail, Download, Send, Loader2, ChevronLeft, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, startOfYear, endOfMonth } from "date-fns";
import { hr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { personsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const formatDelivery = (dm: string | null | undefined) => {
  if (dm === "email") return "E-mail";
  if (dm === "pošta") return "Pošta";
  if (dm === "both") return "E-mail i pošta";
  return "Nije odabrano";
};

const PersonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedAptIndex, setSelectedAptIndex] = useState(0);

  const { data: person, isLoading } = useQuery({
    queryKey: ["person-detail", id],
    queryFn: () => personsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Suvlasnik nije pronađen</p>
      </div>
    );
  }

  const activeApt = person.apartments[selectedAptIndex] ?? person.apartments[0];
  const filteredTransactions = activeApt?.transactions
    ? (dateFrom || dateTo)
      ? activeApt.transactions.filter((tx) => {
          const d = (tx as { dateIso?: string }).dateIso;
          if (!d) return true;
          if (dateFrom && d < format(dateFrom, "yyyy-MM-dd")) return false;
          if (dateTo && d > format(dateTo, "yyyy-MM-dd")) return false;
          return true;
        })
      : activeApt.transactions
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate("/tenants")} aria-label="Natrag na popis suvlasnika">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1>{person.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kartica suvlasnika {person.totalApartments > 1 && `• ${person.totalApartments} stana`}
          </p>
        </div>
      </div>

      {/* Redak: suvlasnik 40% | popis stanova 60% */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle>{person.name}</CardTitle>
                <CardDescription className="truncate">
                  {person.apartments[0]?.address || person.apartments.map((a) => a.address || a.city).filter(Boolean).join(", ") || "–"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium truncate text-right ml-2">{person.email || "–"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Telefon:</span>
                <span className="font-medium">{person.phone || "–"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Način slanja:</span>
                <Badge variant="outline">{formatDelivery(person.deliveryMethod)}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t justify-end">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Ispis kartice
              </Button>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Pošalji e-mailom
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popis stanova */}
        {person.apartments.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Stanovi suvlasnika</p>
            <div className="rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Stan</TableHead>
                  <TableHead className="text-xs font-medium">Adresa</TableHead>
                  <TableHead className="text-right text-xs font-medium">Mjesečna rata</TableHead>
                  <TableHead className="text-right text-xs font-medium">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {person.apartments.map((apt, i) => (
                  <TableRow
                    key={apt.tenantId}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedAptIndex === i && "bg-primary/5"
                    )}
                    onClick={() => setSelectedAptIndex(i)}
                  >
                    <TableCell className="font-medium">Stan {apt.apartmentNumber || i + 1}</TableCell>
                    <TableCell className="text-muted-foreground">{apt.address || apt.city || "–"}</TableCell>
                    <TableCell className="text-right font-medium">{apt.monthlyRate ?? "–"}</TableCell>
                    <TableCell className={cn("text-right font-semibold", apt.balanceNum < 0 ? "text-destructive" : "text-success")}>
                      {apt.balance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {person.totalApartments > 1 && (
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Ukupno:</span>
              <span className="font-semibold">{person.totalMonthlyRate}</span>
              <span className={cn("font-semibold", person.totalBalanceNum < 0 ? "text-destructive" : "text-success")}>
                {person.totalBalance}
              </span>
            </div>
          )}
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center text-muted-foreground">
            <p className="font-medium">Nema stanova</p>
            <p className="text-sm mt-1">Ova osoba nije povezana ni s jednim stanom.</p>
          </div>
        )}
      </div>

      {/* Sadržaj odabranog stana */}
      {activeApt && (
        <div className="space-y-6">
          <p className="text-sm font-medium text-muted-foreground">
            Stan {activeApt.apartmentNumber} {activeApt.address && `• ${activeApt.address}`}
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Struktura troška</CardTitle>
            </CardHeader>
            <CardContent>
              {activeApt.feeBreakdown ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Naknade po m²</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Pričuva</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.reservePerSqm ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Kredit</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.loanPerSqm ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Štednja</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.savingsPerSqm ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-0.5">Ukupno/m²</p>
                          <p className="font-bold text-primary">
                            {((activeApt.feeBreakdown.reservePerSqm || 0) + (activeApt.feeBreakdown.loanPerSqm || 0) + (activeApt.feeBreakdown.savingsPerSqm || 0)).toFixed(2).replace(".", ",")} €
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Fiksne naknade (po stanu)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Čišćenje</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.cleaningFee ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Štednja</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.savingsFixed ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Izvanredni</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.extraFixed ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Struja</p>
                          <p className="font-semibold">{(activeApt.feeBreakdown.electricityFixed ?? 0).toFixed(2).replace(".", ",")} €</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                    <span className="font-semibold">Mjesečna rata</span>
                    <span className="text-xl font-bold text-primary">{activeApt.monthlyRate}</span>
                  </div>
                  {activeApt.size_m2 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      = (ukupno/m² × {activeApt.size_m2} m²) + fiksne naknade
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Struktura troška nije dostupna.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financijska kartica</CardTitle>
              <CardDescription>
                Pregled zaduženja, uplatnica i transakcija za odabrani stan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Pregled zaduženja i uplata</h3>
                  <p className="text-sm text-muted-foreground">
                    {dateFrom || dateTo ? (
                      <>
                        Period: {dateFrom ? format(dateFrom, "d.M.yyyy.", { locale: hr }) : "..."} –{" "}
                        {dateTo ? format(dateTo, "d.M.yyyy.", { locale: hr }) : "danas"}
                      </>
                    ) : (
                      "Sve transakcije"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-sm font-semibold",
                    activeApt.balanceNum < 0 ? "text-destructive" : "text-primary"
                  )}>
                    Saldo: {activeApt.balance}
                  </span>
                  <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="min-h-[36px] gap-2">
                        <Calendar className="h-4 w-4" />
                        Prilagodi period
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                          {!dateFrom && !dateTo ? "Trenutno: Sve transakcije" : dateFrom && dateTo ? `Trenutno: ${format(dateFrom, "d.M.yyyy.", { locale: hr })} – ${format(dateTo, "d.M.yyyy.", { locale: hr })}` : "Odaberi period"}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="block text-sm font-medium">Od</Label>
                            <DatePicker date={dateFrom} onDateChange={setDateFrom} placeholder="Odaberi datum" className="w-full" />
                          </div>
                          <div className="space-y-2">
                            <Label className="block text-sm font-medium">Do</Label>
                            <DatePicker date={dateTo} onDateChange={setDateTo} placeholder="Odaberi datum" className="w-full" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={dateFrom && dateTo && format(dateFrom, "yyyy") === format(new Date(), "yyyy") ? "secondary" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => { setDateFrom(startOfYear(new Date())); setDateTo(endOfMonth(new Date())); setPeriodOpen(false); }}
                          >
                            Ove godine
                          </Button>
                          <Button
                            variant={!dateFrom && !dateTo ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1"
                            onClick={() => { setDateFrom(undefined); setDateTo(undefined); setPeriodOpen(false); }}
                          >
                            Sve transakcije
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium">Vrsta dokumenta</TableHead>
                      <TableHead className="text-xs font-medium">Datum</TableHead>
                      <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                      <TableHead className="text-xs font-medium">Opis</TableHead>
                      <TableHead className="text-right text-xs font-medium">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {dateFrom || dateTo
                            ? "Nema transakcija u odabranom periodu"
                            : "Nema podataka o plaćanjima za ovaj stan"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <Badge variant={item.isPaid ? "default" : "secondary"}>{item.type}</Badge>
                          </TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell className={cn("text-right font-semibold", item.isPaid ? "text-success" : "text-amber-600 dark:text-amber-500")}>
                            {item.amount}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={item.description}>{item.description}</TableCell>
                          <TableCell className={cn("text-right font-bold", String(item.balance).startsWith("-") ? "text-destructive" : "text-success")}>
                            {item.balance}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Ispis kartice
                </Button>
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Pošalji e-mailom
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PersonDetail;
