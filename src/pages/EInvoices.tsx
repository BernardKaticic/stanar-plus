import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Plus, Check, Clock, Search, Filter, Edit2, Trash2, AlertCircle, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useEInvoices } from "@/hooks/useEInvoicesData";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { invoicesApi, suppliersApi } from "@/lib/api";
import type { InvoiceEditItem } from "@/components/invoices/InvoiceDialog";
import { ImportPreviewDialog, type ImportPreviewItem } from "@/components/invoices/ImportPreviewDialog";
import { parseXmlInvoice } from "@/lib/xmlInvoiceParser";
import { exportTableToCSV } from "@/lib/export";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

type AppError = {
  body?: { message?: string };
  message?: string;
};

type SupplierOption = {
  id: string;
  name: string;
};

type InvoiceItem = InvoiceEditItem & {
  supplier: string;
  date: string | null;
  dueDate: string | null;
  amount: string;
  amountNum: number;
  status: "pending" | "booked" | "unmatched";
  type?: "xml" | "qr" | "manual" | string;
  accountingGroup?: string | null;
  category?: string | null;
  direction?: "incoming" | "outgoing" | string;
  recipientName?: string | null;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err && "body" in err) {
    const fromBody = (err as AppError).body?.message;
    if (typeof fromBody === "string" && fromBody.trim()) return fromBody;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
};

const pluralRacun = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "račun";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "računa";
  return "računa";
};

const EInvoices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importItems, setImportItems] = useState<ImportPreviewItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const { data: invoices = [], isLoading: invoicesLoading } = useEInvoices({
    status: selectedStatus === "all" ? undefined : selectedStatus,
    search: searchTerm.trim() || undefined,
    direction: selectedDirection === "all" ? undefined : selectedDirection,
  });
  const { data: suppliersList = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.getAll(),
  });
  const typedInvoices = (Array.isArray(invoices) ? invoices : []) as InvoiceItem[];
  const { data: detailedInvoice, isLoading: detailsLoading } = useQuery({
    queryKey: ["invoice", detailsInvoiceId],
    queryFn: () => invoicesApi.getById(String(detailsInvoiceId)) as Promise<InvoiceItem>,
    enabled: detailsOpen && !!detailsInvoiceId,
  });

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      invoicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Račun ažuriran" });
    },
    onError: (e: unknown) =>
      toast({
        title: "Greška",
        description: getErrorMessage(e, "Nije moguće ažurirati"),
        variant: "destructive",
      }),
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Račun obrisan" });
      setDeleteConfirm(null);
    },
    onError: (e: unknown) =>
      toast({
        title: "Greška",
        description: getErrorMessage(e, "Nije moguće obrisati"),
        variant: "destructive",
      }),
  });

  const openDetails = (invoiceId: string) => {
    setDetailsInvoiceId(invoiceId);
    setDetailsOpen(true);
  };

  const openEdit = (invoiceId: string) => navigate(`/e-invoices/${invoiceId}/edit`);

  const handleMarkPaid = (invoice: InvoiceItem) => {
    updateInvoice.mutate({
      id: invoice.id,
      data: { status: "booked", paymentDate: new Date().toISOString().slice(0, 10) },
    });
  };

  const handleXmlFiles = async (files: File[]) => {
    const xmlFiles = files.filter((f) => f.name.toLowerCase().endsWith(".xml"));
    if (xmlFiles.length === 0) {
      toast({ title: "Nema XML datoteka", description: "Odaberite .xml datoteke.", variant: "destructive" });
      return;
    }
    const items: ImportPreviewItem[] = [];
    for (const f of xmlFiles) {
      try {
        const parsed = await parseXmlInvoice(f);
        if (parsed) items.push({ ...parsed, status: "pending" });
      } catch (e) {
        toast({ title: "Greška pri parsiranju", description: `${f.name}: ${(e as Error).message}`, variant: "destructive" });
      }
    }
    if (items.length > 0) {
      setImportItems(items);
      setImportPreviewOpen(true);
    } else {
      toast({ title: "Nije pronađen nijedan račun", description: "XML datoteke ne sadrže prepoznate podatke.", variant: "destructive" });
    }
  };

  const handleImportConfirm = async () => {
    const pending = importItems.filter((i) => i.status === "pending" || !i.status);
    if (pending.length === 0) return;
    setIsImporting(true);
    const currentSuppliers = [...((Array.isArray(suppliersList) ? suppliersList : []) as SupplierOption[])];
    let suppliersInvalidated = false;
    let successCount = 0;
    for (let i = 0; i < importItems.length; i++) {
      const item = importItems[i];
      if (item.status === "done" || item.status === "error") continue;
      setImportItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "importing" as const } : it))
      );
      try {
        const existingSupplier = currentSuppliers.find(
          (s) => (s.name || "").toLowerCase() === (item.supplierName || "").toLowerCase()
        );
        let supplierId: string | undefined = existingSupplier?.id
          ? String(existingSupplier.id)
          : undefined;
        if (!supplierId) {
          const created = await suppliersApi.create({ name: item.supplierName, category: "Ostalo" }) as { id: string };
          supplierId = created?.id;
          if (supplierId) {
            suppliersInvalidated = true;
            currentSuppliers.push({ id: supplierId, name: item.supplierName });
          }
        }
        if (supplierId) {
          await invoicesApi.create({
            supplierId,
            invoiceNumber: item.invoiceNumber,
            date: item.date,
            dueDate: item.dueDate || null,
            amount: item.amount,
            status: "pending",
            category: "Ostalo",
            type: "xml",
          });
          successCount++;
          setImportItems((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: "done" as const } : it))
          );
        } else {
          throw new Error("Nije moguće kreirati dobavljača");
        }
      } catch (e: unknown) {
        const msg = getErrorMessage(e, "Greška");
        setImportItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "error" as const, error: msg } : it))
        );
        toast({ title: `Greška: ${item.invoiceNumber}`, description: msg, variant: "destructive" });
      }
    }
    setIsImporting(false);
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (suppliersInvalidated) {
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      }
      toast({ title: "Uvoz dovršen", description: `${successCount} ${pluralRacun(successCount)} uvezeno.` });
    }
  };

  const stats = useMemo(
    () => ({
      total: typedInvoices.length,
      booked: typedInvoices.filter((i) => i.status === "booked").length,
      pending: typedInvoices.filter((i) => i.status === "pending").length,
      unmatched: typedInvoices.filter((i) => i.status === "unmatched").length,
    }),
    [typedInvoices]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
        return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Knjiženo</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Na čekanju</Badge>;
      case "unmatched":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Neprepoznato</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "xml":
        return <Badge variant="outline">XML</Badge>;
      case "qr":
        return <Badge variant="outline">QR</Badge>;
      case "manual":
        return <Badge variant="outline">Ručno</Badge>;
      default:
        return null;
    }
  };

  const filteredInvoices = typedInvoices;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedInvoices = useMemo(
    () => filteredInvoices.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredInvoices, safePage, pageSize]
  );
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const isDuePast = (dueDateStr: string | null | undefined) => {
    if (!dueDateStr) return false;
    const parts = dueDateStr.split(".").filter(Boolean);
    if (parts.length !== 3) return false;
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59, 999);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getTime() < now.getTime();
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Računi</h1>
      </header>

      <div className="page-kpi">
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Ukupno računa</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums">{stats.total}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Knjiženo</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums text-success">{stats.booked}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Na čekanju</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums text-warning">{stats.pending}</p>
          )}
        </div>
        <div className="page-kpi-card rounded-lg border border-border/70 shadow-sm">
          <p className="page-kpi-label">Neprepoznato</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value tabular-nums text-destructive">{stats.unmatched}</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-fit max-w-full">
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Računi
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Uvoz
          </TabsTrigger>
          <TabsTrigger value="accounting">
            <FileText className="h-4 w-4 mr-2" />
            Grupe troškova
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <CardTitle className="text-lg">Popis računa</CardTitle>
                <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[36px] gap-2"
                    onClick={() => {
                      exportTableToCSV(
                        filteredInvoices.map((i) => ({
                          invoiceNumber: i.invoiceNumber,
                          supplier: i.supplier,
                          date: i.date,
                          dueDate: i.dueDate,
                          amount: i.amount,
                          status: i.status,
                          accountingGroup: i.accountingGroup,
                        })),
                        [
                          { key: "invoiceNumber", label: "Broj računa" },
                          { key: "supplier", label: "Dobavljač" },
                          { key: "date", label: "Datum" },
                          { key: "dueDate", label: "Dospijeće" },
                          { key: "amount", label: "Iznos" },
                          { key: "status", label: "Status" },
                          { key: "accountingGroup", label: "Grupa" },
                        ],
                        "racuni"
                      );
                      toast({ title: "CSV exportan" });
                    }}
                    disabled={filteredInvoices.length === 0}
                  >
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    className="min-h-[36px] gap-2"
                    onClick={() => navigate("/e-invoices/new")}
                  >
                    <Plus className="h-4 w-4" />
                    Novi račun
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Pretraži račune..."
                    className="pl-10"
                    aria-label="Pretraži račune po broju i dobavljaču"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger
                    className="w-full sm:w-[200px] shrink-0 min-h-[36px]"
                    aria-label="Filter statusa računa"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi statusi</SelectItem>
                    <SelectItem value="booked">Knjiženo</SelectItem>
                    <SelectItem value="pending">Na čekanju</SelectItem>
                    <SelectItem value="unmatched">Neprepoznato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                  <SelectTrigger
                    className="w-full sm:w-[190px] shrink-0 min-h-[36px]"
                    aria-label="Filter vrste računa"
                  >
                    <SelectValue placeholder="Vrsta računa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi računi</SelectItem>
                    <SelectItem value="incoming">Ulazni</SelectItem>
                    <SelectItem value="outgoing">Izlazni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium">Broj računa</TableHead>
                      <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                      <TableHead className="text-xs font-medium">Vrsta</TableHead>
                      <TableHead className="text-xs font-medium">Datum</TableHead>
                      <TableHead className="text-xs font-medium">Dospijeće</TableHead>
                      <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="text-right text-xs font-medium w-20">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <EmptyState
                            icon={FileText}
                            title={selectedStatus === "all" ? "Nema računa" : "Nema računa za odabrani filter"}
                            description={selectedStatus === "all" ? "Dodajte račun putem Uvoza ili Kreiraj račun." : "Promijenite filter statusa."}
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150">
                          <TableCell className="font-mono text-sm">{invoice.invoiceNumber ?? "–"}</TableCell>
                          <TableCell className="font-medium">{invoice.supplier ?? "–"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.direction === "outgoing" ? "Izlazni" : "Ulazni"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{invoice.date ?? "–"}</TableCell>
                          <TableCell>
                            <span className={isDuePast(invoice.dueDate) ? "text-destructive font-medium" : ""}>
                              {invoice.dueDate ?? "–"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{invoice.amount ?? "–"}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[36px] min-h-[36px]"
                                aria-label="Detalji"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetails(invoice.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[36px] min-h-[36px]"
                                aria-label="Uredi"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(invoice.id);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {(invoice.status === "pending" || invoice.status === "unmatched") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="min-w-[36px] min-h-[36px] text-success"
                                  aria-label="Označi plaćeno"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkPaid(invoice);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[36px] min-h-[36px] text-destructive"
                                aria-label="Obriši"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({ id: invoice.id, invoiceNumber: invoice.invoiceNumber ?? "-" });
                                }}
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

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {invoicesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <div className="flex justify-between pt-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={selectedStatus === "all" ? "Nema računa" : "Nema računa za odabrani filter"}
                    description={selectedStatus === "all" ? "Dodajte račun putem Uvoza ili Kreiraj račun." : "Promijenite filter statusa."}
                    className="py-12"
                  />
                ) : (
                  pagedInvoices.map((invoice) => (
                    <Card key={invoice.id} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-mono font-medium text-sm">{invoice.invoiceNumber ?? "–"}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{invoice.supplier ?? "–"}</p>
                      <Badge variant="outline" className="mt-2">
                        {invoice.direction === "outgoing" ? "Izlazni" : "Ulazni"}
                      </Badge>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Datum</span>
                        <span>{invoice.date ?? "–"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dospijeće</span>
                        <span className={isDuePast(invoice.dueDate) ? "text-destructive font-medium" : ""}>
                          {invoice.dueDate ?? "–"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold mt-1">
                        <span>Iznos</span>
                        <span className="tabular-nums">{invoice.amount ?? "–"}</span>
                      </div>
                      <div className="flex gap-2 mt-3 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 min-h-[36px]"
                          onClick={() => openDetails(invoice.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalji
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 min-h-[36px]"
                          onClick={() => openEdit(invoice.id)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Uredi
                        </Button>
                        {(invoice.status === "pending" || invoice.status === "unmatched") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 min-h-[36px] text-success"
                            onClick={() => handleMarkPaid(invoice)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Plaćeno
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[36px] text-destructive"
                          onClick={() => setDeleteConfirm({ id: invoice.id, invoiceNumber: invoice.invoiceNumber ?? "-" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              {filteredInvoices.length > 0 && (
                <PaginationControls
                  currentPage={safePage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredInvoices.length}
                  onPageChange={setPage}
                  onPageSizeChange={(next) => {
                    setPageSize(next);
                    setPage(1);
                  }}
                />
              )}

              {stats.unmatched > 0 && !invoicesLoading && (
                <div className="mt-4 p-4 border border-amber-500/50 rounded-lg bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Neprepoznate uplate</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.unmatched} {pluralRacun(stats.unmatched)} nije povezano s uplatama. Povežite ih ručno ili ispravite podatke.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[36px] shrink-0"
                      onClick={() => toast({ title: "Uskoro", description: "Povezivanje uplata s računima bit će dostupno." })}
                    >
                      Poveži uplate
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Uvoz računa</CardTitle>
            </CardHeader>
            <CardContent>
            <FileUpload
              onFilesSelected={(files) => {
                const xmlFiles = files.filter((f) => f.name.toLowerCase().endsWith(".xml"));
                if (xmlFiles.length > 0) {
                  handleXmlFiles(xmlFiles);
                } else if (files.length > 0) {
                  toast({
                    title: "Podržan je samo XML",
                    description: "Za uvoz e-računa odaberite .xml datoteke.",
                    variant: "destructive",
                  });
                }
              }}
              accept=".xml"
              maxFiles={20}
              maxSize={5}
            />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-1">
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ručni unos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unesi podatke ručno
                  </p>
                </div>
                <Button className="w-full min-h-[36px]" variant="outline" onClick={() => navigate("/e-invoices/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj ručno
                </Button>
                <p className="text-xs text-muted-foreground">
                  Popuni sve podatke
                </p>
              </div>
            </Card>
          </div>

        </TabsContent>

        {/* Accounting Groups Tab */}
        <TabsContent value="accounting" className="space-y-4">
          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Grupe troškova</CardTitle>
              <p className="text-sm text-muted-foreground">Pregled grupa korištenih u računima</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const groups = typedInvoices.reduce<Record<string, { count: number; total: number }>>((acc, inv) => {
                  const g = inv.accountingGroup || inv.category || "Ostalo";
                  if (!acc[g]) acc[g] = { count: 0, total: 0 };
                  acc[g].count++;
                  acc[g].total += inv.amountNum ?? 0;
                  return acc;
                }, {});
                const entries = Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
                if (entries.length === 0) {
                  return (
                    <EmptyState
                      icon={FileText}
                      title="Nema grupa troškova"
                      description="Grupe će se prikazati kada budete imali račune s kategorijama."
                      className="py-12"
                    />
                  );
                }
                return (
                  <div className="space-y-2">
                    {entries.map(([name, { count, total }]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <span className="font-medium">{name}</span>
                        <div className="text-sm text-muted-foreground text-right">
                          <p>{count} {pluralRacun(count)}</p>
                          <p className="font-semibold text-foreground tabular-nums">
                            {total.toFixed(2).replace(".", ",")} €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Početno stanje</CardTitle>
              <p className="text-sm text-muted-foreground">Postavke početnog stanja knjige</p>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="Nije konfigurirano"
                description="Početno stanje može se postaviti u financijskoj kartici zgrade."
                className="py-8"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalji računa</DialogTitle>
          </DialogHeader>
          {detailsLoading || !detailedInvoice ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Broj računa</p>
                  <p className="font-mono">{detailedInvoice.invoiceNumber || "–"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Partner</p>
                  <p className="font-medium">{detailedInvoice.supplier || "–"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Vrsta</p>
                  <p>{detailedInvoice.direction === "outgoing" ? "Izlazni račun" : "Ulazni račun"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Iznos</p>
                  <p className="font-semibold tabular-nums">{detailedInvoice.amount || "–"}</p>
                </div>
              </div>
              <div className="rounded-md border">
                <div className="border-b p-3">
                  <p className="font-medium">Stavke računa</p>
                </div>
                {(detailedInvoice.items || []).length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Račun nema stavki.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Opis</TableHead>
                          <TableHead className="text-right">Kol.</TableHead>
                          <TableHead className="text-right">Jedinična cijena</TableHead>
                          <TableHead className="text-right">PDV %</TableHead>
                          <TableHead className="text-right">Iznos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(detailedInvoice.items || []).map((item, idx) => (
                          <TableRow key={`${item.description}-${idx}`}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.unitPrice.toFixed(2).replace(".", ",")} €</TableCell>
                            <TableCell className="text-right tabular-nums">{item.taxRate ?? "–"}</TableCell>
                            <TableCell className="text-right tabular-nums">{(Number(item.amount ?? item.qty * item.unitPrice)).toFixed(2).replace(".", ",")} €</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  className="min-h-[36px]"
                  onClick={() => {
                    setDetailsOpen(false);
                    openEdit(detailedInvoice.id);
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Uredi račun
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImportPreviewDialog
        open={importPreviewOpen}
        onOpenChange={setImportPreviewOpen}
        items={importItems}
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setImportPreviewOpen(false);
          setImportItems([]);
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        }}
        isImporting={isImporting}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati račun?</AlertDialogTitle>
            <AlertDialogDescription>
              Račun {deleteConfirm?.invoiceNumber} bit će trajno obrisan. Ova radnja se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && deleteInvoice.mutate(deleteConfirm.id)}
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EInvoices;
