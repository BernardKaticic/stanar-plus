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
import { Card } from "@/components/ui/card";
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

const EInvoices = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date>();
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const { toast } = useToast();

  const recipients = [
    { id: "building1", name: "A.Starčevića 15, Vinkovci" },
    { id: "building2", name: "Ohridska 7, Vinkovci" },
    { id: "building3", name: "Trg Bana J. Jelačića 3, Split" },
    { id: "building4", name: "Marmontova 12, Split" },
    { id: "client1", name: "Drugi komitent - Zagreb" },
  ];

  const invoices = [
    {
      id: 1,
      invoiceNumber: "2025-001-HEP",
      supplier: "HEP - Elektra Zagreb d.o.o.",
      date: "15.02.2025.",
      dueDate: "01.03.2025.",
      amount: "2.450,00 €",
      status: "booked",
      category: "Energija",
      accountingGroup: "25 - Materijalni troškovi",
      paymentDate: "20.02.2025.",
      type: "xml",
    },
    {
      id: 2,
      invoiceNumber: "2025-002-ZOV",
      supplier: "Zagrebačke otpadne vode d.o.o.",
      date: "12.02.2025.",
      dueDate: "28.02.2025.",
      amount: "1.850,00 €",
      status: "pending",
      category: "Komunalije",
      accountingGroup: "25 - Materijalni troškovi",
      type: "xml",
    },
    {
      id: 3,
      invoiceNumber: "QR-2025-003",
      supplier: "Čistoća d.o.o.",
      date: "10.02.2025.",
      dueDate: "25.02.2025.",
      amount: "1.200,00 €",
      status: "unmatched",
      category: "Čišćenje",
      accountingGroup: "4 - Troškovi",
      type: "qr",
    },
    {
      id: 4,
      invoiceNumber: "MAN-2025-004",
      supplier: "Servis lifta Marić d.o.o.",
      date: "08.02.2025.",
      dueDate: "23.02.2025.",
      amount: "350,00 €",
      status: "booked",
      category: "Održavanje",
      accountingGroup: "25 - Materijalni troškovi",
      paymentDate: "15.02.2025.",
      type: "manual",
    },
  ];

  const stats = {
    total: invoices.length,
    booked: invoices.filter(i => i.status === "booked").length,
    pending: invoices.filter(i => i.status === "pending").length,
    unmatched: invoices.filter(i => i.status === "unmatched").length,
    totalAmount: invoices.reduce((sum, i) => 
      sum + parseFloat(i.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0
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

  const filteredInvoices = selectedStatus === "all" 
    ? invoices 
    : invoices.filter(i => i.status === selectedStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">E-Računi i knjiženje</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Uvoz, automatsko knjiženje i upravljanje računima
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex min-h-[44px]">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button className="min-h-[44px]">
            <Send className="mr-2 h-4 w-4" />
            Pošalji E-račune
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno računa</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Knjiženo</p>
          <p className="text-2xl font-bold mt-1 text-success">{stats.booked}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Na čekanju</p>
          <p className="text-2xl font-bold mt-1 text-warning">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Neprepoznato</p>
          <p className="text-2xl font-bold mt-1 text-destructive">{stats.unmatched}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupan iznos</p>
          <p className="text-2xl font-bold mt-1 text-primary">
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
          <Card className="p-4 sm:p-6">
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
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {invoice.status === "unmatched" && (
                            <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
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
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    Poveži uplate
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          {/* Drag & Drop Upload */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Uvoz računa</h3>
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

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Automatsko knjiženje</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Check className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Internet bankarstvo spojeno</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uneseni računi će se automatski proknjižiti nakon uplate s povezanog bankovnog računa.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="min-h-[44px]">
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
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    Poveži uplate
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Create Invoice Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Kreiraj vlastiti račun</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Kreirajte račune za vašu naknadu ili za druge komitente.
            </p>
            
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
                <Button variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Kreiraj i pošalji
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Accounting Groups Tab */}
        <TabsContent value="accounting" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Grupe troškova</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upravljanje grupama troškova za lakše knjiženje
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj grupu
              </Button>
            </div>

            <div className="space-y-3">
              {[
                {
                  code: "4",
                  name: "Troškovi",
                  subgroups: ["3 - Zajednička struja", "5 - Čišćenje"],
                  count: 12,
                  total: "3.450,00 €"
                },
                {
                  code: "25",
                  name: "Materijalni troškovi",
                  subgroups: ["1 - Održavanje", "2 - Energija"],
                  count: 8,
                  total: "5.234,50 €"
                },
                {
                  code: "7",
                  name: "Komunalije",
                  subgroups: ["1 - Voda", "2 - Odvodnja"],
                  count: 6,
                  total: "2.180,00 €"
                },
              ].map((group, i) => (
                <div key={i} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">{group.code}</Badge>
                        <h4 className="font-semibold">{group.name}</h4>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{group.count} računa</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{group.total}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {group.subgroups.map((sub, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Početno stanje</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Prijenos stanja od prošle godine u novu
            </p>
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Stanje iz 2024.</span>
                <span className="text-xl font-bold">12.345,67 €</span>
              </div>
              <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                Prilagodi početno stanje
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EInvoices;
