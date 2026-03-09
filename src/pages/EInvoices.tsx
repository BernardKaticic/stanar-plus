import { useState } from "react";
import { 
  FileText, 
  Upload, 
  QrCode, 
  Plus, 
  Download, 
  Check, 
  X,
  Clock,
  Search,
  Filter,
  Send,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronsUpDown,
  Building2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEInvoices } from "@/hooks/useEInvoicesData";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api";

const EInvoices = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date>();
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const { toast } = useToast();

  const { data: invoices = [], isLoading: invoicesLoading } = useEInvoices({
    status: selectedStatus === "all" ? undefined : selectedStatus,
    search: searchTerm.trim() || undefined,
  });
  const { data: recipientsList = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const recipients = recipientsList.map((b: any) => ({ id: b.id, name: b.name }));

  const stats = {
    total: invoices.length,
    booked: invoices.filter((i: any) => i.status === "booked").length,
    pending: invoices.filter((i: any) => i.status === "pending").length,
    unmatched: invoices.filter((i: any) => i.status === "unmatched").length,
    totalAmount: invoices.reduce((sum: number, i: any) =>
      sum + parseFloat(String(i.amount || "0").replace(/[^\d,]/g, "").replace(",", ".")),
      0
    ),
  };

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

  const filteredInvoices = invoices;

  const isDuePast = (dueDateStr: string | null | undefined) => {
    if (!dueDateStr) return false;
    const parts = dueDateStr.split(".").filter(Boolean);
    if (parts.length !== 3) return false;
    const d = new Date(parts[2] + "-" + parts[1] + "-" + parts[0]);
    return !isNaN(d.getTime()) && d < new Date();
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Računi</h1>
      </header>

      <div className="page-kpi">
        <div className="page-kpi-card">
          <p className="page-kpi-label">Ukupno računa</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value">{stats.total}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Knjiženo</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-success">{stats.booked}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Na čekanju</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-warning">{stats.pending}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Neprepoznato</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-12 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-destructive">{stats.unmatched}</p>
          )}
        </div>
        <div className="page-kpi-card">
          <p className="page-kpi-label">Ukupan iznos</p>
          {invoicesLoading ? (
            <Skeleton className="h-8 w-20 mt-1.5" />
          ) : (
            <p className="page-kpi-value text-primary">{formatCurrency(stats.totalAmount)}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Računi
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Uvoz
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Kreiraj račun
          </TabsTrigger>
          <TabsTrigger value="accounting">
            <FileText className="h-4 w-4 mr-2" />
            Grupe troškova
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="rounded-md">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <CardTitle className="text-lg">Popis računa</CardTitle>
                <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
                  <Button variant="outline" size="sm" className="min-h-[32px] gap-2">
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button size="sm" className="min-h-[32px] gap-2">
                    <Send className="h-4 w-4" />
                    Pošalji račune
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                  placeholder="Pretraži račune..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
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
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium">Broj računa</TableHead>
                      <TableHead className="text-xs font-medium">Dobavljač</TableHead>
                      <TableHead className="text-xs font-medium">Datum</TableHead>
                      <TableHead className="text-xs font-medium">Dospijeće</TableHead>
                      <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                      <TableHead className="text-xs font-medium">Tip</TableHead>
                      <TableHead className="text-xs font-medium">Grupa</TableHead>
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
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-14" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            icon={FileText}
                            title={selectedStatus === "all" ? "Nema računa" : "Nema računa za odabrani filter"}
                            description={selectedStatus === "all" ? "Dodajte račun putem Uvoza ili Kreiraj račun." : "Promijenite filter statusa."}
                            className="py-12"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150">
                          <TableCell className="font-mono text-sm">{invoice.invoiceNumber ?? "–"}</TableCell>
                          <TableCell className="font-medium">{invoice.supplier ?? "–"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{invoice.date ?? "–"}</TableCell>
                          <TableCell>
                            <span className={isDuePast(invoice.dueDate) ? "text-destructive font-medium" : ""}>
                              {invoice.dueDate ?? "–"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{invoice.amount ?? "–"}</TableCell>
                          <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{invoice.accountingGroup ?? "–"}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" className="min-w-[36px] min-h-[32px] h-8" aria-label="Uredi">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {invoice.status === "unmatched" && (
                                <Button variant="ghost" size="sm" className="min-w-[36px] min-h-[32px] h-8 text-success" aria-label="Označi plaćeno">
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="min-w-[36px] min-h-[32px] h-8 text-destructive" aria-label="Obriši">
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
                  filteredInvoices.map((invoice: any) => (
                    <Card key={invoice.id} className="p-4 border rounded-lg hover:border-primary/20 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-mono font-medium text-sm">{invoice.invoiceNumber ?? "–"}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{invoice.supplier ?? "–"}</p>
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
                        <Button variant="ghost" size="sm" className="flex-1 h-8">
                          <Edit2 className="h-4 w-4 mr-1" />
                          Uredi
                        </Button>
                        {invoice.status === "unmatched" && (
                          <Button variant="ghost" size="sm" className="flex-1 h-8 text-success">
                            <Check className="h-4 w-4 mr-1" />
                            Plaćeno
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {stats.unmatched > 0 && !invoicesLoading && (
                <div className="mt-4 p-4 border border-amber-500/50 rounded-lg bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Neprepoznate uplate</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.unmatched} račun(a) nije povezano s uplatama. Povežite ih ručno ili ispravite podatke.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="min-h-[32px] shrink-0">
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
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Uvoz računa</CardTitle>
            </CardHeader>
            <CardContent>
            <FileUpload
              onFilesSelected={(files) => {
                toast({
                  title: "Datoteke učitane",
                  description: `Učitano ${files.length} datoteka za obradu`,
                });
              }}
              accept=".xml,.pdf"
              maxFiles={20}
              maxSize={5}
            />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">

            {/* QR Scan */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">QR skeniranje</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Skeniraj QR kod s računa
                  </p>
                </div>
                <Button className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  Skeniraj QR
                </Button>
                <p className="text-xs text-muted-foreground">
                  Koristi kameru ili upload slike
                </p>
              </div>
            </Card>

            {/* Manual Entry */}
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
                <Button className="w-full" variant="outline" onClick={() => {
                  toast({
                    title: "Ručni unos",
                    description: "Forma za ručni unos računa će biti otvorena",
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj ručno
                </Button>
                <p className="text-xs text-muted-foreground">
                  Popuni sve podatke
                </p>
              </div>
            </Card>
          </div>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Automatsko knjiženje</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Check className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Internet bankarstvo spojeno</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uneseni računi će se automatski proknjižiti nakon uplate s povezanog bankovnog računa.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="min-h-[32px]">
                  Postavke
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Automatsko knjiženje pričuve</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatski proknjižuje uplate pričuve kada se prepozna poziv na broj.
                  </p>
                  <Badge variant="default">Aktivno</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Ručno rasknjižavanje</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Neprepoznate uplate možete ručno povezati s računima ili stanarima.
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[32px]">
                    Poveži uplate
                  </Button>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Invoice Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Kreiraj račun</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4 max-w-2xl">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number" className="block text-sm font-medium">Broj računa</Label>
                  <Input id="invoice-number" placeholder="2025-001" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-sm font-medium">Datum</Label>
                  <DatePicker
                    date={invoiceDate}
                    onDateChange={setInvoiceDate}
                    placeholder="dd.MM.yyyy"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-medium">Primatelj</Label>
                <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={recipientOpen}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">
                          {selectedRecipient
                            ? recipients.find((r) => r.id === selectedRecipient)?.name
                            : "Odaberi primatelja..."}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Pretraži primatelje..." />
                      <CommandList>
                        <CommandEmpty>Primatelj nije pronađen.</CommandEmpty>
                        <CommandGroup>
                          {recipients.map((recipient) => (
                            <CommandItem
                              key={recipient.id}
                              value={recipient.name}
                              onSelect={() => {
                                setSelectedRecipient(recipient.id);
                                setRecipientOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedRecipient === recipient.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {recipient.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-description" className="block text-sm font-medium">Opis usluge</Label>
                <Input id="invoice-description" placeholder="Naknada za upravitelja - 2/2025" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-amount" className="block text-sm font-medium">Iznos (€)</Label>
                  <Input id="invoice-amount" type="number" step="0.01" placeholder="150.00" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-sm font-medium">Dospijeće</Label>
                  <DatePicker
                    date={invoiceDueDate}
                    onDateChange={setInvoiceDueDate}
                    placeholder="dd.MM.yyyy"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Kreiraj račun
                </Button>
                <Button variant="outline">
                  Pregled
                </Button>
                <Button variant="outline" className="gap-2">
                  <Send className="h-4 w-4" />
                  Kreiraj i pošalji
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounting Groups Tab */}
        <TabsContent value="accounting" className="space-y-4">
          <Card className="rounded-md">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Grupe troškova</CardTitle>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj grupu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState icon={FileText} title="Nema grupa troškova" className="py-12" />
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Početno stanje</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState icon={FileText} title="Početno stanje" className="py-8" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EInvoices;
