import { AlertCircle, Mail, FileText, Filter, Download, X, CheckCircle, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useDebtors } from "@/hooks/useDebtorsData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportTableToCSV } from "@/lib/export";

const Debtors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [amountFilter, setAmountFilter] = useState<'all' | 'over50' | 'over100'>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | 'over2' | 'noReminders'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [batchSendDialogOpen, setBatchSendDialogOpen] = useState(false);
  const [selectedDebtors, setSelectedDebtors] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const { data: debtorsData, isLoading } = useDebtors({ page, pageSize, search: searchTerm });

  const allDebtors = debtorsData?.data || [];
  const totalCount = debtorsData?.totalCount || 0;

  // Get unique cities
  const cities = Array.from(new Set(allDebtors.map(d => d.city).filter(Boolean))).sort();

  // Apply filters
  const debtors = allDebtors.filter(debtor => {
    if (amountFilter === 'over50' && debtor.amountNum <= 50) return false;
    if (amountFilter === 'over100' && debtor.amountNum <= 100) return false;
    if (monthFilter === 'over2' && debtor.months <= 2) return false;
    if (monthFilter === 'noReminders' && debtor.lastReminder) return false;
    if (cityFilter !== 'all' && debtor.city !== cityFilter) return false;
    return true;
  });

  const activeFiltersCount = 
    (amountFilter !== 'all' ? 1 : 0) + 
    (monthFilter !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0);

  const handleExportCSV = () => {
    exportTableToCSV(
      debtors,
      [
        { key: 'name', label: 'Dužnik' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Adresa' },
        { key: 'city', label: 'Grad' },
        { key: 'amount', label: 'Iznos duga' },
        { key: 'months', label: 'Broj mjeseci' },
        { key: 'warningsSent', label: 'Opomene poslane' },
        { key: 'lastReminder', label: 'Posljednja opomena' },
      ],
      'duznici'
    );
    toast({
      title: "CSV exportan",
      description: `Izvezeno ${debtors.length} dužnika`,
    });
  };

  const toggleDebtor = (id: string) => {
    const newSet = new Set(selectedDebtors);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDebtors(newSet);
  };

  const toggleAll = () => {
    if (selectedDebtors.size === debtors.length) {
      setSelectedDebtors(new Set());
    } else {
      setSelectedDebtors(new Set(debtors.map(d => d.id)));
    }
  };

  const handleBatchSend = async () => {
    const selectedList = debtors.filter(d => selectedDebtors.has(d.id) && d.email);
    
    // Simulate sending emails
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Opomene poslane",
      description: `Poslano ${selectedList.length} opomena`,
    });
    setBatchSendDialogOpen(false);
    setSelectedDebtors(new Set());
  };

  const handleSendReminder = async (debtor: any) => {
    setSendingReminder(debtor.id);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Podsjetnik poslan",
      description: `Email poslan na ${debtor.email}`,
    });
    
    setSendingReminder(null);
  };

  const totalDebt = debtors.reduce((sum, d) => sum + d.amountNum, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dužnici i opomene</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pregled dužnika i upravljanje opomenama
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            disabled={debtors.length === 0}
            className="hidden sm:flex min-h-[44px]"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setBatchSendDialogOpen(true)}
            disabled={selectedDebtors.size === 0}
            className="min-h-[44px]"
          >
            <Mail className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Pošalji opomene </span>
            {selectedDebtors.size > 0 && `(${selectedDebtors.size})`}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno dužnika</p>
          <p className="text-2xl font-bold mt-1 text-destructive">
            {isLoading ? "..." : totalCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupan dug</p>
          <p className="text-2xl font-bold mt-1 text-destructive">
            {isLoading ? "..." : `${totalDebt.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Opomene ovaj mjesec</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Duguju &gt; 3 mjeseca</p>
          <p className="text-2xl font-bold mt-1 text-warning">
            {isLoading ? "..." : debtors.filter(d => d.months >= 3).length}
          </p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex gap-3 mb-6">
          <Input 
            placeholder="Pretraži dužnike..." 
            className="flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none relative min-h-[44px]"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => {
                  setAmountFilter('all');
                  setMonthFilter('all');
                  setCityFilter('all');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {cityFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {cityFilter}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setCityFilter('all')}
                />
              </Badge>
            )}
            {amountFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Dug: {amountFilter === 'over50' ? '> 50 €' : '> 100 €'}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setAmountFilter('all')}
                />
              </Badge>
            )}
            {monthFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {monthFilter === 'over2' ? 'Više od 2 mjeseca' : 'Bez opomena'}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setMonthFilter('all')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedDebtors.size === debtors.length && debtors.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Dužnik</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Adresa</TableHead>
                <TableHead>Grad</TableHead>
                <TableHead className="text-right">Iznos duga</TableHead>
                <TableHead className="text-center">Mjeseci</TableHead>
                <TableHead>Opomene</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Učitavanje...
                    </TableCell>
                  </TableRow>
              ) : debtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={CheckCircle}
                        title="Nema dužnika"
                        description="Svi stanari su uredni s plaćanjem. Odličan posao!"
                      />
                    </TableCell>
                  </TableRow>
              ) : (
                  debtors.map((debtor) => (
                  <TableRow key={debtor.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedDebtors.has(debtor.id)}
                        onCheckedChange={() => toggleDebtor(debtor.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        {debtor.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{debtor.email || "-"}</TableCell>
                    <TableCell className="text-sm">{debtor.address}</TableCell>
                    <TableCell className="text-sm">{debtor.city || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {debtor.amount}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={debtor.months >= 3 ? "destructive" : "secondary"}>
                        {debtor.months}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{debtor.warningsSent} poslano</p>
                        {debtor.lastReminder && (
                          <p className="text-xs text-muted-foreground">
                            Zadnja: {debtor.lastReminder}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-w-[44px] min-h-[44px]"
                          onClick={() => handleSendReminder(debtor)}
                          disabled={sendingReminder === debtor.id || !debtor.email}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {!isLoading && debtors.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedDebtors.size === debtors.length}
                  onCheckedChange={toggleAll}
                />
                <Label className="text-sm font-normal cursor-pointer" onClick={toggleAll}>
                  Označi sve ({debtors.length})
                </Label>
              </div>
              {selectedDebtors.size > 0 && (
                <Badge variant="secondary">
                  {selectedDebtors.size} označeno
                </Badge>
              )}
            </div>
          )}
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="pt-1">
                      <div className="h-4 w-4 rounded border" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : debtors.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Nema dužnika"
              description="Svi stanari su uredni s plaćanjem. Odličan posao!"
            />
          ) : (
            debtors.map((debtor) => (
              <Card key={debtor.id} className="p-4 hover:shadow-md hover:border-destructive/20 transition-all duration-300">
                <div className="flex items-start gap-3 mb-3">
                  <div className="pt-1">
                    <Checkbox 
                      checked={selectedDebtors.has(debtor.id)}
                      onCheckedChange={() => toggleDebtor(debtor.id)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold">{debtor.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debtor.address}{debtor.city && `, ${debtor.city}`}
                    </p>
                    {debtor.email && (
                      <p className="text-xs text-muted-foreground mt-1">{debtor.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                  <div>
                    <p className="text-muted-foreground text-xs">Dug</p>
                    <p className="font-bold text-destructive text-base">{debtor.amount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Mjeseci</p>
                    <Badge variant={debtor.months >= 3 ? "destructive" : "secondary"} className="mt-1">
                      {debtor.months}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Opomene</p>
                    <p className="font-medium">{debtor.warningsSent} poslano</p>
                    {debtor.lastReminder && (
                      <p className="text-xs text-muted-foreground">
                        Zadnja: {debtor.lastReminder}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[44px] min-h-[44px]"
                      onClick={() => handleSendReminder(debtor)}
                      disabled={sendingReminder === debtor.id || !debtor.email}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="min-w-[44px] min-h-[44px]">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(totalCount / pageSize)}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Arhiva opomena</h3>
          <Badge variant="secondary">
            12 ukupno poslano
          </Badge>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Korisnik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Alerić Mato', status: 'Poslano', date: '17.1.2023.' },
                { name: 'Abigalić Ivan', status: 'Poslano', date: '17.1.2023.' },
                { name: 'Babić Ana', status: 'Poslano', date: '17.1.2023.' },
                { name: 'Cirki Jelena', status: 'Poslano', date: '20.1.2024.' },
                { name: 'Došen Luka', status: 'Poslano', date: '20.1.2024.' },
                { name: 'Galić Mato', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Ivezić Sara', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Josić Mijo', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Kalenić Goran', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Popadić Ante', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Rotz Robert', status: 'Poslano', date: '22.2.2024.' },
                { name: 'Vuković Tomislav', status: 'Poslano', date: '10.10.2025.' },
              ].map((record, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-2">
          {[
            { name: 'Alerić Mato', status: 'Poslano', date: '17.1.2023.' },
            { name: 'Abigalić Ivan', status: 'Poslano', date: '17.1.2023.' },
            { name: 'Babić Ana', status: 'Poslano', date: '17.1.2023.' },
            { name: 'Cirki Jelena', status: 'Poslano', date: '20.1.2024.' },
            { name: 'Došen Luka', status: 'Poslano', date: '20.1.2024.' },
            { name: 'Galić Mato', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Ivezić Sara', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Josić Mijo', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Kalenić Goran', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Popadić Ante', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Rotz Robert', status: 'Poslano', date: '22.2.2024.' },
            { name: 'Vuković Tomislav', status: 'Poslano', date: '10.10.2025.' },
          ].map((record, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">{record.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{record.date}</p>
              </div>
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {record.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Batch Send Confirmation Dialog */}
      <AlertDialog open={batchSendDialogOpen} onOpenChange={setBatchSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potvrda slanja opomena</AlertDialogTitle>
            <AlertDialogDescription>
              Spremni ste poslati opomene za <strong>{selectedDebtors.size}</strong> dužnika.
              {debtors.filter(d => selectedDebtors.has(d.id) && !d.email).length > 0 && (
                <p className="mt-2 text-warning">
                  Upozorenje: {debtors.filter(d => selectedDebtors.has(d.id) && !d.email).length} dužnika nema email adresu i bit će preskočeno.
                </p>
              )}
              <p className="mt-3 text-sm">
                Ukupan iznos duga: <strong className="text-destructive">
                  {debtors
                    .filter(d => selectedDebtors.has(d.id))
                    .reduce((sum, d) => sum + d.amountNum, 0)
                    .toLocaleString('hr-HR', { minimumFractionDigits: 2 })} €
                </strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchSend}>
              Pošalji opomene
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          <SheetHeader>
            <SheetTitle>Filteri</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label>Grad</Label>
              <RadioGroup value={cityFilter} onValueChange={setCityFilter}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="city-all" />
                  <Label htmlFor="city-all" className="font-normal cursor-pointer">Svi gradovi</Label>
                </div>
                {cities.map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <RadioGroupItem value={city} id={`city-${city}`} />
                    <Label htmlFor={`city-${city}`} className="font-normal cursor-pointer">{city}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Iznos duga</Label>
              <RadioGroup value={amountFilter} onValueChange={(val) => setAmountFilter(val as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="amount-all" />
                  <Label htmlFor="amount-all" className="font-normal cursor-pointer">Svi iznosi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over50" id="amount-over50" />
                  <Label htmlFor="amount-over50" className="font-normal cursor-pointer">Više od 50 €</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over100" id="amount-over100" />
                  <Label htmlFor="amount-over100" className="font-normal cursor-pointer">Više od 100 €</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Razdoblje</Label>
              <RadioGroup value={monthFilter} onValueChange={(val) => setMonthFilter(val as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="month-all" />
                  <Label htmlFor="month-all" className="font-normal cursor-pointer">Sva razdoblja</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over2" id="month-over2" />
                  <Label htmlFor="month-over2" className="font-normal cursor-pointer">Više od 2 mjeseca</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="noReminders" id="month-no-reminders" />
                  <Label htmlFor="month-no-reminders" className="font-normal cursor-pointer">Bez opomena</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => {
                setAmountFilter('all');
                setMonthFilter('all');
                setCityFilter('all');
              }}>
                Poništi
              </Button>
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                Primijeni
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Debtors;
