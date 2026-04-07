import { Truck, Plus, Mail, Phone, Euro, Search, FileText, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useSuppliers } from "@/hooks/useSuppliersData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";
import { SupplierDialog, type SupplierFormData } from "@/components/suppliers/SupplierDialog";
import { exportTableToCSV } from "@/lib/export";
import { toast } from "sonner";

type AppError = {
  body?: { message?: string };
  message?: string;
};

type SupplierItem = {
  id: string;
  name: string;
  category?: string | null;
  oib?: string | null;
  contact?: string | null;
  email?: string | null;
  iban?: string | null;
  monthlyAverage?: string | null;
  yearlyTotal?: string | null;
  lastInvoice?: string | null;
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

const Suppliers = () => {
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const queryClient = useQueryClient();

  const createSupplier = useMutation({
    mutationFn: (data: SupplierFormData) => suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač dodan");
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, "Greška")),
  });
  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač ažuriran");
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, "Greška")),
  });

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač uklonjen");
      setDeleteConfirm(null);
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, "Greška pri uklanjanju")),
  });

  const handleSupplierSave = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplier.mutate(
        { id: editingSupplier.id, data },
        { onSuccess: () => { setSupplierDialogOpen(false); setEditingSupplier(null); } }
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => { setSupplierDialogOpen(false); setEditingSupplier(null); },
      });
    }
  };

  const { data: suppliers = [], isLoading } = useSuppliers();
  const allSuppliers = (Array.isArray(suppliers) ? suppliers : []) as SupplierItem[];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const allCategories = useMemo(
    () =>
      Array.from(new Set(allSuppliers.map((s) => s.category || "Ostalo"))).sort((a, b) =>
        a.localeCompare(b, "hr-HR")
      ),
    [allSuppliers]
  );
  const filteredSuppliers = useMemo(
    () =>
      allSuppliers.filter((s) => {
        const byCategory = categoryFilter === "all" || (s.category || "Ostalo") === categoryFilter;
        if (!normalizedSearch) return byCategory;
        const haystack = `${s.name || ""} ${s.oib || ""} ${s.contact || ""} ${s.email || ""} ${s.iban || ""}`.toLowerCase();
        return byCategory && haystack.includes(normalizedSearch);
      }),
    [allSuppliers, categoryFilter, normalizedSearch]
  );
  const visibleCategories = useMemo(
    () => Array.from(new Set(filteredSuppliers.map((s) => s.category || "Ostalo"))),
    [filteredSuppliers]
  );
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedSuppliers = useMemo(
    () => filteredSuppliers.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredSuppliers, safePage, pageSize]
  );
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  const totalYearly = filteredSuppliers.reduce((sum, s) => sum + parseEuroAmount(s.yearlyTotal), 0);
  const totalMonthly = filteredSuppliers.reduce((sum, s) => sum + parseEuroAmount(s.monthlyAverage), 0);

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Dobavljači</h1>
      </header>

      <div className="page-kpi">
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Ukupno dobavljača</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums">{filteredSuppliers.length}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Kategorija</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums">{visibleCategories.length}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Mjesečni prosjek</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums text-primary">{formatCurrency(totalMonthly)}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Godišnji trošak</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums text-warning">{formatCurrency(totalYearly)}</p>
          )}
        </div>
      </div>

      <Card className="rounded-lg border border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <CardTitle className="text-lg">Popis dobavljača</CardTitle>
            <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[36px] gap-2"
                onClick={() => {
                  exportTableToCSV(
                    filteredSuppliers.map((s) => ({
                      name: s.name,
                      category: s.category,
                      oib: s.oib,
                      contact: s.contact,
                      email: s.email,
                      iban: s.iban,
                      monthlyAverage: s.monthlyAverage,
                      yearlyTotal: s.yearlyTotal,
                    })),
                    [
                      { key: "name", label: "Dobavljač" },
                      { key: "category", label: "Kategorija" },
                      { key: "oib", label: "OIB" },
                      { key: "contact", label: "Kontakt" },
                      { key: "email", label: "Email" },
                      { key: "iban", label: "IBAN" },
                      { key: "monthlyAverage", label: "Mjesečni prosjek" },
                      { key: "yearlyTotal", label: "Godišnje" },
                    ],
                    "dobavljaci"
                  );
                  toast.success("CSV exportan");
                }}
                disabled={filteredSuppliers.length === 0}
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2 min-h-[36px]"
                onClick={() => { setEditingSupplier(null); setSupplierDialogOpen(true); }}
              >
                <Plus className="h-4 w-4" />
                Dodaj dobavljača
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži dobavljače..."
                className="pl-10"
                aria-label="Pretraži dobavljače po nazivu"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={categoryFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[36px]"
              onClick={() => setCategoryFilter('all')}
            >
              Svi
            </Button>
            {allCategories.map((category) => (
              <Button 
                key={category} 
                variant={categoryFilter === category ? 'default' : 'outline'} 
                size="sm" 
                className="min-h-[36px]"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                <TableHead className="text-xs font-medium">Kategorija</TableHead>
                <TableHead className="text-xs font-medium">OIB</TableHead>
                <TableHead className="text-xs font-medium">Kontakt</TableHead>
                <TableHead className="text-xs font-medium">IBAN</TableHead>
                <TableHead className="text-right text-xs font-medium">Mjesečni prosjek</TableHead>
                <TableHead className="text-right text-xs font-medium">Godišnje</TableHead>
                <TableHead className="text-right text-xs font-medium w-24">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={Truck}
                      title="Nema dobavljača"
                      description={searchTerm || categoryFilter !== "all" ? "Promijenite pretragu ili filter kategorije." : "Dodajte prvog dobavljača."}
                      action={
                        <Button size="sm" onClick={() => { setEditingSupplier(null); setSupplierDialogOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj dobavljača
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pagedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell className="font-medium">
                      <div>
                        <div>
                          <p>{supplier.name ?? "–"}</p>
                          <p className="text-xs text-muted-foreground">
                            Zadnja faktura: {supplier.lastInvoice ?? "–"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.category ?? "Ostalo"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{supplier.oib ?? "–"}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {(supplier.contact || supplier.email) ? (
                          <>
                            {supplier.contact && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{supplier.contact}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{supplier.email}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          "–"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{supplier.iban ?? "–"}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{supplier.monthlyAverage ?? "–"}</TableCell>
                    <TableCell className="text-right font-bold text-warning tabular-nums">{supplier.yearlyTotal ?? "–"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => { setEditingSupplier(supplier); setSupplierDialogOpen(true); }}>
                          Uredi
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[36px] text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ id: supplier.id, name: supplier.name })}
                          aria-label="Obriši"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <SupplierDialog
          open={supplierDialogOpen}
          onOpenChange={(o) => { setSupplierDialogOpen(o); if (!o) setEditingSupplier(null); }}
          onSave={handleSupplierSave}
          editItem={editingSupplier}
          isPending={createSupplier.isPending || updateSupplier.isPending}
        />

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ukloniti dobavljača?</AlertDialogTitle>
              <AlertDialogDescription>
                Dobavljač <strong>{deleteConfirm?.name}</strong> bit će uklonjen. Ova radnja se može poništiti samo ponovnim dodavanjem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Odustani</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteConfirm && deleteSupplier.mutate(deleteConfirm.id)}
                disabled={deleteSupplier.isPending}
              >
                {deleteSupplier.isPending ? "Uklanjanje..." : "Ukloni"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : filteredSuppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nema dobavljača"
              description={searchTerm || categoryFilter !== "all" ? "Promijenite pretragu ili filter." : "Dodajte prvog dobavljača."}
              action={
                <Button size="sm" onClick={() => { setEditingSupplier(null); setSupplierDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj dobavljača
                </Button>
              }
            />
          ) : (
            pagedSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{supplier.name ?? "–"}</h3>
                      <Badge variant="outline" className="mt-1">{supplier.category ?? "Ostalo"}</Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Zadnja faktura: {supplier.lastInvoice ?? "–"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground text-xs">Mjesečno</p>
                      <p className="font-semibold text-primary tabular-nums">{supplier.monthlyAverage ?? "–"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Godišnje</p>
                      <p className="font-bold text-warning tabular-nums">{supplier.yearlyTotal ?? "–"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Kontakt</p>
                      <div className="space-y-0.5 text-xs">
                        {supplier.contact && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{supplier.contact}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {!supplier.contact && !supplier.email && "–"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">IBAN</p>
                      <p className="font-mono text-xs break-all">{supplier.iban ?? "–"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">OIB</p>
                      <p className="font-mono text-xs">{supplier.oib ?? "–"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 min-h-[36px]" onClick={() => { setEditingSupplier(supplier); setSupplierDialogOpen(true); }}>
                      Uredi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[36px] text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm({ id: supplier.id, name: supplier.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        {filteredSuppliers.length > 0 && (
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredSuppliers.length}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
          />
        )}
        </CardContent>
      </Card>

      {visibleCategories.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category) => {
            const categorySuppliers = filteredSuppliers.filter((s) => (s.category || "Ostalo") === category);
            const categoryTotal = categorySuppliers.reduce(
              (sum: number, s) => sum + parseEuroAmount(s.yearlyTotal),
              0
            );
            return (
              <Card key={category} className="rounded-lg border border-border/70 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{category}</h3>
                <Badge variant="secondary" className="tabular-nums">{categorySuppliers.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(categoryTotal)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Godišnje</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Suppliers;
