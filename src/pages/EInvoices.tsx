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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date>();
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const { toast } = useToast();

  const { data: invoices = [] } = useEInvoices({
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });
  const { data: recipientsList = [] } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h1>E-Računi i knjiženje</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Uvoz, automatsko knjiženje i upravljanje računima
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno računa</p>
          <p className="text-xl font-semibold mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Knjiženo</p>
          <p className="text-xl font-semibold mt-1 text-success">{stats.booked}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Na čekanju</p>
          <p className="text-xl font-semibold mt-1 text-warning">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Neprepoznato</p>
          <p className="text-xl font-semibold mt-1 text-destructive">{stats.unmatched}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupan iznos</p>
          <p className="text-xl font-semibold mt-1 text-primary">
            {stats.totalAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €
          </p>
        </Card>
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
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <div>
                  <CardTitle>Popis računa</CardTitle>
                  <CardDescription>
                    Pretraga i filtriranje po statusu
                  </CardDescription>
                </div>
                <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
                  <Button variant="outline" className="min-h-[32px] gap-2">
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button className="min-h-[32px] gap-2">
                    <Send className="h-4 w-4" />
                    Pošalji E-račune
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pretraži račune..." className="pl-10" />
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broj računa</TableHead>
                    <TableHead>Dobavljač</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Dospijeće</TableHead>
                    <TableHead className="text-right">Iznos</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Grupa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {selectedStatus === "all" ? "Nema računa za prikaz" : "Nema računa koji odgovaraju odabranom filteru"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="font-medium">{invoice.supplier}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>
                        <span className={
                          new Date(invoice.dueDate.split('.').reverse().join('-')) < new Date() 
                            ? 'text-destructive font-medium' 
                            : ''
                        }>
                          {invoice.dueDate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{invoice.amount}</TableCell>
                      <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.accountingGroup}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {invoice.status === "unmatched" && (
                            <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {stats.unmatched > 0 && (
              <div className="mt-4 p-4 border border-warning rounded-lg bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Neprepoznate uplate</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Imate {stats.unmatched} računa koji nisu povezani s uplatama. Ručno povežite račune s uplatama ili ispravite podatke.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="min-h-[32px]">
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
          {/* Drag & Drop Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Uvoz računa</CardTitle>
              <CardDescription>
                Povucite datoteke ili odaberite s uređaja
              </CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automatsko knjiženje</CardTitle>
              <CardDescription>
                Povezivanje s bankovnim računom i pravila knjiženja
              </CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Kreiraj vlastiti račun</CardTitle>
              <CardDescription>
                Kreirajte račune za vašu naknadu ili za druge komitente.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4 max-w-2xl">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Broj računa</Label>
                  <Input id="invoice-number" placeholder="2025-001" />
                </div>
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <DatePicker
                    date={invoiceDate}
                    onDateChange={setInvoiceDate}
                    placeholder="dd.MM.yyyy"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primatelj</Label>
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
                <Label htmlFor="invoice-description">Opis usluge</Label>
                <Input id="invoice-description" placeholder="Naknada za upravitelja - 2/2025" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-amount">Iznos (€)</Label>
                  <Input id="invoice-amount" type="number" step="0.01" placeholder="150.00" />
                </div>
                <div className="space-y-2">
                  <Label>Dospijeće</Label>
                  <DatePicker
                    date={invoiceDueDate}
                    onDateChange={setInvoiceDueDate}
                    placeholder="dd.MM.yyyy"
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
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Grupe troškova</CardTitle>
                  <CardDescription>
                    Upravljanje grupama troškova za lakše knjiženje
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj grupu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
            <EmptyState
              title="Nema grupa troškova"
              description="Dodajte grupe troškova za lakše knjiženje e-računa"
              className="py-12"
            />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Početno stanje</CardTitle>
              <CardDescription>
                Prijenos stanja od prošle godine u novu
              </CardDescription>
            </CardHeader>
            <CardContent>
            <EmptyState
              title="Početno stanje"
              description="Funkcija prilagodbe početnog stanja nije još implementirana"
              className="py-8"
            />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EInvoices;
