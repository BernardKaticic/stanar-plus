import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Home, User, Mail, Phone, FileText, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

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
}

interface ApartmentDetailDialogProps {
  apartment: Apartment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (apartment: Apartment) => void;
  onDelete: (id: string, number: string) => void;
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
  buildingName,
  streetName,
  cityName,
  fees,
}: ApartmentDetailDialogProps) => {
  if (!apartment) return null;

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  const reserveContribution = fees ? fees.reservePerSqm * apartment.area : null;
  const loanContribution = fees ? fees.loan * apartment.area : null;
  const totalCharge = fees ? (reserveContribution ?? 0) + (loanContribution ?? 0) + fees.cleaning : null;
  const hasDebt = apartment.debt > 0;

  // Calculate running balance
  const transactionsWithBalance = apartment.transactions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((transaction, index, arr) => {
      const previousBalance = index === 0 ? 0 : (arr[index - 1] as any).balance || 0;
      const balance = previousBalance + (transaction.type === "charge" ? -transaction.amount : transaction.amount);
      return { ...transaction, balance };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 w-full">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                Stan {apartment.number}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Ulaz {buildingName}, {streetName}, {cityName}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end pr-10 sm:pr-12">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[28px] gap-2"
                onClick={() => onEdit(apartment)}
              >
                <Edit2 className="h-4 w-4" />
                Uredi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[28px] gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60"
                onClick={() => onDelete(apartment.id, apartment.number)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                Obriši
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">
                <User className="h-4 w-4 mr-2" />
                Informacije
              </TabsTrigger>
              <TabsTrigger value="balance">
                <Receipt className="h-4 w-4 mr-2" />
                Bilanca
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Financije</h3>
                    <Badge variant={hasDebt ? "destructive" : "default"}>
                      {hasDebt ? "Ima dugovanja" : "Nema dugovanja"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Pričuva (ukupno)</p>
                      <p className="text-xl font-semibold text-success">
                        {formatCurrency(apartment.reserve)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dugovanje</p>
                      <p className="text-xl font-semibold text-destructive">
                        {formatCurrency(apartment.debt)}
                      </p>
                    </div>
                    {totalCharge !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Mjesečna rata</p>
                        <p className="text-xl font-semibold">{formatCurrency(totalCharge)}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold">Osnovne informacije</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Broj stana</span>
                      <span className="font-medium">{apartment.number}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Površina</span>
                      <span className="font-medium">{apartment.area} m²</span>
                    </div>
                  </div>
                </Card>
              </div>

              {fees && (
                <Card className="p-4">
                  <h3 className="font-semibold">Naknade po stavkama</h3>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-muted-foreground">Čišćenje</p>
                      <p className="font-medium mt-1">{formatCurrency(fees.cleaning)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-muted-foreground">Kredit</p>
                      <p className="font-medium mt-1">
                        {loanContribution !== null ? formatCurrency(loanContribution) : "-"} ({fees.loan.toLocaleString("hr-HR", { minimumFractionDigits: 2 })} €/m²)
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-muted-foreground">Pričuva</p>
                      <p className="font-medium mt-1">
                        {reserveContribution !== null ? formatCurrency(reserveContribution) : "-"} ({fees.reservePerSqm.toLocaleString("hr-HR", { minimumFractionDigits: 2 })} €/m²)
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-muted-foreground">Ukupno mjesečno</p>
                      <p className="font-semibold mt-1">
                        {totalCharge !== null ? formatCurrency(totalCharge) : "-"}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {(apartment.owner || apartment.tenant || apartment.phone || apartment.email || apartment.contact) && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kontakti
                  </h3>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    {apartment.owner && (
                      <div>
                        <p className="text-muted-foreground">Vlasnik</p>
                        <p className="font-medium mt-1">{apartment.owner}</p>
                      </div>
                    )}
                    {apartment.tenant && (
                      <div>
                        <p className="text-muted-foreground">Stanar</p>
                        <p className="font-medium mt-1">{apartment.tenant}</p>
                      </div>
                    )}
                    {apartment.phone && (
                      <div>
                        <p className="text-muted-foreground">Telefon</p>
                        <a
                          href={`tel:${apartment.phone}`}
                          className="font-medium hover:text-primary"
                        >
                          {apartment.phone}
                        </a>
                      </div>
                    )}
                    {apartment.email && (
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${apartment.email}`}
                          className="font-medium hover:text-primary"
                        >
                          {apartment.email}
                        </a>
                      </div>
                    )}
                    {apartment.contact && (
                      <div>
                        <p className="text-muted-foreground">Dodatni kontakt</p>
                        <p className="font-medium mt-1">{apartment.contact}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {apartment.notes && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bilješke
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {apartment.notes}
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="balance" className="mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Pregled transakcija</h3>
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
                  <div className="overflow-x-auto">
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
                        {transactionsWithBalance.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.type === "charge" ? "Zaduženje" : "Plaćanje"} {transaction.period}
                            </TableCell>
                            <TableCell>
                              {format(transaction.date, "d.M.yyyy.", { locale: hr })}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {transaction.description}
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

