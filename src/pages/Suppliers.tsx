import { Truck, Plus, Mail, Phone, Euro, Search, Filter, Download, Building2 as BuildingIcon, Check, ChevronsUpDown, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { startOfDay, startOfYear, format } from "date-fns";
import { hr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

const Suppliers = () => {
  const [isLoading] = useState(false);
  // Initialize dates: from start of year to today
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date>(startOfDay(new Date()));
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [buildingSearchOpen, setBuildingSearchOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const buildings = [
    { id: "all", name: "Sve zgrade" },
    { id: "b1", name: "A.Starčevića 15, Vinkovci" },
    { id: "b2", name: "Ohridska 7, Vinkovci" },
    { id: "b3", name: "J.J.Strossmayera 22, Vinkovci" },
    { id: "b4", name: "Trg kralja Tomislava 12, Vinkovci" },
    { id: "b5", name: "Antuna Starčevića 23A, Vinkovci" },
    { id: "b6", name: "Lapovačka 5, Vukovar" },
    { id: "b7", name: "Nikole Tesle 5, Vukovar" },
    // ... može biti i 700 zgrada
  ];

  const suppliers = [
    {
      id: 1,
      name: "HEP - Elektra Zagreb d.o.o.",
      category: "Energija",
      iban: "HR1210010051863000160",
      oib: "45678901234",
      contact: "+385 1 6301 111",
      email: "info@hep.hr",
      monthlyAverage: "2.450,00 €",
      yearlyTotal: "29.400,00 €",
      lastInvoice: "15.02.2025.",
    },
    {
      id: 2,
      name: "Zagrebačke otpadne vode d.o.o.",
      category: "Komunalije",
      iban: "HR2323400091110102938",
      oib: "56789012345",
      contact: "+385 1 6333 600",
      email: "info@zov.hr",
      monthlyAverage: "1.850,00 €",
      yearlyTotal: "22.200,00 €",
      lastInvoice: "10.02.2025.",
    },
    {
      id: 3,
      name: "Čistoća d.o.o.",
      category: "Čišćenje",
      iban: "HR5523600001101234567",
      oib: "67890123456",
      contact: "+385 1 3650 111",
      email: "cistoca@zg.hr",
      monthlyAverage: "1.200,00 €",
      yearlyTotal: "14.400,00 €",
      lastInvoice: "05.02.2025.",
    },
    {
      id: 4,
      name: "Servis lifta Marić d.o.o.",
      category: "Održavanje",
      iban: "HR8624020061100000001",
      oib: "78901234567",
      contact: "+385 91 567 8901",
      email: "servis@maric-liftovi.hr",
      monthlyAverage: "350,00 €",
      yearlyTotal: "4.200,00 €",
      lastInvoice: "01.02.2025.",
    },
    {
      id: 5,
      name: "Vodoinstalater Horvat",
      category: "Održavanje",
      iban: "HR4523400091110765432",
      oib: "89012345678",
      contact: "+385 98 765 4321",
      email: "horvat.vodoinstalater@gmail.com",
      monthlyAverage: "450,00 €",
      yearlyTotal: "5.400,00 €",
      lastInvoice: "28.01.2025.",
    },
  ];

  const totalYearly = suppliers.reduce((sum, s) => 
    sum + parseFloat(s.yearlyTotal.replace(/[^\d,]/g, '').replace(',', '.')), 0
  );

  const totalMonthly = suppliers.reduce((sum, s) => 
    sum + parseFloat(s.monthlyAverage.replace(/[^\d,]/g, '').replace(',', '.')), 0
  );

  const categories = Array.from(new Set(suppliers.map(s => s.category)));

  // Apply category filter
  const filteredSuppliers = categoryFilter === 'all' 
    ? suppliers 
    : suppliers.filter(s => s.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dobavljači</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pregled dobavljača i troškova po kategorijama
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex min-h-[44px]">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button className="min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj dobavljača
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno dobavljača</p>
          <p className="text-2xl font-bold mt-1">{suppliers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Kategorija</p>
          <p className="text-2xl font-bold mt-1">{categories.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            {dateFrom || dateTo ? "Trošak u periodu" : "Mjesečni prosjek"}
          </p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {totalMonthly.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €
          </p>
          {(dateFrom || dateTo) && (
            <p className="text-xs text-muted-foreground mt-1">
              {dateFrom && format(dateFrom, "d.M.yyyy.", { locale: hr })} - {dateTo ? format(dateTo, "d.M.yyyy.", { locale: hr }) : "danas"}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            {dateFrom || dateTo ? "Projekcija godišnje" : "Godišnji trošak"}
          </p>
          <p className="text-2xl font-bold mt-1 text-warning">
            {totalYearly.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €
          </p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4 mb-6">
          {/* Filters Row */}
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pretraži dobavljače..." className="pl-10" />
            </div>

            {/* Building selector with search */}
            <Popover open={buildingSearchOpen} onOpenChange={setBuildingSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={buildingSearchOpen}
                  className="w-[300px] justify-between min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4" />
                    <span className="truncate">
                      {selectedBuilding
                        ? buildings.find((building) => building.id === selectedBuilding)?.name
                        : "Odaberi zgradu..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pretraži zgrade..." />
                  <CommandList>
                    <CommandEmpty>Zgrada nije pronađena.</CommandEmpty>
                    <CommandGroup>
                      {buildings.map((building) => (
                        <CommandItem
                          key={building.id}
                          value={building.name}
                          onSelect={() => {
                            setSelectedBuilding(building.id);
                            setBuildingSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBuilding === building.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {building.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Range */}
            <div className="flex gap-2">
              <DatePicker
                date={dateFrom}
                onDateChange={setDateFrom}
                placeholder="Datum od"
              />
              <DatePicker
                date={dateTo}
                onDateChange={setDateTo}
                placeholder="Datum do"
              />
            </div>

            {/* Reset filters */}
            {selectedBuilding !== "all" && (
              <Button 
                variant="ghost" 
                className="min-h-[44px]"
                onClick={() => {
                  setDateFrom(startOfYear(new Date()));
                  setDateTo(startOfDay(new Date()));
                  setSelectedBuilding("all");
                }}
              >
                Poništi filtere
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {(dateFrom || dateTo || selectedBuilding !== "all") && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Aktivni filteri:</span>
              {selectedBuilding !== "all" && (
                <Badge variant="secondary">
                  {buildings.find(b => b.id === selectedBuilding)?.name}
                </Badge>
              )}
              {dateFrom && (
                <Badge variant="secondary">
                  Od: {format(dateFrom, "d.M.yyyy.", { locale: hr })}
                </Badge>
              )}
              {dateTo && (
                <Badge variant="secondary">
                  Do: {format(dateTo, "d.M.yyyy.", { locale: hr })}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={categoryFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setCategoryFilter('all')}
            >
              Svi
            </Button>
            {categories.map((category) => (
              <Button 
                key={category} 
                variant={categoryFilter === category ? 'default' : 'outline'} 
                size="sm" 
                className="min-h-[44px]"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          {categoryFilter !== 'all' && (
            <div className="text-sm text-muted-foreground">
              Prikazano {filteredSuppliers.length} od {suppliers.length} dobavljača
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dobavljač</TableHead>
                <TableHead>Kategorija</TableHead>
                <TableHead>OIB</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead className="text-right">
                  {dateFrom || dateTo ? "Ukupno u periodu" : "Mjesečni prosjek"}
                </TableHead>
                <TableHead className="text-right">
                  {dateFrom || dateTo ? "Broj računa" : "Godišnje"}
                </TableHead>
                <TableHead className="text-right">Akcije</TableHead>
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
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={Truck}
                      title="Nema dobavljača"
                      description={suppliers.length === 0 ? "Dodajte prvog dobavljača klikom na gumb iznad" : "Nema dobavljača koji odgovaraju kriterijima"}
                      action={suppliers.length === 0 ? (
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj dobavljača
                        </Button>
                      ) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p>{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Zadnja faktura: {supplier.lastInvoice}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{supplier.oib}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {supplier.contact}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {supplier.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{supplier.iban}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {supplier.monthlyAverage}
                  </TableCell>
                  <TableCell className="text-right font-bold text-warning">
                    {dateFrom || dateTo ? "3" : supplier.yearlyTotal}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="min-h-[44px]">Uredi</Button>
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
          ) : filteredSuppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nema dobavljača"
              description={suppliers.length === 0 ? "Dodajte prvog dobavljača klikom na gumb iznad" : "Nema dobavljača koji odgovaraju kriterijima"}
              action={suppliers.length === 0 ? (
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj dobavljača
                </Button>
              ) : undefined}
            />
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{supplier.name}</h3>
                      <Badge variant="outline" className="mt-1">{supplier.category}</Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Zadnja faktura: {supplier.lastInvoice}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground text-xs">Mjesečno</p>
                      <p className="font-semibold text-primary">{supplier.monthlyAverage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Godišnje</p>
                      <p className="font-bold text-warning">{supplier.yearlyTotal}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Kontakt</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs">{supplier.contact}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs truncate">{supplier.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">IBAN</p>
                      <p className="font-mono text-xs break-all">{supplier.iban}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">OIB</p>
                      <p className="font-mono text-xs">{supplier.oib}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                    Uredi
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const categorySuppliers = suppliers.filter(s => s.category === category);
          const categoryTotal = categorySuppliers.reduce((sum, s) => 
            sum + parseFloat(s.yearlyTotal.replace(/[^\d,]/g, '').replace(',', '.')), 0
          );
          
          return (
            <Card key={category} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{category}</h3>
                <Badge variant="secondary">{categorySuppliers.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-bold">
                  {categoryTotal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dateFrom || dateTo ? "U periodu" : "Godišnje"}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Suppliers;
