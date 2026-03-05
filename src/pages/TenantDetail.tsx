import { useState, useMemo } from "react";
import { User, Mail, Phone, FileText, Download, Send, Loader2, ChevronLeft, Calendar } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { tenantsApi } from "@/lib/api";

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: () => tenantsApi.getById(id!),
    enabled: !!id,
  });

  const allTransactions = tenant?.transactions ?? [];
  const paymentHistory = useMemo(() => {
    if (!dateFrom && !dateTo) return allTransactions;
    return allTransactions.filter((tx) => {
      const d = (tx as { dateIso?: string }).dateIso;
      if (!d) return true;
      if (dateFrom && d < format(dateFrom, "yyyy-MM-dd")) return false;
      if (dateTo && d > format(dateTo, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [allTransactions, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Suvlasnik nije pronađen</p>
      </div>
    );
  }

  const aptNum = tenant.apartment_number ?? tenant.apartmentNumber;
  const address = tenant.building?.street
    ? `${tenant.building.street.city.name}, ${tenant.building.street.name} ${tenant.building.number}, Stan ${aptNum}`
    : "";
  const monthlyRateRaw = tenant.monthlyRate ?? (tenant.size_m2 ? (Number(tenant.size_m2) * 0.9).toFixed(2) : "0,00");
  const monthlyRate = monthlyRateRaw.includes("€") ? monthlyRateRaw : monthlyRateRaw + " €";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate("/tenants")} aria-label="Natrag na popis suvlasnika">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1>{tenant.tenant?.full_name || "Nepoznat"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kartica suvlasnika</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>{tenant.tenant?.full_name || "Nepoznat"}</CardTitle>
                  <CardDescription>{address}</CardDescription>
                </div>
              </div>
              <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Ispis kartice
                </Button>
                <Button className="gap-2">
                  <Send className="h-4 w-4" />
                  Pošalji e-mailom
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Adresa:</span>
              <span className="font-medium text-right">{address}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Površina:</span>
              <span className="font-medium">{tenant.size_m2} m²</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">E-mail:</span>
              <span className="font-medium">{tenant.tenant?.email || "-"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Telefon:</span>
              <span className="font-medium">{tenant.tenant?.phone || "-"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Način slanja:</span>
              <Badge variant="outline">
                {tenant.deliveryMethod === "email" ? (
                  <>
                    <Mail className="mr-1 h-3 w-3" />
                    E-mail
                  </>
                ) : tenant.deliveryMethod === "both" ? (
                  <>E-mail i pošta</>
                ) : tenant.deliveryMethod === "pošta" ? (
                  <>Pošta</>
                ) : (
                  <>Nije odabrano</>
                )}
              </Badge>
            </div>
          </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Struktura troška</CardTitle>
            <CardDescription>
              Stavke i ukupna mjesečna rata
            </CardDescription>
          </CardHeader>
          <CardContent>
          {tenant.feeBreakdown ? (
            <>
              <div className="space-y-4">
                {(() => {
                  const fb = tenant.feeBreakdown;
                  const perSqm = [
                    { label: "Pričuva", v: fb.reservePerSqm ?? 0 },
                    { label: "Kredit", v: fb.loanPerSqm ?? 0 },
                    { label: "Štednja", v: fb.savingsPerSqm ?? 0 },
                  ].filter((x) => x.v !== 0);
                  const totalPerSqm = (fb.reservePerSqm ?? 0) + (fb.loanPerSqm ?? 0) + (fb.savingsPerSqm ?? 0);
                  if (totalPerSqm !== 0) perSqm.push({ label: "Ukupno/m²", v: totalPerSqm, isTotal: true });
                  const fixed = [
                    { label: "Čišćenje", v: fb.cleaningFee ?? 0 },
                    { label: "Štednja", v: fb.savingsFixed ?? 0 },
                    { label: "Izvanredni", v: fb.extraFixed ?? 0 },
                    { label: "Struja", v: fb.electricityFixed ?? 0 },
                  ].filter((x) => x.v !== 0);
                  return (
                    <>
                      {perSqm.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Naknade po m²</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {perSqm.map(({ label, v, isTotal }) => (
                              <div
                                key={label}
                                className={isTotal ? "p-4 bg-primary/10 rounded-lg border border-primary/20" : "p-4 bg-muted/50 rounded-lg"}
                              >
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <p className={isTotal ? "text-lg font-bold text-primary" : "text-lg font-semibold"}>
                                  {v.toFixed(2).replace(".", ",")} €
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {fixed.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Fiksne naknade (po stanu)</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {fixed.map(({ label, v }) => (
                              <div key={label} className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <p className="text-lg font-semibold">{v.toFixed(2).replace(".", ",")} €</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Struktura troška nije dostupna (suvlasnik nije dodijeljen stanu).</p>
          )}

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Mjesečna rata:</span>
              <span className="text-3xl font-bold text-primary">{monthlyRate}</span>
            </div>
            {tenant.feeBreakdown && tenant.size_m2 && (
              <p className="text-xs text-muted-foreground mt-2">
                = (ukupno/m² × {tenant.size_m2} m²) + fiksne naknade
              </p>
            )}
          </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financijska kartica</CardTitle>
          <CardDescription>
            Pregled zaduženja, uplatnica i opomena
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Tabs defaultValue="financial">
          <TabsList>
            <TabsTrigger value="financial">Financijska kartica</TabsTrigger>
            <TabsTrigger value="payments">Uplatnice</TabsTrigger>
            <TabsTrigger value="warnings">Opomene</TabsTrigger>
            <TabsTrigger value="documents">Dokumenti</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-[32px] gap-2">
                    <Calendar className="h-4 w-4" />
                    Prilagodi period
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium">Od</Label>
                        <DatePicker
                          date={dateFrom}
                          onDateChange={setDateFrom}
                          placeholder="Odaberi datum"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium">Do</Label>
                        <DatePicker
                          date={dateTo}
                          onDateChange={setDateTo}
                          placeholder="Odaberi datum"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDateFrom(startOfYear(new Date()));
                          setDateTo(endOfMonth(new Date()));
                        }}
                      >
                        Ove godine
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDateFrom(undefined);
                          setDateTo(undefined);
                          setPeriodOpen(false);
                        }}
                      >
                        Sve transakcije
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vrsta dokumenta</TableHead>
                    <TableHead>Datum zaduženja</TableHead>
                    <TableHead className="text-right">Iznos</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!paymentHistory || paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {dateFrom || dateTo
                          ? "Nema transakcija u odabranom periodu"
                          : "Nema podataka o plaćanjima"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <Badge variant={item.isPaid ? "default" : "secondary"}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          item.isPaid ? "text-success" : "text-warning"
                        }`}>
                          {item.amount}
                        </TableCell>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          item.balance.startsWith("-") ? "text-destructive" : "text-success"
                        }`}>
                          {item.balance}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Pošalji karticu e-mailom
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-2">Povijest uplatnica</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ovdje će biti prikazane sve poslane uplatnice za ovog suvlasnika
              </p>
              <Button>Generiraj novu uplatnicu</Button>
            </div>
          </TabsContent>

          <TabsContent value="warnings" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-2">Povijest opomena</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trenutno nema poslanih opomena za ovog suvlasnika
              </p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-2">Dokumenti</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ugovori, odluke i ostali dokumenti vezani za suvlasnika
              </p>
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDetail;
