import { Plus, Search, FileText, Filter, X, MapPin, AlertCircle, Edit2, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Send, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useNavigate } from "react-router-dom";
import { usePersons } from "@/hooks/usePersonsData";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenantsManagement";
import { TenantDialog } from "@/components/tenants/TenantDialog";
import { TenantEditDialog } from "@/components/tenants/TenantEditDialog";
import { AddApartmentToPersonDialog } from "@/components/tenants/AddApartmentToPersonDialog";
import { TempPasswordModal } from "@/components/TempPasswordModal";
import { usersApi, buildingsApi, tenantsApi, debtorsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { exportTableToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

const Tenants = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue'>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'email' | 'pošta'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    open: boolean;
    email: string;
    tempPassword: string;
  }>({ open: false, email: "", tempPassword: "" });
  
  const navigate = useNavigate();
  const { data: personsData, isLoading, isFetching } = usePersons({
    page,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    deliveryMethod: deliveryFilter,
    city: cityFilter !== "all" ? cityFilter : undefined,
  });
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [editingTenant, setEditingTenant] = useState<{
    id: string;
    name: string;
    oib?: string | null;
    email?: string;
    phone?: string;
    apartment_id?: string | null;
    deliveryMethod?: string | null;
    personId?: string;
  } | null>(null);
  const [addApartmentPerson, setAddApartmentPerson] = useState<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    oib?: string | null;
    deliveryMethod?: string | null;
    apartments: { apartmentId: string }[];
  } | null>(null);
  const [addApartmentPending, setAddApartmentPending] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'monthlyRate'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deleteTenantConfirm, setDeleteTenantConfirm] = useState<{
    tenantId: string;
    personName: string;
    address?: string | null;
  } | null>(null);
  const [deleteTenantPending, setDeleteTenantPending] = useState(false);
  const { toast } = useToast();

  const handleDeleteTenantConfirm = async () => {
    if (!deleteTenantConfirm) return;
    setDeleteTenantPending(true);
    try {
      await tenantsApi.delete(deleteTenantConfirm.tenantId);
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast({
        title: "Suvlasnik uklonjen",
        description: `Veza suvlasnika ${deleteTenantConfirm.personName} s stanom je uklonjena.`,
      });
      setDeleteTenantConfirm(null);
    } catch {
      toast({
        title: "Greška",
        description: "Nije moguće ukloniti vezu suvlasnika.",
        variant: "destructive",
      });
    } finally {
      setDeleteTenantPending(false);
    }
  };

  const formatDelivery = (dm: string | null | undefined) => {
    const v = typeof dm === 'string' ? dm : null;
    if (v === 'email') return 'E-mail';
    if (v === 'pošta') return 'Pošta';
    if (v === 'both') return 'E-mail i pošta';
    return 'Nije odabrano';
  };

  const handleExportCSV = () => {
    const exportData = persons.map(p => ({
      name: p.name,
      email: p.email,
      address: p.apartments.map(a => a.address).filter(Boolean).join('; ') || '-',
      city: [...new Set(p.apartments.map(a => a.city).filter(Boolean))].join(', ') || '-',
      area: p.apartments.reduce((s, a) => s + (a.area ? parseFloat(a.area) : 0), 0) || '-',
      monthlyRate: p.totalMonthlyRate,
      balance: p.totalBalance,
      deliveryLabel: formatDelivery(p.deliveryMethod),
      apartmentsCount: p.apartmentsCount,
    }));
    exportTableToCSV(
      exportData,
      [
        { key: 'name', label: 'Suvlasnik' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Adresa' },
        { key: 'city', label: 'Grad' },
        { key: 'area', label: 'Površina' },
        { key: 'monthlyRate', label: 'Mjesečna rata' },
        { key: 'balance', label: 'Saldo' },
        { key: 'deliveryLabel', label: 'Dostava' },
      ],
      'suvlasnici'
    );
    toast({
      title: "CSV exportan",
      description: `Izvezeno ${persons.length} suvlasnika`,
    });
  };

  const allPersons = personsData?.data || [];
  const totalCount = personsData?.totalCount || 0;

  // Get unique cities from current data (for filter dropdown; backend filters by city when selected)
  const cities = Array.from(new Set(allPersons.flatMap(p => p.apartments.map(a => a.city).filter(Boolean)))).sort() as string[];

  // Sort (filtering is done by backend via usePersons params)
  const persons = [...allPersons].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') {
      return mul * (a.name.localeCompare(b.name, 'hr'));
    }
    if (sortBy === 'balance') {
      const va = a.totalBalanceNum ?? 0;
      const vb = b.totalBalanceNum ?? 0;
      return mul * (va - vb);
    }
    if (sortBy === 'monthlyRate') {
      const parseRate = (s: string | null | undefined) =>
        parseFloat((s || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
      const va = parseRate(a.totalMonthlyRate);
      const vb = parseRate(b.totalMonthlyRate);
      return mul * (va - vb);
    }
    return 0;
  });

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (deliveryFilter !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const clearFilters = () => {
    setStatusFilter('all');
    setDeliveryFilter('all');
    setCityFilter('all');
  };

  const handleSendReminder = async (personId: string, personName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingReminder(personId);
    try {
      await debtorsApi.sendReminderByPerson(personId);
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      queryClient.invalidateQueries({ queryKey: ["debtors", "reminders"] });
      toast({
        title: "Opomena poslana",
        description: `Opomena za ${personName} je zabilježena.`,
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

  const stats = {
    total: totalCount,
    paid: persons.filter(p => p.status === 'paid').length,
    overdue: persons.filter(p => p.status === 'overdue').length,
    totalApartments: persons.reduce((s, p) => s + (p.apartmentsCount ?? p.apartments?.length ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Suvlasnici</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljanje podacima suvlasnika (ime, adresa, kontakt, saldo...).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Ukupno suvlasnika", value: stats.total, className: "" },
          { label: "Uredno plaćaju", value: stats.paid, className: "text-success" },
          { label: "U dugu", value: stats.overdue, className: "text-destructive" },
          { label: "Ukupno stanova", value: stats.totalApartments, className: "" },
        ].map((stat, i) => (
          <Card key={stat.label} className="p-4 transition-all duration-200 hover:shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <p className={`text-xl font-semibold mt-1 ${stat.className}`}>{stat.value}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="transition-opacity duration-200" style={{ opacity: isFetching && !isLoading ? 0.92 : 1 }}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Popis suvlasnika</CardTitle>
                {isFetching && !isLoading && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary/60 animate-pulse" aria-hidden />
                )}
              </div>
              <CardDescription>Pretraga, filteri i izvoz</CardDescription>
            </div>
            {persons.length > 0 && (
            <div className="flex justify-end w-full sm:w-auto shrink-0">
              <Button
                type="button"
                className="gap-2 min-h-[28px] sm:min-h-[32px]"
                onClick={() => setTenantDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Dodaj suvlasnika
              </Button>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pretraži po imenu ili adresi..." 
              className="pl-9 transition-colors duration-150 focus-visible:ring-2"
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
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              className="hidden sm:flex min-h-[32px]"
              onClick={handleExportCSV}
              disabled={persons.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter === 'paid' ? 'Plaća uredno' : 'Dužnik'}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setStatusFilter('all')}
                />
              </Badge>
            )}
            {deliveryFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Dostava: {deliveryFilter === 'email' ? 'E-mail' : deliveryFilter === 'pošta' ? 'Pošta' : 'Sve'}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setDeliveryFilter('all')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="table-fixed min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === 'name') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('name');
                        setSortDir('asc');
                      }
                    }}
                  >
                    Suvlasnik
                    {sortBy === 'name' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead className="w-[18%] text-xs font-medium">Stan</TableHead>
                <TableHead className="w-[14%] text-xs font-medium">Grad</TableHead>
                <TableHead className="w-[12%]">
                  <button
                    type="button"
                    className="flex items-center justify-end gap-1 w-full text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === 'monthlyRate') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('monthlyRate');
                        setSortDir('desc');
                      }
                    }}
                  >
                    Mjesečna rata
                    {sortBy === 'monthlyRate' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead className="w-[10%]">
                  <button
                    type="button"
                    className="flex items-center justify-end gap-1 w-full text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === 'balance') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('balance');
                        setSortDir('asc');
                      }
                    }}
                  >
                    Saldo
                    {sortBy === 'balance' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead className="w-[12%] text-xs font-medium">Dostava</TableHead>
                <TableHead className="w-[10%] text-right text-xs font-medium">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : persons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title={hasActiveFilters ? "Nema suvlasnika za odabrane filtere" : "Nema suvlasnika"}
                      description={hasActiveFilters ? "Pokušajte promijeniti ili ukloniti filtere." : "Dodajte prvog suvlasnika da biste započeli s evidencijom."}
                      action={hasActiveFilters ? { label: "Ukloni filtere", onClick: clearFilters } : { label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                persons.map((person, idx) => {
                  const firstApt = person.apartments[0];
                  return (
                  <TableRow
                    key={person.id}
                    className="hover:bg-muted/30 transition-colors duration-150 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(idx * 25, 150)}ms` }}
                    onClick={() => navigate(`/persons/${person.id}`, { state: { from: "/tenants" } })}
                  >
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {person.status === 'overdue' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {person.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs truncate" title={person.apartmentsCount === 1 && firstApt?.address ? firstApt.address : person.apartmentsCount > 1 ? `${person.apartmentsCount} stana` : "-"}>
                      {person.apartmentsCount === 1 && firstApt?.address
                        ? firstApt.address
                        : person.apartmentsCount > 1
                        ? `${person.apartmentsCount} stana`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      {person.apartmentsCount === 1
                        ? (firstApt?.city || "–")
                        : (() => {
                            const cities = [...new Set(person.apartments.map(a => a.city).filter(Boolean))];
                            return cities.length === 1 ? cities[0] : "–";
                          })()}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">{person.totalMonthlyRate ?? "-"}</TableCell>
                    <TableCell className={`text-right text-xs font-semibold ${
                      person.totalBalanceNum < 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {person.totalBalance}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatDelivery(person.deliveryMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}`, { state: { from: "/tenants" } })}>
                            <FileText className="h-4 w-4 mr-2" />
                            Pregled detalja
                          </DropdownMenuItem>
                          {person.status === 'overdue' && (
                            <DropdownMenuItem
                              onClick={(e) => handleSendReminder(person.id, person.name, e)}
                              disabled={sendingReminder === person.id}
                            >
                              {sendingReminder === person.id ? (
                                <span className="animate-pulse">Slanje...</span>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Pošalji opomenu
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {person.apartments.length > 0 && (
                            <>
                              {person.apartmentsCount === 1 ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingTenant({
                                      id: firstApt!.tenantId,
                                      name: person.name,
                                      oib: person.oib ?? undefined,
                                      email: person.email,
                                      phone: person.phone,
                                      apartment_id: firstApt!.apartmentId,
                                      deliveryMethod: person.deliveryMethod,
                                      personId: person.id,
                                    })
                                  }
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Uredi
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Uredi stan
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {person.apartments.map((apt, i) => (
                                      <DropdownMenuItem
                                        key={apt.tenantId}
                                        onClick={() =>
                                          setEditingTenant({
                                            id: apt.tenantId,
                                            name: person.name,
                                            oib: person.oib ?? undefined,
                                            email: person.email,
                                            phone: person.phone,
                                            apartment_id: apt.apartmentId,
                                            deliveryMethod: person.deliveryMethod,
                                            personId: person.id,
                                          })
                                        }
                                      >
                                        Stan {i + 1} {apt.address ? `– ${apt.address}` : ""}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  setAddApartmentPerson({
                                    id: person.id,
                                    name: person.name,
                                    email: person.email,
                                    phone: person.phone,
                                    oib: person.oib,
                                    deliveryMethod: person.deliveryMethod,
                                    apartments: person.apartments,
                                  })
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj stan
                              </DropdownMenuItem>
                              {person.apartmentsCount === 1 ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteTenantConfirm({
                                      tenantId: firstApt!.tenantId,
                                      personName: person.name,
                                      address: firstApt?.address,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Obriši suvlasnika
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Obriši vezu s stanom
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {person.apartments.map((apt) => (
                                      <DropdownMenuItem
                                        key={apt.tenantId}
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          setDeleteTenantConfirm({
                                            tenantId: apt.tenantId,
                                            personName: person.name,
                                            address: apt.address,
                                          })
                                        }
                                      >
                                        {apt.address ?? apt.apartmentId ?? apt.tenantId}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-10 w-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : persons.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? "Nema suvlasnika za odabrane filtere" : "Nema suvlasnika"}
              description={hasActiveFilters ? "Pokušajte promijeniti ili ukloniti filtere." : "Dodajte prvog suvlasnika da biste započeli s evidencijom."}
              action={hasActiveFilters ? { label: "Ukloni filtere", onClick: clearFilters } : { label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
            />
          ) : (
            persons.map((person, idx) => {
              const firstApt = person.apartments[0];
              const addressStr = person.apartmentsCount === 1 && firstApt?.address
                ? firstApt.address
                : person.apartmentsCount > 1
                ? `${person.apartmentsCount} stana`
                : '-';
              const cityStr = person.apartmentsCount === 1
                ? (firstApt?.city || '')
                : (() => {
                    const cities = [...new Set(person.apartments.map(a => a.city).filter(Boolean))];
                    return cities.length === 1 ? cities[0] : '';
                  })();
              return (
              <Card
                key={person.id}
                className="rounded-lg border border-border bg-card px-4 py-3 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 35, 200)}ms` }}
                onClick={() => navigate(`/persons/${person.id}`, { state: { from: "/tenants" } })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {person.status === 'overdue' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <h3 className="font-semibold">{person.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{addressStr}{cityStr ? `, ${cityStr}` : ''}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px] -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}`, { state: { from: "/tenants" } })}>
                        <FileText className="h-4 w-4 mr-2" />
                        Pregled detalja
                      </DropdownMenuItem>
                      {person.status === 'overdue' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendReminder(person.id, person.name, e);
                          }}
                          disabled={sendingReminder === person.id}
                        >
                          {sendingReminder === person.id ? (
                            <span className="animate-pulse">Slanje...</span>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Pošalji opomenu
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {person.apartments.length > 0 && (
                        <>
                          {person.apartmentsCount === 1 ? (
                            <DropdownMenuItem
                              onClick={() =>
                                setEditingTenant({
                                  id: firstApt!.tenantId,
                                  name: person.name,
                                  oib: person.oib ?? undefined,
                                  email: person.email,
                                  phone: person.phone,
                                  apartment_id: firstApt!.apartmentId,
                                  deliveryMethod: person.deliveryMethod,
                                  personId: person.id,
                                })
                              }
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Uredi
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Uredi stan
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {person.apartments.map((apt, i) => (
                                  <DropdownMenuItem
                                    key={apt.tenantId}
                                    onClick={() =>
                                      setEditingTenant({
                                        id: apt.tenantId,
                                        name: person.name,
                                        oib: person.oib ?? undefined,
                                        email: person.email,
                                        phone: person.phone,
                                        apartment_id: apt.apartmentId,
                                        deliveryMethod: person.deliveryMethod,
                                        personId: person.id,
                                      })
                                    }
                                  >
                                    Stan {i + 1} {apt.address ? `– ${apt.address}` : ""}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              setAddApartmentPerson({
                                id: person.id,
                                name: person.name,
                                email: person.email,
                                phone: person.phone,
                                oib: person.oib,
                                deliveryMethod: person.deliveryMethod,
                                apartments: person.apartments,
                              })
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Dodaj stan
                          </DropdownMenuItem>
                          {person.apartmentsCount === 1 ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteTenantConfirm({
                                  tenantId: firstApt!.tenantId,
                                  personName: person.name,
                                  address: firstApt?.address,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Obriši suvlasnika
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Obriši vezu s stanom
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {person.apartments.map((apt) => (
                                  <DropdownMenuItem
                                    key={apt.tenantId}
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTenantConfirm({
                                        tenantId: apt.tenantId,
                                        personName: person.name,
                                        address: apt.address,
                                      })
                                    }
                                  >
                                    {apt.address ?? apt.apartmentId ?? apt.tenantId}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
                  <div>
                    <p className="text-muted-foreground text-xs">Mjesečna rata</p>
                    <p className="font-medium">{person.totalMonthlyRate ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo</p>
                    <p className={`font-semibold ${
                      person.totalBalanceNum < 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {person.totalBalance}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Dostava</p>
                    <Badge variant="outline" className="text-xs">
                      {formatDelivery(person.deliveryMethod)}
                    </Badge>
                  </div>
                </div>
              </Card>
              );
            })
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

      <TenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        onSave={async (data) => {
          const aptIds = data.apartment_ids || [];
          if (!data.name || aptIds.length === 0) return;
          try {
            let userId: string | undefined;
            if (data.email) {
              const userRes = await usersApi.createStanar({
                email: data.email,
                full_name: data.name,
              });
              userId = userRes.id;
              if (userRes.tempPassword && !userRes.existing) {
                setTempPasswordModal({
                  open: true,
                  email: data.email,
                  tempPassword: userRes.tempPassword,
                });
              }
            }
            const firstAptId = aptIds[0];
            createTenant.mutate(
              {
                name: data.name,
                email: data.email || undefined,
                phone: data.phone || undefined,
                apartment_id: firstAptId,
                user_id: userId,
                delivery_method: data.delivery_method || undefined,
              },
              {
                onSuccess: async (firstTenant: unknown) => {
                  const res = firstTenant as { person_id?: string } | null;
                  const personId = res?.person_id ? String(res.person_id) : undefined;
                  for (let i = 1; i < aptIds.length; i++) {
                    try {
                      await tenantsApi.create({
                        name: data.name,
                        oib: data.oib?.trim() || undefined,
                        email: data.email || undefined,
                        phone: data.phone || undefined,
                        apartment_id: aptIds[i],
                        delivery_method: data.delivery_method || undefined,
                        person_id: personId,
                      });
                    } catch (err: any) {
                      const msg = err?.status === 409
                        ? `Suvlasnik je već dodan na stan ${i + 1}.`
                        : `Greška pri dodavanju na stan ${i + 1}.`;
                      toast({
                        title: "Upozorenje",
                        description: msg,
                        variant: "destructive",
                      });
                      break;
                    }
                  }
                  await queryClient.invalidateQueries({ queryKey: ["tenants"] });
                  await queryClient.invalidateQueries({ queryKey: ["persons"] });
                  await queryClient.invalidateQueries({ queryKey: ["cities"] });
                  setTenantDialogOpen(false);
                },
              }
            );
          } catch (err) {
            toast({
              title: "Greška",
              description: (err as Error)?.message ?? "Nije moguće kreirati suvlasnika.",
              variant: "destructive",
            });
          }
        }}
        isPending={createTenant.isPending}
      />

      <TempPasswordModal
        open={tempPasswordModal.open}
        onOpenChange={(open) => setTempPasswordModal((p) => ({ ...p, open }))}
        email={tempPasswordModal.email}
        tempPassword={tempPasswordModal.tempPassword}
      />

      <AlertDialog open={!!deleteTenantConfirm} onOpenChange={(open) => !open && setDeleteTenantConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši suvlasnika?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTenantConfirm && (
                <>
                  Veza suvlasnika <strong>{deleteTenantConfirm.personName}</strong>
                  {deleteTenantConfirm.address ? ` s stanom ${deleteTenantConfirm.address}` : ""} bit će uklonjena.
                  Osoba ostaje u sustavu; uklanja se samo veza s ovim stanom.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTenantPending}>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTenantConfirm();
              }}
              disabled={deleteTenantPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenantPending ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TenantEditDialog
        open={!!editingTenant}
        onOpenChange={(open) => !open && setEditingTenant(null)}
        tenant={editingTenant}
        onSave={(data) => {
          if (!editingTenant) return;
          const apartmentId = data.apartment_id || null;
          updateTenant.mutate(
            {
              id: editingTenant.id,
              data: {
                name: data.name,
                oib: data.oib ?? undefined,
                email: data.email || undefined,
                phone: data.phone || undefined,
                apartment_id: apartmentId,
                delivery_method: data.delivery_method || null,
              },
            },
            {
              onSuccess: () => setEditingTenant(null),
            }
          );
        }}
        isPending={updateTenant.isPending}
      />

      <AddApartmentToPersonDialog
        open={!!addApartmentPerson}
        onOpenChange={(open) => !open && setAddApartmentPerson(null)}
        person={addApartmentPerson}
        onSave={async (apartmentIds) => {
          if (!addApartmentPerson) return;
          setAddApartmentPending(true);
          try {
            let added = 0;
            let skipped = 0;
            for (const aptId of apartmentIds) {
              try {
                await tenantsApi.create({
                  name: addApartmentPerson.name,
                  oib: addApartmentPerson.oib || undefined,
                  email: addApartmentPerson.email || undefined,
                  phone: addApartmentPerson.phone || undefined,
                  apartment_id: aptId,
                  delivery_method: (addApartmentPerson.deliveryMethod === 'email' || addApartmentPerson.deliveryMethod === 'pošta' || addApartmentPerson.deliveryMethod === 'both')
                    ? addApartmentPerson.deliveryMethod
                    : undefined,
                  person_id: addApartmentPerson.id,
                });
                added++;
              } catch (err: any) {
                if (err?.status === 409) {
                  skipped++;
                } else {
                  throw err;
                }
              }
            }
            await queryClient.invalidateQueries({ queryKey: ["tenants"] });
            await queryClient.invalidateQueries({ queryKey: ["persons"] });
            await queryClient.invalidateQueries({ queryKey: ["cities"] });
            setAddApartmentPerson(null);
            const msg = skipped > 0
              ? `Suvlasnik dodan na ${added} stanova, ${skipped} već zauzet${skipped === 1 ? "" : "a"}.`
              : `Suvlasnik je dodan na ${added} stanova.`;
            toast({ title: "Stanovi dodani", description: msg });
          } catch (err) {
            toast({
              title: "Greška",
              description: (err as Error)?.message ?? "Nije moguće dodati stanove.",
              variant: "destructive",
            });
          } finally {
            setAddApartmentPending(false);
          }
        }}
        isPending={addApartmentPending}
      />

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          <SheetHeader>
            <SheetTitle>Filteri</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label>Status plaćanja</Label>
              <RadioGroup value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="status-all" />
                  <Label htmlFor="status-all" className="font-normal cursor-pointer">Svi suvlasnici</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid" id="status-paid" />
                  <Label htmlFor="status-paid" className="font-normal cursor-pointer">Plaća uredno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overdue" id="status-overdue" />
                  <Label htmlFor="status-overdue" className="font-normal cursor-pointer">Dužnici</Label>
                </div>
              </RadioGroup>
            </div>

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
              <Label>Način dostave</Label>
              <RadioGroup value={deliveryFilter} onValueChange={(val) => setDeliveryFilter(val as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="delivery-all" />
                  <Label htmlFor="delivery-all" className="font-normal cursor-pointer">Svi načini</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="delivery-email" />
                  <Label htmlFor="delivery-email" className="font-normal cursor-pointer">
                    E-mail
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pošta" id="delivery-mail" />
                  <Label htmlFor="delivery-mail" className="font-normal cursor-pointer">
                    Pošta
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
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

export default Tenants;
