import { useState } from "react";
import { User, Mail, Download, Send, Loader2, ChevronLeft, Calendar, Edit2, ChevronDown, Building2 } from "lucide-react";
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
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { personsApi, tenantsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generatePersonCardPdf } from "@/lib/personCardPdf";
import { TenantEditDialog } from "@/components/tenants/TenantEditDialog";
import { useUpdateTenant } from "@/hooks/useTenantsManagement";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";

const formatDelivery = (dm: string | null | undefined) => {
  if (dm === "email") return "E-mail";
  if (dm === "pošta") return "Pošta";
  if (dm === "both") return "E-mail i pošta";
  return "Nije odabrano";
};

const PersonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/tenants";
  const [periodOpen, setPeriodOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedAptIndex, setSelectedAptIndex] = useState(0);
  const [editingTenant, setEditingTenant] = useState<{
    id: string;
    name: string;
    oib?: string | null;
    email?: string;
    phone?: string;
    apartment_id?: string | null;
    deliveryMethod?: string | null;
  } | null>(null);

  const queryClient = useQueryClient();
  const updateTenant = useUpdateTenant();

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

  const heroBalance = activeApt?.balance ?? person.totalBalance ?? "0,00 €";
  const heroBalanceNum = activeApt?.balanceNum ?? person.totalBalanceNum ?? 0;

  return (
    <div className="page space-y-5">
      {/* Zaglavlje: osnovne info s labelama, gumbi skroz desno */}
      <header className="page-header border-b border-border/80 bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
          <div className="min-w-0 space-y-1 shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate(from)} aria-label="Natrag">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="page-title text-xl sm:text-2xl truncate">{person.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm pl-10 sm:pl-0">
              <span><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{person.email || "–"}</span></span>
              <span><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{person.phone || "–"}</span></span>
              <span><span className="text-muted-foreground">OIB:</span> <span className="font-mono font-medium">{person.oib || "–"}</span></span>
              <span><span className="text-muted-foreground">Način slanja:</span> <Badge variant="outline" className="ml-0.5 font-normal">{formatDelivery(person.deliveryMethod)}</Badge></span>
            </div>
          </div>
          {/* Spacer: gumbi ostaju skroz desno */}
          <div className="hidden sm:block flex-1 min-w-4" aria-hidden />
          <div className="flex flex-wrap gap-2 shrink-0 justify-end sm:justify-end w-full sm:w-auto">
            {person.apartments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const tenantId = person.apartments[0]?.tenantId;
                  if (!tenantId) return;
                  try {
                    const tenant = await tenantsApi.getById(tenantId);
                    setEditingTenant({
                      id: String(tenant.id),
                      name: tenant.name ?? person.name,
                      oib: tenant.oib ?? person.oib ?? null,
                      email: tenant.email ?? person.email ?? undefined,
                      phone: tenant.phone ?? person.phone ?? undefined,
                      apartment_id: tenant.apartment_id ?? tenant.apartmentId ?? null,
                      deliveryMethod: tenant.deliveryMethod ?? person.deliveryMethod ?? null,
                    });
                  } catch {
                    setEditingTenant(null);
                  }
                }}
              >
                <Edit2 className="h-4 w-4" />
                Uredi
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void generatePersonCardPdf(person)}>
              <Download className="h-4 w-4" />
              Ispis kartice
            </Button>
            <Button size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Pošalji e-mailom
            </Button>
          </div>
        </div>
      </header>

      {/* Popis stanova | Struktura troška */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 min-h-[min(300px,40vh)]">
        {/* Lijevo: Popis stanova – svi stupci vidljivi */}
        <div className="rounded-md border border-border bg-card flex flex-col min-h-0">
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-md">
            <h2 className="text-sm font-semibold">Popis stanova</h2>
          </div>
          <div className="flex-1 overflow-auto p-2 min-w-0">
            {person.apartments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-xs py-2 h-auto whitespace-nowrap">Stan</TableHead>
                        <TableHead className="text-xs py-2 h-auto whitespace-nowrap">Adresa</TableHead>
                        <TableHead className="text-xs py-2 h-auto whitespace-nowrap">Grad</TableHead>
                        <TableHead className="text-right text-xs py-2 h-auto whitespace-nowrap">Kvadratura</TableHead>
                        <TableHead className="text-right text-xs py-2 h-auto whitespace-nowrap">Mjesečna rata</TableHead>
                        <TableHead className="text-right text-xs py-2 h-auto whitespace-nowrap">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {person.apartments.map((apt, i) => (
                        <TableRow
                          key={apt.tenantId}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors border-b-0",
                            selectedAptIndex === i && "bg-primary/10"
                          )}
                          onClick={() => setSelectedAptIndex(i)}
                        >
                          <TableCell className="py-2 font-medium text-sm whitespace-nowrap">Stan {apt.apartmentNumber || i + 1}</TableCell>
                          <TableCell className="py-2 text-muted-foreground text-sm whitespace-nowrap">{apt.address || "–"}</TableCell>
                          <TableCell className="py-2 text-muted-foreground text-sm whitespace-nowrap">{apt.city || "–"}</TableCell>
                          <TableCell className="py-2 text-right text-muted-foreground text-sm whitespace-nowrap">{apt.area ?? apt.size_m2 ? `${apt.area ?? apt.size_m2} m²` : "–"}</TableCell>
                          <TableCell className="py-2 text-right font-medium text-sm whitespace-nowrap">{apt.monthlyRate ?? "–"}</TableCell>
                          <TableCell className={cn("py-2 text-right text-sm font-medium whitespace-nowrap", apt.balanceNum < 0 ? "text-destructive" : "text-success")}>{apt.balance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {person.totalApartments > 1 && (
                  <div className="flex justify-end gap-3 text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Ukupno:</span>
                    <span className={cn("font-semibold", person.totalBalanceNum < 0 ? "text-destructive" : "text-success")}>{person.totalBalance}</span>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Building2}
                title="Nema stanova"
                description="Ova osoba nije povezana ni s jednim stanom."
                className="py-12"
              />
            )}
          </div>
        </div>

        {/* Desno: Struktura troška – uži popis (naziv + iznos) */}
        <div className="rounded-md border border-border bg-card flex flex-col min-h-0 w-full lg:w-[248px] shrink-0">
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-md">
            <h2 className="text-sm font-semibold">Struktura troška</h2>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {activeApt ? (
              activeApt.feeBreakdown ? (
                (() => {
                  const fb = activeApt.feeBreakdown;
                  const totalPerSqm = (fb.reservePerSqm || 0) + (fb.loanPerSqm || 0) + (fb.savingsPerSqm || 0);
                  const rows: { label: string; value: number; bold?: boolean }[] = [];
                  if ((fb.reservePerSqm ?? 0) !== 0) rows.push({ label: "Pričuva (m²)", value: fb.reservePerSqm! });
                  if ((fb.loanPerSqm ?? 0) !== 0) rows.push({ label: "Kredit (m²)", value: fb.loanPerSqm! });
                  if ((fb.savingsPerSqm ?? 0) !== 0) rows.push({ label: "Štednja (m²)", value: fb.savingsPerSqm! });
                  if (totalPerSqm !== 0) rows.push({ label: "Ukupno/m²", value: totalPerSqm, bold: true });
                  if ((fb.cleaningFee ?? 0) !== 0) rows.push({ label: "Čišćenje", value: fb.cleaningFee! });
                  if ((fb.savingsFixed ?? 0) !== 0) rows.push({ label: "Štednja (fiksno)", value: fb.savingsFixed! });
                  if ((fb.extraFixed ?? 0) !== 0) rows.push({ label: "Izvanredni", value: fb.extraFixed! });
                  if ((fb.electricityFixed ?? 0) !== 0) rows.push({ label: "Struja", value: fb.electricityFixed! });
                  return (
                    <div className="space-y-0.5 text-sm">
                      {rows.map(({ label, value, bold }) => (
                        <div key={label} className={cn("flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0", bold && "font-semibold text-primary")}>
                          <span className={cn("text-muted-foreground truncate", bold && "text-foreground")}>{label}</span>
                          <span className="shrink-0 tabular-nums">{value.toFixed(2).replace(".", ",")} €</span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-3 pt-3 mt-2 border-t-2 font-semibold text-primary">
                        <span>Mjesečna rata</span>
                        <span className="tabular-nums">{activeApt.monthlyRate}</span>
                      </div>
                      {activeApt.size_m2 && (
                        <p className="text-xs text-muted-foreground mt-1.5">m² × stope + fiksno</p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground py-4">Struktura troška nije dostupna.</p>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-xs">
                Odaberite stan za prikaz.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ispod: Financijska kartica */}
      {activeApt && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Financijska kartica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Zaduženja i uplate</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={cn(
                    "text-base font-semibold tabular-nums",
                    activeApt.balanceNum < 0 ? "text-destructive" : "text-success"
                  )}>
                    Saldo: {activeApt.balance}
                  </span>
                  <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[36px] gap-2 font-normal justify-between min-w-[200px] sm:min-w-[240px]"
                        aria-expanded={periodOpen}
                        aria-haspopup="dialog"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {!dateFrom && !dateTo ? (
                            "Sve transakcije"
                          ) : dateFrom && dateTo ? (
                            `${format(dateFrom, "d.M.yyyy.", { locale: hr })} – ${format(dateTo, "d.M.yyyy.", { locale: hr })}`
                          ) : dateFrom ? (
                            `Od ${format(dateFrom, "d.M.yyyy.", { locale: hr })}`
                          ) : dateTo ? (
                            `Do ${format(dateTo, "d.M.yyyy.", { locale: hr })}`
                          ) : (
                            "Odaberi period"
                          )}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", periodOpen && "rotate-180")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-foreground">Odabir perioda</p>
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

            </CardContent>
          </Card>
      )}

      <TenantEditDialog
        open={!!editingTenant}
        onOpenChange={(open) => !open && setEditingTenant(null)}
        tenant={editingTenant}
        onSave={(data) => {
          if (!editingTenant) return;
          updateTenant.mutate(
            {
              id: editingTenant.id,
              data: {
                name: data.name,
                oib: data.oib ?? undefined,
                email: data.email || undefined,
                phone: data.phone || undefined,
                apartment_id: data.apartment_id && data.apartment_id !== "__none__" ? data.apartment_id : null,
                delivery_method: data.delivery_method || null,
              },
            },
            {
              onSuccess: () => {
                setEditingTenant(null);
                queryClient.invalidateQueries({ queryKey: ["person-detail", id] });
              },
            }
          );
        }}
        isPending={updateTenant.isPending}
      />
    </div>
  );
};

export default PersonDetail;
