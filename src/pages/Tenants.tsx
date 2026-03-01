import { Plus, Search, FileText, Filter, X, MapPin } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenants } from "@/hooks/useTenantsData";
import { useCreateTenant } from "@/hooks/useTenantsManagement";
import { TenantDialog } from "@/components/tenants/TenantDialog";
import { useState } from "react";
import { exportTableToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue'>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'email' | 'pošta'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const { data: tenantsData, isLoading } = useTenants({ page, pageSize, search: searchTerm });
  const createTenant = useCreateTenant();
  const { toast } = useToast();

  const handleExportCSV = () => {
    exportTableToCSV(
      tenants,
      [
        { key: 'name', label: 'Suvlasnik' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Adresa' },
        { key: 'city', label: 'Grad' },
        { key: 'area', label: 'Površina' },
        { key: 'monthlyRate', label: 'Mjesečna rata' },
        { key: 'balance', label: 'Saldo' },
        { key: 'deliveryMethod', label: 'Dostava' },
      ],
      'suvlasnici'
    );
    toast({
      title: "CSV exportan",
      description: `Izvezeno ${tenants.length} suvlasnika`,
    });
  };

  const allTenants = tenantsData?.data || [];
  const totalCount = tenantsData?.totalCount || 0;

  // Get unique cities
  const cities = Array.from(new Set(allTenants.map(t => t.city))).sort();

  // Apply filters
  const tenants = allTenants.filter(tenant => {
    if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
    if (deliveryFilter !== 'all' && tenant.deliveryMethod !== deliveryFilter) return false;
    if (cityFilter !== 'all' && tenant.city !== cityFilter) return false;
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
    paid: tenants.filter(t => t.status === 'paid').length,
    overdue: tenants.filter(t => t.status === 'overdue').length,
    email: tenants.filter(t => t.deliveryMethod === 'email').length,
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
              disabled={tenants.length === 0}
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
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium">Suvlasnik</TableHead>
                <TableHead className="text-xs font-medium">Email</TableHead>
                <TableHead className="text-xs font-medium">Adresa</TableHead>
                <TableHead className="text-xs font-medium">Grad</TableHead>
                <TableHead className="text-right text-xs font-medium">Površina</TableHead>
                <TableHead className="text-right text-xs font-medium">Mjesečna rata</TableHead>
                <TableHead className="text-right text-xs font-medium">Saldo</TableHead>
                <TableHead className="text-xs font-medium">Dostava</TableHead>
                <TableHead className="text-right text-xs font-medium">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <EmptyState
                      title="Nema suvlasnika"
                      description="Dodajte prvog suvlasnika da biste započeli s evidencijom."
                      action={{ label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {tenant.status === 'overdue' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {tenant.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{tenant.email || "-"}</TableCell>
                    <TableCell className="text-xs">{tenant.address}</TableCell>
                    <TableCell className="text-xs">{tenant.city}</TableCell>
                    <TableCell className="text-right text-xs">{tenant.area}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{tenant.monthlyRate}</TableCell>
                    <TableCell className={`text-right text-xs font-semibold ${
                      tenant.balanceNum < 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {tenant.balance}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tenant.deliveryMethod === 'email' ? 'E-mail' : 'Pošta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
          ) : tenants.length === 0 ? (
            <EmptyState
              title="Nema suvlasnika"
              description="Dodajte prvog suvlasnika da biste započeli s evidencijom."
              action={{ label: "Dodaj suvlasnika", onClick: () => setTenantDialogOpen(true) }}
            />
          ) : (
            tenants.map((tenant) => (
              <Card key={tenant.id} className="rounded-lg border border-border bg-card px-4 py-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {tenant.status === 'overdue' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <h3 className="font-semibold">{tenant.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{tenant.address}, {tenant.city}</p>
                    {tenant.email && (
                      <p className="text-xs text-muted-foreground mt-1">{tenant.email}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px] -mr-2">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
                  <div>
                    <p className="text-muted-foreground text-xs">Površina</p>
                    <p className="font-medium">{tenant.area}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Mjesečna rata</p>
                    <p className="font-medium">{tenant.monthlyRate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo</p>
                    <p className={`font-semibold ${
                      tenant.balanceNum < 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {tenant.balance}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Dostava</p>
                    <Badge variant="outline" className="text-xs">
                      {tenant.deliveryMethod === 'email' ? 'E-mail' : 'Pošta'}
                    </Badge>
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

      <TenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        onSave={(data) => {
          if (!data.name || !data.apartment_id) return;
          createTenant.mutate(
            {
              name: data.name,
              email: data.email || undefined,
              phone: data.phone || undefined,
              apartment_id: data.apartment_id,
            },
            { onSuccess: () => setTenantDialogOpen(false) }
          );
        }}
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
