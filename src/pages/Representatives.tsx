import { Plus, Search, FileText, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useRepresentatives } from "@/hooks/useRepresentativesData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { representativesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { exportTableToCSV } from "@/lib/export";
import { RepresentativeDialog } from "@/components/representatives/RepresentativeDialog";
import { toast } from "sonner";

type AppError = {
  body?: { message?: string };
  message?: string;
};

type RepresentativeItem = {
  id: string;
  personId?: string;
  buildingId?: string;
  name: string;
  building: string;
  oib?: string | null;
  email?: string | null;
  phone?: string | null;
  iban?: string | null;
  monthlyIncome?: string | null;
  paymentFrequency?: string | null;
  status?: string;
};

type RepresentativePayload = {
  buildingId?: string;
  personId: string;
  name: string;
  email?: string;
  phone?: string;
  oib?: string;
  iban?: string;
  monthlyIncome: number;
  paymentFrequency?: string;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err && "body" in err) {
    const bodyMessage = (err as AppError).body?.message;
    if (typeof bodyMessage === "string" && bodyMessage.trim()) return bodyMessage;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
};

const parseEuroAmount = (value: string | null | undefined): number =>
  parseFloat(String(value || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0;

const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Mjesečno",
  quarterly: "Kvartalno",
  semi_annual: "Polugodišnje",
  annual: "Godišnje",
};

const getPaymentFrequencyLabel = (rep: RepresentativeItem): string => {
  const raw = String(rep.paymentFrequency || rep.status || "monthly");
  return PAYMENT_FREQUENCY_LABELS[raw] || "Mjesečno";
};

const Representatives = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [repDialogOpen, setRepDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<RepresentativeItem | null>(null);
  const queryClient = useQueryClient();

  const { data: representatives = [], isLoading } = useRepresentatives(searchTerm || undefined);
  const typedRepresentatives = (Array.isArray(representatives) ? representatives : []) as RepresentativeItem[];
  const visibleRepresentatives = useMemo(() => typedRepresentatives, [typedRepresentatives]);
  const totalPages = Math.max(1, Math.ceil(visibleRepresentatives.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRepresentatives = useMemo(
    () => visibleRepresentatives.slice((safePage - 1) * pageSize, safePage * pageSize),
    [visibleRepresentatives, safePage, pageSize]
  );
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const createRep = useMutation({
    mutationFn: (data: RepresentativePayload) => representativesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["representatives"] });
      toast.success("Predstavnik dodan");
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, "Greška")),
  });
  const updateRep = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RepresentativePayload }) => representativesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["representatives"] });
      toast.success("Predstavnik ažuriran");
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, "Greška")),
  });

  const handleRepSave = (data: RepresentativePayload) => {
    const duplicateBuilding = typedRepresentatives.some((rep) => {
      if (editingRep && rep.id === editingRep.id) return false;
      const sameBuilding = String(rep.buildingId || "") === String(data.buildingId || "");
      return sameBuilding;
    });

    if (duplicateBuilding) {
      toast.error("Zgrada već ima dodijeljenog predstavnika");
      return;
    }

    if (editingRep) {
      updateRep.mutate(
        { id: editingRep.id, data },
        { onSuccess: () => { setRepDialogOpen(false); setEditingRep(null); } }
      );
      return;
    }
    createRep.mutate(data, {
      onSuccess: () => { setRepDialogOpen(false); setEditingRep(null); },
    });
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Predstavnici suvlasnika</h1>
      </header>

      <Card className="rounded-lg border border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <CardTitle className="text-lg">Popis predstavnika</CardTitle>
            <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                className="min-h-[36px] gap-2"
                onClick={() => {
                  exportTableToCSV(
                    visibleRepresentatives.map((r) => ({
                      name: r.name,
                      building: r.building,
                      oib: r.oib,
                      email: r.email,
                      phone: r.phone,
                      iban: r.iban,
                      monthlyIncome: r.monthlyIncome,
                      paymentFrequency: getPaymentFrequencyLabel(r),
                    })),
                    [
                      { key: "name", label: "Predstavnik" },
                      { key: "building", label: "Zgrada" },
                      { key: "oib", label: "OIB" },
                      { key: "email", label: "Email" },
                      { key: "phone", label: "Telefon" },
                      { key: "iban", label: "IBAN" },
                      { key: "monthlyIncome", label: "Mjesečni dohodak" },
                      { key: "paymentFrequency", label: "Način plaćanja" },
                    ],
                    "predstavnici"
                  );
                  toast.success("CSV exportan");
                }}
                disabled={visibleRepresentatives.length === 0}
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
              <Button type="button" className="gap-2 min-h-[36px]" onClick={() => { setEditingRep(null); setRepDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Označi predstavnika
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pretraži po imenu, OIB-u ili zgradi..."
                className="pl-9"
                aria-label="Pretraži predstavnike po imenu i zgradi"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Predstavnik</TableHead>
                  <TableHead className="text-xs font-medium">Zgrada</TableHead>
                  <TableHead className="text-xs font-medium">Kontakt</TableHead>
                  <TableHead className="text-xs font-medium">IBAN</TableHead>
                  <TableHead className="text-right text-xs font-medium">Mjesečni dohodak</TableHead>
                  <TableHead className="text-xs font-medium">Način plaćanja</TableHead>
                  <TableHead className="text-right text-xs font-medium">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : visibleRepresentatives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={Users}
                        title={searchTerm ? "Nema predstavnika za odabranu pretragu" : "Nema predstavnika"}
                        description={
                          searchTerm
                            ? "Promijenite pojam pretrage."
                            : "Označite prvog predstavnika suvlasnika."
                        }
                        action={{ label: "Označi predstavnika", onClick: () => { setEditingRep(null); setRepDialogOpen(true); } }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRepresentatives.map((rep) => (
                    <TableRow key={rep.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium text-sm">{rep.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{rep.oib || "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs">{rep.building || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{rep.email || "—"}</div>
                        <div>{rep.phone || "—"}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{rep.iban || "—"}</TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{rep.monthlyIncome || "0,00 €"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPaymentFrequencyLabel(rep)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => { setEditingRep(rep); setRepDialogOpen(true); }}>
                          Uredi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {isLoading ? (
              [1, 2].map((i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </Card>
              ))
            ) : visibleRepresentatives.length === 0 ? (
              <EmptyState
                icon={Users}
                title={searchTerm ? "Nema predstavnika za odabranu pretragu" : "Nema predstavnika"}
                description={
                  searchTerm
                    ? "Promijenite pojam pretrage."
                    : "Označite prvog predstavnika suvlasnika."
                }
                action={{ label: "Označi predstavnika", onClick: () => { setEditingRep(null); setRepDialogOpen(true); } }}
              />
            ) : (
              pagedRepresentatives.map((rep) => (
                <Card key={rep.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{rep.name}</h3>
                        <p className="text-xs text-muted-foreground">{rep.building || "—"}</p>
                      </div>
                      <Badge variant="outline">{getPaymentFrequencyLabel(rep)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Mjesečni dohodak</p>
                        <p className="font-semibold tabular-nums">{rep.monthlyIncome || "0,00 €"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kontakt</p>
                        <p className="truncate">{rep.email || rep.phone || "—"}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full min-h-[36px]" onClick={() => { setEditingRep(rep); setRepDialogOpen(true); }}>
                      Uredi
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
          {visibleRepresentatives.length > 0 && (
            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={visibleRepresentatives.length}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      <RepresentativeDialog
        open={repDialogOpen}
        onOpenChange={(o) => { setRepDialogOpen(o); if (!o) setEditingRep(null); }}
        onSave={handleRepSave}
        takenBuildingIds={typedRepresentatives
          .map((rep) => String(rep.buildingId || "").replace("building-", ""))
          .filter(Boolean)}
        editItem={editingRep}
        isPending={createRep.isPending || updateRep.isPending}
      />
    </div>
  );
};

export default Representatives;
