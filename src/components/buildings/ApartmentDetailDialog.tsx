import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Home, User, Mail, Phone, FileText, Receipt, UserCog, UserPlus, Pencil, UserMinus } from "lucide-react";
import { AddCoOwnerDialog } from "./AddCoOwnerDialog";
import { EditShareDialog } from "./EditShareDialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apartmentsApi, tenantsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type OwnershipRow = {
  id?: string;
  personId?: string;
  personName?: string;
  person_name?: string;
  personOib?: string | null;
  person_oib?: string | null;
  validFrom?: string;
  valid_from?: string;
  validTo?: string | null;
  valid_to?: string | null;
  isPrimary?: boolean;
  is_primary?: boolean;
  shareNum?: number;
  shareDen?: number;
};

interface Transaction {
  id: string;
  type: "charge" | "payment";
  date: Date;
  amount: number;
  description: string;
  period?: string;
}

interface Apartment {
  id: string;
  number: string;
  area: number;
  owner?: string;
  ownerOib?: string | null;
  tenant?: string;
  contact?: string;
  email?: string;
  phone?: string;
  debt: number;
  reserve: number;
  notes?: string;
  transactions: Transaction[];
}

interface BuildingFees {
  cleaning: number;
  loan: number;
  reservePerSqm: number;
  savingsFixed?: number;
  extraFixed?: number;
  electricityFixed?: number;
  savingsPerSqm?: number;
}

interface ApartmentDetailDialogProps {
  apartment: Apartment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (apartment: Apartment) => void;
  onDelete: (id: string, number: string) => void;
  onOwnerChangeSuccess?: () => void;
  buildingName: string;
  streetName: string;
  cityName: string;
  fees?: BuildingFees;
}

export const ApartmentDetailDialog = ({
  apartment,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onOwnerChangeSuccess,
  buildingName,
  streetName,
  cityName,
  fees,
}: ApartmentDetailDialogProps) => {

  const { data: ownershipHistoryRaw, refetch: refetchHistory } = useQuery({
    queryKey: ["apartment-ownership-history", apartment?.id],
    queryFn: () => apartmentsApi.getOwnershipHistory(String(apartment!.id)),
    enabled: !!apartment?.id && open,
  });
  const ownershipHistory = Array.isArray(ownershipHistoryRaw) ? ownershipHistoryRaw : [];
  const today = format(new Date(), "yyyy-MM-dd");
  const currentOwners = ownershipHistory.filter((o: OwnershipRow) => {
    const to = o.validTo ?? o.valid_to;
    return to == null || to >= today;
  });

  const [addCoOwnerOpen, setAddCoOwnerOpen] = useState(false);
  const [editShareRow, setEditShareRow] = useState<OwnershipRow | null>(null);
  const [endConfirmRow, setEndConfirmRow] = useState<OwnershipRow | null>(null);
  const [activeTab, setActiveTab] = useState<string>("info");
  const { toast } = useToast();

  const handleEndOwnership = async () => {
    if (!endConfirmRow?.id) return;
    try {
      await apartmentsApi.endOwnership(String(apartment.id), String(endConfirmRow.id));
      onOwnerChangeSuccess?.();
      refetchHistory();
      setEndConfirmRow(null);
      toast({ title: "Vlasništvo završeno" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Nije moguće završiti vlasništvo.";
      toast({ title: "Greška", description: msg, variant: "destructive" });
    }
  };

  if (!apartment) return null;

  const apartmentNumber = (apartment as { number?: string; apartment_number?: string }).number ?? (apartment as { apartment_number?: string }).apartment_number ?? "–";
  const formatCurrency = (value?: number | null) =>
    `${(typeof value === "number" && !Number.isNaN(value) ? value : 0).toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  const rawArea = (apartment as { area?: unknown; area_m2?: unknown; size_m2?: unknown }).area;
  const rawAreaM2 = (apartment as { area_m2?: unknown }).area_m2;
  const rawSizeM2 = (apartment as { size_m2?: unknown }).size_m2;
  const areaNum = (typeof rawArea === "number" && !Number.isNaN(rawArea))
    ? rawArea
    : (typeof rawAreaM2 === "number" && !Number.isNaN(rawAreaM2))
      ? rawAreaM2
      : (typeof rawSizeM2 === "number" && !Number.isNaN(rawSizeM2))
        ? rawSizeM2
        : (typeof rawArea === "string" || typeof rawAreaM2 === "string" || typeof rawSizeM2 === "string")
          ? (Number(rawArea) || Number(rawAreaM2) || Number(rawSizeM2) || 0)
          : 0;
  const area = Number.isNaN(Number(areaNum)) ? 0 : Number(areaNum);
  const reserveContribution = fees ? (fees.reservePerSqm ?? 0) * area : null;
  const loanContribution = fees ? (fees.loan ?? 0) * area : null;
  const savingsPerSqmContribution = fees ? (fees.savingsPerSqm ?? 0) * area : null;
  const fixedFees = fees
    ? (fees.cleaning ?? 0) + (fees.savingsFixed ?? 0) + (fees.extraFixed ?? 0) + (fees.electricityFixed ?? 0)
    : 0;
  const totalCharge = fees
    ? (reserveContribution ?? 0) + (loanContribution ?? 0) + (savingsPerSqmContribution ?? 0) + fixedFees
    : null;
  const hasDebt = (apartment.debt ?? 0) > 0;

  const rawTransactions = Array.isArray(apartment.transactions) ? apartment.transactions : [];
  const toDate = (d: unknown): Date => (d instanceof Date ? d : typeof d === "string" ? new Date(d) : new Date(0));
  const transactionsWithBalance = [...rawTransactions]
    .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
    .map((transaction, index, arr) => {
      const previousBalance = index === 0 ? 0 : (arr[index - 1] as { balance?: number })?.balance ?? 0;
      const balance = previousBalance + (transaction.type === "charge" ? -Number(transaction.amount) : Number(transaction.amount));
      return { ...transaction, date: toDate(transaction.date), balance };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] w-full flex flex-col p-0 gap-0 overflow-hidden !flex">
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/80 space-y-1 pr-12 shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-3 w-full">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Home className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Stan {apartmentNumber}</span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ulaz {buildingName}, {streetName}, {cityName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[28px] gap-1.5"
                onClick={() => onEdit(apartment)}
              >
                <Edit2 className="h-4 w-4" />
                Uredi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[28px] gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60"
                onClick={() => onDelete(String(apartment.id), apartmentNumber)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                Obriši
              </Button>
            </div>
          </div>
        </DialogHeader>

        <AddCoOwnerDialog
          apartmentId={String(apartment.id)}
          apartmentNumber={apartmentNumber}
          open={addCoOwnerOpen}
          onOpenChange={setAddCoOwnerOpen}
          onSuccess={() => {
            onOwnerChangeSuccess?.();
            refetchHistory();
          }}
          onSubmit={async (data) => {
            if ("personId" in data) {
              await apartmentsApi.addOwner(String(apartment.id), { personId: data.personId, shareNum: data.shareNum, shareDen: data.shareDen });
            } else {
              const res = await tenantsApi.create({
                apartment_id: String(apartment.id),
                name: data.ownerName,
                oib: data.ownerOib ?? undefined,
                email: data.email ?? undefined,
                phone: data.phone ?? undefined,
                delivery_method: data.delivery_method ?? undefined,
              });
              const ownershipId = (res as { id?: string })?.id;
              if (ownershipId && data.shareNum != null && data.shareDen != null && (data.shareNum !== 1 || data.shareDen !== 1)) {
                await apartmentsApi.updateOwnershipShare(String(apartment.id), String(ownershipId), { shareNum: data.shareNum, shareDen: data.shareDen });
              }
            }
          }}
        />

        {editShareRow && (editShareRow.id != null) && (
          <EditShareDialog
            open={!!editShareRow}
            onOpenChange={(open) => !open && setEditShareRow(null)}
            personName={editShareRow.personName ?? editShareRow.person_name ?? "–"}
            shareNum={editShareRow.shareNum ?? 1}
            shareDen={editShareRow.shareDen ?? 1}
            onSuccess={() => {
              onOwnerChangeSuccess?.();
              refetchHistory();
              setEditShareRow(null);
            }}
            onSubmit={async (num, den) => {
              await apartmentsApi.updateOwnershipShare(String(apartment.id), String(editShareRow.id), { shareNum: num, shareDen: den });
            }}
          />
        )}

        <AlertDialog open={!!endConfirmRow} onOpenChange={(open) => !open && setEndConfirmRow(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Završiti vlasništvo?</AlertDialogTitle>
              <AlertDialogDescription>
                Vlasništvo za {endConfirmRow ? (endConfirmRow.personName ?? endConfirmRow.person_name ?? "ovu osobu") : ""} bit će završeno od danas. Osoba više neće biti suvlasnik ovog stana.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Odustani</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleEndOwnership()}
              >
                Završi vlasništvo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="px-6 pb-6 pt-4 flex flex-col min-h-0 flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || "info")} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1.5 mb-6 rounded-lg overflow-hidden shrink-0">
              <TabsTrigger value="info" className="rounded-md py-2 text-sm gap-1.5">
                <User className="h-4 w-4" />
                Informacije
              </TabsTrigger>
              <TabsTrigger value="balance" className="rounded-md py-2 text-sm gap-1.5">
                <Receipt className="h-4 w-4" />
                Bilanca
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto mt-0 pt-0">
            {activeTab === "info" && (
              <div className="space-y-4">
              {/* Financije + Osnovno u jednom redu */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Financije</h3>
                    <Badge variant={hasDebt ? "destructive" : "secondary"} className="text-xs">
                      {hasDebt ? "Ima dugovanja" : "U redu"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-0.5 text-sm">
                    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Pričuva</span>
                      <span className="font-medium tabular-nums text-success">{formatCurrency(apartment.reserve ?? 0)}</span>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Dugovanje</span>
                      <span className="font-medium tabular-nums text-destructive">{formatCurrency(apartment.debt ?? 0)}</span>
                    </div>
                    {totalCharge !== null && (
                      <div className="flex justify-between gap-3 py-1.5 font-semibold">
                        <span>Mjesečna rata</span>
                        <span className="tabular-nums">{formatCurrency(totalCharge)}</span>
                      </div>
                    )}
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Osnovno</h3>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Broj stana</span>
                      <span className="font-medium">{apartmentNumber}</span>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-muted-foreground">Površina</span>
                      <span className="font-medium tabular-nums">{area} m²</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Naknade – kompaktni popis kao u kartici suvlasnika */}
              {fees && (() => {
                const items = [
                  { label: "Čišćenje", show: (fees.cleaning ?? 0) !== 0, fmt: () => formatCurrency(fees.cleaning) },
                  { label: "Kredit", show: (fees.loan ?? 0) !== 0, fmt: () => `${formatCurrency(loanContribution ?? 0)} (${(fees.loan ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2 })} €/m²)` },
                  { label: "Pričuva", show: (fees.reservePerSqm ?? 0) !== 0, fmt: () => `${formatCurrency(reserveContribution ?? 0)} (${(fees.reservePerSqm ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2 })} €/m²)` },
                  { label: "Štednja (fiksno)", show: (fees.savingsFixed ?? 0) !== 0, fmt: () => formatCurrency(fees.savingsFixed) },
                  { label: "Izvanredni", show: (fees.extraFixed ?? 0) !== 0, fmt: () => formatCurrency(fees.extraFixed) },
                  { label: "Struja", show: (fees.electricityFixed ?? 0) !== 0, fmt: () => formatCurrency(fees.electricityFixed) },
                  { label: "Štednja (€/m²)", show: (fees.savingsPerSqm ?? 0) !== 0, fmt: () => `${formatCurrency(savingsPerSqmContribution ?? 0)} (${(fees.savingsPerSqm ?? 0).toLocaleString("hr-HR", { minimumFractionDigits: 2 })} €/m²)` },
                ].filter((x) => x.show);
                const total = totalCharge ?? 0;
                if (total !== 0) items.push({ label: "Ukupno mjesečno", show: true, fmt: () => formatCurrency(total), isTotal: true });
                if (items.length === 0) return null;
                return (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Naknade po stavkama</h3>
                    <div className="space-y-0.5 text-sm">
                      {items.map(({ label, fmt, isTotal }) => (
                        <div
                          key={label}
                          className={`flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0 ${isTotal ? "font-semibold pt-2 mt-1 border-t-2" : ""}`}
                        >
                          <span className={isTotal ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                          <span className="shrink-0 tabular-nums font-medium">{fmt()}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })()}

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Suvlasnici
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setAddCoOwnerOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Dodaj suvlasnika
                  </Button>
                </div>
                {currentOwners.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nema unesenih suvlasnika za ovaj stan.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vlasnik</TableHead>
                        <TableHead className="font-mono">OIB</TableHead>
                        <TableHead className="text-center">Udio</TableHead>
                        <TableHead className="text-center">Primarni</TableHead>
                        <TableHead className="w-[120px] text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOwners.map((o: OwnershipRow, idx: number) => {
                        const num = o.shareNum ?? 1;
                        const den = o.shareDen ?? 1;
                        const pct = den > 0 ? ((num / den) * 100).toFixed(0) : "–";
                        const name = o.personName ?? o.person_name ?? "–";
                        const oib = o.personOib ?? o.person_oib ?? "–";
                        const oid = o.id ?? `co-${idx}`;
                        return (
                          <TableRow key={oid}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell className="font-mono text-muted-foreground text-sm">{oib}</TableCell>
                            <TableCell className="text-center">{num}/{den} ({pct}%)</TableCell>
                            <TableCell className="text-center">{(o.isPrimary ?? o.is_primary) ? "Da" : "–"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setEditShareRow(o)}
                                  title="Uredi udio"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setEndConfirmRow(o)}
                                  title="Završi vlasništvo"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>

              {ownershipHistory.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Povijest vlasništva
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Od kad tko plaća – zaduženja se pripisuju vlasniku u odabranom razdoblju.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vlasnik</TableHead>
                        <TableHead>Od</TableHead>
                        <TableHead>Do</TableHead>
                        <TableHead className="text-center">Primarni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ownershipHistory.map((o: OwnershipRow, idx: number) => {
                        const fromRaw = o.validFrom ?? o.valid_from;
                        const toRaw = o.validTo ?? o.valid_to;
                        const parseDate = (raw: unknown): string => {
                          if (raw == null) return "–";
                          let d: Date;
                          if (raw instanceof Date) {
                            d = raw;
                          } else if (typeof raw === "string" && raw.trim()) {
                            const s = raw.trim();
                            d = new Date(s.includes("T") ? s : s + "T12:00:00");
                          } else {
                            return "–";
                          }
                          if (Number.isNaN(d.getTime())) return "–";
                          return format(d, "d.M.yyyy.", { locale: hr });
                        };
                        const fromStr = parseDate(fromRaw);
                        const toStr = parseDate(toRaw);
                        return (
                          <TableRow key={o.id ?? `ownership-${idx}`}>
                            <TableCell className="font-medium">{o.personName ?? o.person_name ?? "–"}</TableCell>
                            <TableCell>{fromStr}</TableCell>
                            <TableCell>{toStr}</TableCell>
                            <TableCell className="text-center">{(o.isPrimary ?? o.is_primary) ? "Da" : "–"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {apartment.notes && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bilješke
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {apartment.notes}
                  </p>
                </Card>
              )}
              </div>
            )}

            {activeTab === "balance" && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-sm font-semibold">Pregled transakcija</h3>
                  <Button size="sm" variant="outline" className="min-h-[32px]">
                    <Receipt className="h-4 w-4 mr-2" />
                    Dodaj transakciju
                  </Button>
                </div>

                {transactionsWithBalance.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nema transakcija</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vrsta dokumenta</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead className="text-right">Iznos</TableHead>
                          <TableHead>Opis</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsWithBalance.map((transaction, txIdx) => (
                          <TableRow key={transaction.id ?? `tx-${txIdx}`}>
                            <TableCell className="font-medium">
                              {transaction.type === "charge" ? "Zaduženje" : "Plaćanje"}
                              {transaction.period != null ? ` ${transaction.period}` : ""}
                            </TableCell>
                            <TableCell>
                              {format(transaction.date instanceof Date ? transaction.date : new Date(transaction.date as string), "d.M.yyyy.", { locale: hr })}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {transaction.description ?? "–"}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.balance < 0 ? 'text-destructive' : transaction.balance > 0 ? 'text-success' : ''}`}>
                              {formatCurrency(transaction.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            )}
            </div>
          </Tabs>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

