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
import { formatCurrency, cn } from "@/lib/utils";
import { useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliersData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { toast } from "sonner";

const Suppliers = () => {
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const queryClient = useQueryClient();

  const createSupplier = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač dodan");
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });
  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač ažuriran");
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Dobavljač uklonjen");
      setDeleteConfirm(null);
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška pri uklanjanju"),
  });

  const handleSupplierSave = (data: any) => {
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

  const { data: suppliers = [], isLoading } = useSuppliers({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    search: searchTerm || undefined,
  });
  const totalYearly = suppliers.reduce((sum, s) =>
    sum + parseFloat(String(s.yearlyTotal || "0").replace(/[^\d,]/g, "").replace(",", ".")),
    0
  );
  const totalMonthly = suppliers.reduce((sum, s) =>
    sum + parseFloat(String(s.monthlyAverage || "0").replace(/[^\d,]/g, "").replace(",", ".")),
    0
  );
  const categories = Array.from(new Set(suppliers.map((s: any) => s.category)));

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Dobavljači</h1>
      </header>

      <div className="page-kpi">
        <div className="page-kpi-card">
          <p className="page-kpi-label">Ukupno dobavljača</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value">{suppliers.length}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Kategorija</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value">{categories.length}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Mjesečni prosjek</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-primary">{formatCurrency(totalMonthly)}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Godišnji trošak</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-warning">{formatCurrency(totalYearly)}</p>
          )}
        </div>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <CardTitle className="text-lg">Popis dobavljača</CardTitle>
            <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button variant="outline" size="sm" className="min-h-[32px] gap-2">
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2 min-h-[32px]"
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
              className="min-h-[32px]"
              onClick={() => setCategoryFilter('all')}
            >
              Svi
            </Button>
            {categories.map((category) => (
              <Button 
                key={category} 
                variant={categoryFilter === category ? 'default' : 'outline'} 
                size="sm" 
                className="min-h-[32px]"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          {categoryFilter !== 'all' && (
            <div className="text-sm text-muted-foreground">
              Prikazano {suppliers.length} od {suppliers.length} dobavljača
            </div>
          )}
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
              ) : suppliers.length === 0 ? (
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
                suppliers.map((supplier: any) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
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
                        <Button variant="ghost" size="sm" className="min-h-[32px] h-8" onClick={() => { setEditingSupplier(supplier); setSupplierDialogOpen(true); }}>
                          Uredi
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[32px] h-8 text-destructive hover:text-destructive"
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
          ) : suppliers.length === 0 ? (
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
            suppliers.map((supplier: any) => (
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
                    <Button variant="outline" size="sm" className="flex-1 min-h-[32px]" onClick={() => { setEditingSupplier(supplier); setSupplierDialogOpen(true); }}>
                      Uredi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[32px] text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const categorySuppliers = suppliers.filter((s: any) => (s.category || "Ostalo") === category);
            const categoryTotal = categorySuppliers.reduce(
              (sum: number, s: any) =>
                sum + parseFloat(String(s.yearlyTotal ?? "0").replace(/[^\d,]/g, "").replace(",", ".")),
              0
            );
            return (
              <Card key={category} className="p-4 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{category}</h3>
                <Badge variant="secondary">{categorySuppliers.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
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
