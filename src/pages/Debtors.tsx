import { useNavigate } from "react-router-dom";
import { Mail, FileText, Filter, X, CheckCircle, MapPin, Search, MoreVertical } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebtors } from "@/hooks/useDebtorsData";
import { debtorsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportTableToCSV } from "@/lib/export";

const Debtors = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  const { data: stats } = useQuery({
    queryKey: ["debtors", "stats"],
    queryFn: () => debtorsApi.getStats(),
  });
  const { data: remindersData } = useQuery({
    queryKey: ["debtors", "reminders"],
    queryFn: () => debtorsApi.getReminders({ limit: 50 }),
  });

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
        { key: 'phone', label: 'Telefon' },
        { key: 'address', label: 'Adresa/Stanovi' },
        { key: 'apartmentsCount', label: 'Broj stanova' },
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
    const selectedList = debtors.filter(d => selectedDebtors.has(d.id));
    let sent = 0;
    for (const d of selectedList) {
      try {
        await debtorsApi.sendReminder(d.id);
        sent++;
      } catch {
        toast({
          title: "Greška",
          description: `Nije moguće poslati opomenu za ${d.name}`,
          variant: "destructive",
        });
      }
    }
    if (sent > 0) {
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      queryClient.invalidateQueries({ queryKey: ["debtors", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["debtors", "reminders"] });
      toast({
        title: "Opomene zabilježene",
        description: `Poslano ${sent} opomena`,
      });
    }
    setBatchSendDialogOpen(false);
    setSelectedDebtors(new Set());
  };

  const handleSendReminder = async (debtor: any) => {
    setSendingReminder(debtor.id);
    try {
      await debtorsApi.sendReminder(debtor.id);
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      queryClient.invalidateQueries({ queryKey: ["debtors", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["debtors", "reminders"] });
      toast({
        title: "Opomena zabilježena",
        description: debtor.email ? `Email će biti poslan na ${debtor.email}` : "Opomena je zabilježena u arhivi",
      });
    } catch {
      toast({
        title: "Greška",
        description: "Nije moguće poslati opomenu",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const totalDebt = debtors.reduce((sum, d) => sum + d.amountNum, 0);
  const reminders = remindersData?.data || [];
  const remindersTotal = remindersData?.totalCount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1>Dužnici</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pregled dužnika, slanje opomena i arhiva poslanih opomena.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno dužnika</p>
          <p className="text-xl font-semibold mt-1 text-destructive">
            {isLoading ? "..." : totalCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupan dug</p>
          <p className="text-xl font-semibold mt-1 text-destructive">
            {isLoading ? "..." : formatCurrency(stats?.totalDebt ?? totalDebt)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Opomene ovaj mjesec</p>
          <p className="text-xl font-semibold mt-1">
            {isLoading ? "..." : (stats?.remindersThisMonth ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Duguju &gt; 3 mjeseca</p>
          <p className="text-xl font-semibold mt-1 text-destructive">
            {isLoading ? "..." : (stats?.over3Months ?? debtors.filter(d => d.months >= 3).length)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div>
              <CardTitle>Popis dužnika</CardTitle>
              <CardDescription>
                Pretraga, filteri, izvoz i slanje opomena
              </CardDescription>
            </div>
            <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={debtors.length === 0}
                className="min-h-[32px]"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setBatchSendDialogOpen(true)}
                disabled={selectedDebtors.size === 0}
                className="min-h-[32px] gap-2"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Pošalji opomene</span>
                {selectedDebtors.size > 0 && `(${selectedDebtors.size})`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pretraži po imenu, emailu ili adresi..."
              className="pl-9 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none relative min-h-[32px]"
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
                className="min-w-[44px] min-h-[32px]"
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
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-xs font-medium">
                  <Checkbox 
                    checked={selectedDebtors.size === debtors.length && debtors.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Dužnik</TableHead>
                <TableHead className="text-xs font-medium min-w-[200px]">Adresa</TableHead>
                <TableHead className="text-xs font-medium">Grad</TableHead>
                <TableHead className="text-right text-xs font-medium">Iznos duga</TableHead>
                <TableHead className="text-center text-xs font-medium">Mjeseci</TableHead>
                <TableHead className="text-xs font-medium">Opomene</TableHead>
                <TableHead className="text-right text-xs font-medium">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : debtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        icon={CheckCircle}
                        title="Nema dužnika"
                        description="Svi stanari su uredni s plaćanjem. Odličan posao!"
                      />
                    </TableCell>
                  </TableRow>
              ) : (
                  debtors.map((debtor) => (
                  <TableRow
                    key={debtor.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/persons/${debtor.id}`, { state: { from: "/debtors" } })}
                  >
                    <TableCell className="text-xs" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedDebtors.has(debtor.id)}
                        onCheckedChange={() => toggleDebtor(debtor.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span>{debtor.name}</span>
                        {debtor.apartmentsCount > 1 && (
                          <Badge variant="outline" className="w-fit text-[10px] font-normal">
                            {debtor.apartmentsCount} stanova
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs min-w-[200px]" title={debtor.address || debtor.city || "-"}>
                      {debtor.address || debtor.city || "-"}
                    </TableCell>
                    <TableCell className="text-xs">{debtor.city || "-"}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-destructive">
                      {debtor.amount}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge variant={debtor.months >= 3 ? "destructive" : "secondary"}>
                        {debtor.months}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <p className="font-medium text-xs">{debtor.warningsSent} poslano</p>
                        {debtor.lastReminder && (
                          <p className="text-[11px] text-muted-foreground">
                            Zadnja: {debtor.lastReminder}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/persons/${debtor.id}`, { state: { from: "/debtors" } })}>
                            <FileText className="h-4 w-4 mr-2" />
                            Pregled kartice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendReminder(debtor)}
                            disabled={sendingReminder === debtor.id}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Pošalji opomenu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              <Card
                key={debtor.id}
                className="p-4 hover:shadow-md hover:border-destructive/20 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/persons/${debtor.id}`, { state: { from: "/debtors" } })}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedDebtors.has(debtor.id)}
                      onCheckedChange={() => toggleDebtor(debtor.id)}
                    />
                  </div>
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{debtor.name}</h3>
                      {debtor.apartmentsCount > 1 && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {debtor.apartmentsCount} stanova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debtor.address || debtor.city || "-"}
                      {debtor.address && debtor.city && `, ${debtor.city}`}
                    </p>
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
                  <div className="flex items-end justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="min-w-[44px] min-h-[32px]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/persons/${debtor.id}`, { state: { from: "/debtors" } })}>
                          <FileText className="h-4 w-4 mr-2" />
                          Pregled kartice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendReminder(debtor)}
                          disabled={sendingReminder === debtor.id}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Pošalji opomenu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Arhiva opomena</CardTitle>
            <CardDescription>
              Povijest poslanih opomena dužnicima
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <EmptyState
              title="Arhiva opomena"
              description="Povijest poslanih opomena će se prikazati kada pošaljete prvu opomenu dužnicima."
              className="py-12"
            />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium">Dužnik</TableHead>
                      <TableHead className="text-xs font-medium">Adresa</TableHead>
                      <TableHead className="text-xs font-medium">Poslano</TableHead>
                      <TableHead className="text-right text-xs font-medium">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">{r.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.address && r.city ? `${r.address}, ${r.city}` : r.address || r.city || "-"}
                        </TableCell>
                        <TableCell className="text-xs">{r.sentAt}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => navigate(r.personId ? `/persons/${r.personId}` : `/tenants/${r.tenantId}`, { state: { from: "/debtors" } })}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Kartica
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {remindersTotal > reminders.length && (
                <p className="text-xs text-muted-foreground mt-3">
                  Prikazano {reminders.length} od {remindersTotal} opomena.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Batch Send Confirmation Dialog */}
      <AlertDialog open={batchSendDialogOpen} onOpenChange={setBatchSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potvrda slanja opomena</AlertDialogTitle>
            <AlertDialogDescription>
              Spremni ste poslati opomene za <strong>{selectedDebtors.size}</strong> dužnika.
              {debtors.filter(d => selectedDebtors.has(d.id) && !d.email).length > 0 && (
                <p className="mt-2 text-muted-foreground text-sm">
                  Opomena će biti zabilježena u arhivi za sve. Dužnici bez email adrese neće primiti email.
                </p>
              )}
              <p className="mt-3 text-sm">
                Ukupan iznos duga: <strong className="text-destructive">
                  {formatCurrency(
                    debtors
                      .filter(d => selectedDebtors.has(d.id))
                      .reduce((sum, d) => sum + d.amountNum, 0)
                  )}
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
