import { Plus, Search, FileText, Filter, X, MapPin, AlertCircle, Edit2, MoreVertical } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { usePersons } from "@/hooks/usePersonsData";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenantsManagement";
import { TenantDialog } from "@/components/tenants/TenantDialog";
import { TenantEditDialog } from "@/components/tenants/TenantEditDialog";
import { AddApartmentToPersonDialog } from "@/components/tenants/AddApartmentToPersonDialog";
import { TempPasswordModal } from "@/components/TempPasswordModal";
import { usersApi, buildingsApi, tenantsApi } from "@/lib/api";
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
  const { data: personsData, isLoading } = usePersons({ page, pageSize, search: searchTerm });
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [editingTenant, setEditingTenant] = useState<{
    id: string;
    name: string;
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
    deliveryMethod?: string | null;
    apartments: { apartmentId: string }[];
  } | null>(null);
  const [addApartmentPending, setAddApartmentPending] = useState(false);
  const { toast } = useToast();

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

  // Get unique cities from all apartments
  const cities = Array.from(new Set(allPersons.flatMap(p => p.apartments.map(a => a.city).filter(Boolean)))).sort() as string[];

  // Apply filters
  const persons = allPersons.filter(person => {
    if (statusFilter !== 'all' && person.status !== statusFilter) return false;
    if (deliveryFilter === 'email' && person.deliveryMethod !== 'email' && person.deliveryMethod !== 'both') return false;
    if (deliveryFilter === 'pošta' && person.deliveryMethod !== 'pošta' && person.deliveryMethod !== 'both') return false;
    if (cityFilter !== 'all') {
      const hasCity = person.apartments.some(a => a.city === cityFilter);
      if (!hasCity) return false;
    }
    return true;
  });

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) + 
    (deliveryFilter !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setDeliveryFilter('all');
    setCityFilter('all');
  };

  const stats = {
    total: totalCount,
    paid: persons.filter(p => p.status === 'paid').length,
    overdue: persons.filter(p => p.status === 'overdue').length,
    email: persons.filter(p => p.deliveryMethod === 'email' || p.deliveryMethod === 'both').length,
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
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno suvlasnika</p>
          <p className="text-xl font-semibold mt-1">{isLoading ? "..." : stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Uredno plaćaju</p>
          <p className="text-xl font-semibold mt-1 text-success">
            {isLoading ? "..." : stats.paid}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">U dugu</p>
          <p className="text-xl font-semibold mt-1 text-destructive">
            {isLoading ? "..." : stats.overdue}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">E-mail dostava</p>
          <p className="text-xl font-semibold mt-1">
            {isLoading ? "..." : stats.email}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div>
              <CardTitle>Popis suvlasnika</CardTitle>
              <CardDescription>
                Pretraga, filteri i izvoz
              </CardDescription>
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
              className="pl-9"
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
                <TableHead className="w-[22%] text-xs font-medium">Suvlasnik</TableHead>
                <TableHead className="w-[18%] text-xs font-medium">Email</TableHead>
                <TableHead className="w-[20%] text-xs font-medium">Stan</TableHead>
                <TableHead className="w-[12%] text-right text-xs font-medium">Mjesečna rata</TableHead>
                <TableHead className="w-[10%] text-right text-xs font-medium">Saldo</TableHead>
                <TableHead className="w-[10%] text-xs font-medium">Dostava</TableHead>
                <TableHead className="w-[8%] text-right text-xs font-medium">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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
                      title="Nema suvlasnika"
                      description="Dodajte prvog suvlasnika da biste započeli s evidencijom."
                      action={{ label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                persons.map((person) => {
                  const firstApt = person.apartments[0];
                  return (
                  <TableRow
                    key={person.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/persons/${person.id}`)}
                  >
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {person.status === 'overdue' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {person.name}
                        {person.apartmentsCount > 1 && (
                          <Badge variant="secondary" className="text-xs px-1.5">
                            {person.apartmentsCount} stana
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs truncate" title={person.email || "-"}>{person.email || "-"}</TableCell>
                    <TableCell className="text-xs truncate" title={person.apartmentsCount === 1 && firstApt?.address ? firstApt.address : person.apartmentsCount > 1 ? `${person.apartmentsCount} stana` : "-"}>
                      {person.apartmentsCount === 1 && firstApt?.address
                        ? firstApt.address
                        : person.apartmentsCount > 1
                        ? `${person.apartmentsCount} stana`
                        : "-"}
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
                          <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Pregled detalja
                          </DropdownMenuItem>
                          {person.apartments.length > 0 && (
                            <>
                              {person.apartmentsCount === 1 ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingTenant({
                                      id: firstApt!.tenantId,
                                      name: person.name,
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
                                    deliveryMethod: person.deliveryMethod,
                                    apartments: person.apartments,
                                  })
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj stan
                              </DropdownMenuItem>
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
              title="Nema suvlasnika"
              description="Dodajte prvog suvlasnika da biste započeli s evidencijom."
              action={{ label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
            />
          ) : (
            persons.map((person) => {
              const firstApt = person.apartments[0];
              const addressStr = person.apartmentsCount === 1 && firstApt?.address
                ? firstApt.address
                : person.apartments.map(a => a.address || a.city).filter(Boolean).slice(0, 2).join(' • ') || '-';
              const cityStr = [...new Set(person.apartments.map(a => a.city).filter(Boolean))].join(', ') || '';
              return (
              <Card
                key={person.id}
                className="rounded-lg border border-border bg-card px-4 py-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/persons/${person.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {person.status === 'overdue' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <h3 className="font-semibold">{person.name}</h3>
                      {person.apartmentsCount > 1 && (
                        <Badge variant="secondary" className="text-xs">{person.apartmentsCount} stana</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{addressStr}{cityStr ? `, ${cityStr}` : ''}</p>
                    {person.email && (
                      <p className="text-xs text-muted-foreground mt-1">{person.email}</p>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px] -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Pregled detalja
                      </DropdownMenuItem>
                      {person.apartments.length > 0 && (
                        <>
                          {person.apartmentsCount === 1 ? (
                            <DropdownMenuItem
                              onClick={() =>
                                setEditingTenant({
                                  id: firstApt!.tenantId,
                                  name: person.name,
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
                                deliveryMethod: person.deliveryMethod,
                                apartments: person.apartments,
                              })
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Dodaj stan
                          </DropdownMenuItem>
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
                onSuccess: async (firstTenant) => {
                  const personId = firstTenant?.person_id ? String(firstTenant.person_id) : undefined;
                  for (let i = 1; i < aptIds.length; i++) {
                    try {
                      await tenantsApi.create({
                        name: data.name,
                        email: data.email || undefined,
                        phone: data.phone || undefined,
                        apartment_id: aptIds[i],
                        delivery_method: data.delivery_method || undefined,
                        person_id: personId,
                      });
                    } catch {
                      toast({
                        title: "Upozorenje",
                        description: `Suvlasnik je dodan na prvi stan, ali greška pri dodavanju na stan ${i + 1}.`,
                        variant: "destructive",
                      });
                      break;
                    }
                  }
                  for (const aptId of aptIds) {
                    try {
                      await buildingsApi.updateApartment(aptId, {
                        owner: data.name,
                        email: data.email || null,
                        phone: data.phone || null,
                      });
                    } catch (err) {
                      toast({
                        title: "Upozorenje",
                        description: `Suvlasnik je dodan, ali ažuriranje podataka stana nije uspjelo: ${(err as Error)?.message ?? "nepoznata greška"}`,
                        variant: "destructive",
                      });
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
                email: data.email || undefined,
                phone: data.phone || undefined,
                apartment_id: apartmentId,
                delivery_method: data.delivery_method || null,
              },
            },
            {
              onSuccess: async () => {
                if (apartmentId) {
                  try {
                    await buildingsApi.updateApartment(apartmentId, {
                      owner: data.name,
                      email: data.email || null,
                      phone: data.phone || null,
                    });
                  } catch (err) {
                    toast({
                      title: "Upozorenje",
                      description: `Suvlasnik je ažuriran, ali ažuriranje podataka stana nije uspjelo: ${(err as Error)?.message ?? "nepoznata greška"}`,
                      variant: "destructive",
                    });
                  }
                }
                setEditingTenant(null);
              },
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
            for (const aptId of apartmentIds) {
              await tenantsApi.create({
                name: addApartmentPerson.name,
                email: addApartmentPerson.email || undefined,
                phone: addApartmentPerson.phone || undefined,
                apartment_id: aptId,
                delivery_method: addApartmentPerson.deliveryMethod || undefined,
                person_id: addApartmentPerson.id,
              });
            }
            for (const aptId of apartmentIds) {
              try {
                await buildingsApi.updateApartment(aptId, {
                  owner: addApartmentPerson.name,
                  email: addApartmentPerson.email || null,
                  phone: addApartmentPerson.phone || null,
                });
              } catch (err) {
                toast({
                  title: "Upozorenje",
                  description: `Stanovi su dodani, ali ažuriranje podataka stana nije uspjelo: ${(err as Error)?.message ?? "nepoznata greška"}`,
                  variant: "destructive",
                });
              }
            }
            await queryClient.invalidateQueries({ queryKey: ["tenants"] });
            await queryClient.invalidateQueries({ queryKey: ["persons"] });
            await queryClient.invalidateQueries({ queryKey: ["cities"] });
            setAddApartmentPerson(null);
            toast({ title: "Stanovi dodani", description: `Suvlasnik je dodan na ${apartmentIds.length} stanova.` });
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
