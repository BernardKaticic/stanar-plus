import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Plus, Edit2, Trash2, Home, User, Menu, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import { CityDialog } from "@/components/buildings/CityDialog";
import { StreetDialog } from "@/components/buildings/StreetDialog";
import { BuildingDialog } from "@/components/buildings/BuildingDialog";
import { ApartmentDialog } from "@/components/buildings/ApartmentDialog";
import { ApartmentDetailDialog } from "@/components/buildings/ApartmentDetailDialog";
import { BuildingsTreeSidebar } from "@/components/buildings/BuildingsTreeSidebar";
import {
  useCities,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
  useCreateStreet,
  useUpdateStreet,
  useDeleteStreet,
  useCreateBuilding,
  useUpdateBuilding,
  useDeleteBuilding,
  useCreateApartment,
  useUpdateApartment,
  useDeleteApartment,
} from "@/hooks/useBuildingsData";

interface Transaction {
  id: string;
  type: "charge" | "payment";
  date: Date;
  amount: number;
  description: string;
  period?: string;
}

interface Apartment {
  id: string;
  number: string;
  area: number;
  owner?: string;
  tenant?: string;
  contact?: string;
  email?: string;
  phone?: string;
  debt: number;
  reserve: number;
  notes?: string;
  transactions: Transaction[];
}

interface Building {
  id: string;
  name: string;
  apartments: Apartment[];
  debt: number;
  reserve: number;
  iban?: string;
  oib?: string;
  representative?: string;
  representativePhone?: string;
  fees?: {
    cleaning: number;
    loan: number;
    reservePerSqm: number;
  };
}

interface Street {
  id: string;
  name: string;
  buildings: Building[];
}

interface City {
  id: string;
  name: string;
  streets: Street[];
  totalApartments: number;
  totalDebt: number;
}

const formatNumber = (value?: number) => {
  if (typeof value !== "number") {
    return "0";
  }
  return value.toLocaleString("hr-HR");
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") {
    return "0,00 €";
  }
  return value.toLocaleString("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
};

const Buildings = () => {
  const { data: cities, isLoading } = useCities();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();
  const createStreet = useCreateStreet();
  const updateStreet = useUpdateStreet();
  const deleteStreet = useDeleteStreet();
  const createBuilding = useCreateBuilding();
  const updateBuilding = useUpdateBuilding();
  const deleteBuilding = useDeleteBuilding();
  const createApartment = useCreateApartment();
  const updateApartment = useUpdateApartment();
  const deleteApartment = useDeleteApartment();

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  // Dialog states
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [streetDialogOpen, setStreetDialogOpen] = useState(false);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [apartmentDialogOpen, setApartmentDialogOpen] = useState(false);
  const [apartmentDetailOpen, setApartmentDetailOpen] = useState(false);

  // Edit states
  const [editingCity, setEditingCity] = useState<{ id: string; name: string } | null>(null);
  const [editingStreet, setEditingStreet] = useState<{ id: string; name: string } | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);

  // Delete states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "city" | "street" | "building" | "apartment";
    id: string;
    name: string;
  } | null>(null);

  // City CRUD
  const handleAddCity = (data: { name: string }) => {
    createCity.mutate(data, {
      onSuccess: () => setCityDialogOpen(false),
    });
  };

  const handleEditCity = (data: { name: string }) => {
    if (!editingCity) return;
    updateCity.mutate({ id: editingCity.id, ...data }, {
      onSuccess: () => {
        setCityDialogOpen(false);
        setEditingCity(null);
      },
    });
  };

  const handleDeleteCity = (id: string) => {
    deleteCity.mutate(id, {
      onSuccess: () => {
        if (selectedCity?.id === id) setSelectedCity(null);
      },
    });
  };

  // Street CRUD
  const handleAddStreet = (data: { name: string }) => {
    if (!selectedCity) return;
    createStreet.mutate({ ...data, city_id: selectedCity.id }, {
      onSuccess: () => setStreetDialogOpen(false),
    });
  };

  const handleEditStreet = (data: { name: string }) => {
    if (!editingStreet) return;
    updateStreet.mutate({ id: editingStreet.id, ...data }, {
      onSuccess: () => {
        setStreetDialogOpen(false);
        setEditingStreet(null);
      },
    });
  };

  const handleDeleteStreet = (id: string) => {
    deleteStreet.mutate(id, {
      onSuccess: () => {
        if (selectedStreet?.id === id) setSelectedStreet(null);
      },
    });
  };

  // Building CRUD
  const handleAddBuilding = (data: { name: string }) => {
    if (!selectedCity || !selectedStreet) return;
    createBuilding.mutate({ number: data.name, street_id: selectedStreet.id }, {
      onSuccess: () => setBuildingDialogOpen(false),
    });
  };

  const handleEditBuilding = (data: { name: string }) => {
    if (!editingBuilding) return;
    updateBuilding.mutate({ id: editingBuilding.id, number: data.name }, {
      onSuccess: () => {
        setBuildingDialogOpen(false);
        setEditingBuilding(null);
      },
    });
  };

  const handleDeleteBuilding = (id: string) => {
    deleteBuilding.mutate(id, {
      onSuccess: () => {
        if (selectedBuilding?.id === id) setSelectedBuilding(null);
      },
    });
  };

  // Apartment CRUD
  const handleAddApartment = (data: Omit<Apartment, 'id' | 'debt' | 'reserve'>) => {
    if (!selectedBuilding) return;
    createApartment.mutate({
      apartment_number: data.number,
      floor: 1,
      size_m2: data.area,
      building_id: selectedBuilding.id,
    }, {
      onSuccess: () => {
        setApartmentDialogOpen(false);
      },
    });
  };

  const handleEditApartment = (data: Omit<Apartment, 'id' | 'debt' | 'reserve'>) => {
    if (!editingApartment) return;
    updateApartment.mutate({
      id: editingApartment.id,
      apartment_number: data.number,
      floor: 1,
      size_m2: data.area,
    }, {
      onSuccess: () => {
        setApartmentDialogOpen(false);
        setEditingApartment(null);
        if (selectedApartment?.id === editingApartment.id) {
          setSelectedApartment({ ...selectedApartment, ...data });
        }
      },
    });
  };

  const handleDeleteApartment = (id: string) => {
    deleteApartment.mutate(id, {
      onSuccess: () => {
        if (selectedApartment?.id === id) {
          setSelectedApartment(null);
          setApartmentDetailOpen(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "city") handleDeleteCity(deleteDialog.id);
    if (deleteDialog.type === "street") handleDeleteStreet(deleteDialog.id);
    if (deleteDialog.type === "building") handleDeleteBuilding(deleteDialog.id);
    if (deleteDialog.type === "apartment") handleDeleteApartment(deleteDialog.id);
    setDeleteDialog(null);
  };

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setSelectedStreet(null);
    setSelectedBuilding(null);
  };

  const handleSelectStreet = (street: Street) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
  };

  const handleSelectBuilding = (building: Building) => {
    // Find parent city and street for this building
    let foundCity: City | null = null;
    let foundStreet: Street | null = null;

    if (cities) {
      for (const city of cities) {
        for (const street of city.streets) {
          if (street.buildings.some(b => b.id === building.id)) {
            foundCity = city;
            foundStreet = street;
            break;
          }
        }
        if (foundCity) break;
      }
    }

    setSelectedCity(foundCity);
    setSelectedStreet(foundStreet);
    setSelectedBuilding(building);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Tree Sidebar - Desktop only */}
      <div className="hidden lg:block">
        <BuildingsTreeSidebar
          cities={cities || []}
          selectedCity={selectedCity}
          selectedStreet={selectedStreet}
          selectedBuilding={selectedBuilding}
          onSelectCity={handleSelectCity}
          onSelectStreet={handleSelectStreet}
          onSelectBuilding={handleSelectBuilding}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6">
          {!selectedBuilding && (
            <div className="flex items-center justify-between gap-3">
              {/* Mobile navigation button */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden min-w-[44px] min-h-[44px]"
                onClick={() => setNavDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">
                  {!selectedCity && "Svi gradovi"}
                  {selectedCity && !selectedStreet && selectedCity.name}
                  {selectedStreet && !selectedBuilding && selectedStreet.name}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm hidden sm:block">
                  {!selectedCity && "Odaberite grad iz navigacije"}
                  {selectedCity && !selectedStreet && "Odaberite ulicu za pregled ulaza"}
                  {selectedStreet && !selectedBuilding && "Odaberite ulaz za detaljne informacije"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!selectedCity && (
                  <Button className="min-h-[44px]" onClick={() => setCityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj grad
                  </Button>
                )}
                {selectedCity && !selectedStreet && (
                  <Button className="min-h-[44px]" onClick={() => setStreetDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj ulicu
                  </Button>
                )}
                {selectedStreet && !selectedBuilding && (
                  <Button className="min-h-[44px]" onClick={() => setBuildingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj ulaz
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Overview Cards - All Cities */}
          {!selectedCity && cities && (
            cities.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Nema gradova"
                description="Započnite dodavanjem prvog grada u sustav."
                action={
                  <Button className="min-h-[44px]" onClick={() => setCityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj prvi grad
                  </Button>
                }
              />
            ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <Card 
                  key={city.id} 
                  className="p-6 cursor-pointer hover:bg-accent/30 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  onClick={() => handleSelectCity(city)}
                >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{city.name}</h3>
                    <p className="text-sm text-muted-foreground">{city.streets.length} ulica/e</p>
                  </div>
                </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="min-w-[44px] min-h-[44px] hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      setEditingCity({ id: city.id, name: city.name });
                      setCityDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="min-w-[44px] min-h-[44px] hover:bg-destructive/10"
                    onClick={() => setDeleteDialog({ open: true, type: "city", id: city.id, name: city.name })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stanovi</p>
                    <p className="font-semibold">{formatNumber(city.totalApartments)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dugovanja</p>
                    <p className="font-semibold text-destructive">{formatCurrency(city.totalDebt)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )
          )}

          {/* Streets Grid */}
          {selectedCity && !selectedStreet && !selectedBuilding && (
            selectedCity.streets.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Nema ulica"
                description={`Dodajte prvu ulicu u grad ${selectedCity.name}.`}
                action={
                  <Button className="min-h-[44px]" onClick={() => setStreetDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj prvu ulicu
                  </Button>
                }
              />
            ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedCity.streets.map((street) => (
                <Card 
                  key={street.id} 
                  className="p-6 cursor-pointer hover:bg-accent/30 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  onClick={() => handleSelectStreet(street)}
                >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{street.name}</h3>
                    <p className="text-sm text-muted-foreground">{street.buildings.length} ulaz/a</p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="min-w-[44px] min-h-[44px] hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        setEditingStreet({ id: street.id, name: street.name });
                        setStreetDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="min-w-[44px] min-h-[44px] hover:bg-destructive/10"
                      onClick={() => setDeleteDialog({ open: true, type: "street", id: street.id, name: street.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
            )
          )}

          {/* Buildings Grid */}
          {selectedStreet && !selectedBuilding && (
            selectedStreet.buildings.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Nema zgrada"
                description={`Dodajte prvi ulaz u ulicu ${selectedStreet.name}.`}
                action={
                  <Button className="min-h-[44px]" onClick={() => setBuildingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj prvi ulaz
                  </Button>
                }
              />
            ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedStreet.buildings.map((building) => (
                <Card 
                  key={building.id} 
                  className="p-6 cursor-pointer hover:bg-accent/30 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  onClick={() => handleSelectBuilding(building)}
                >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg p-2 bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Broj {building.name}</h3>
                      <p className="text-sm text-muted-foreground">{building.apartments.length} stanova</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="min-w-[44px] min-h-[44px] hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        setEditingBuilding(building);
                        setBuildingDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="min-w-[44px] min-h-[44px] hover:bg-destructive/10"
                      onClick={() => setDeleteDialog({ open: true, type: "building", id: building.id, name: building.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pričuva</span>
                    <span className="font-medium">{formatCurrency(building.reserve)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dugovanja</span>
                    <Badge variant={building.debt > 0 ? "destructive" : "default"}>
                      {formatCurrency(building.debt)}
                    </Badge>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
            )
          )}

          {/* Building Detail View */}
          {selectedBuilding && (
            <div className="space-y-6 animate-fade-in">
              <Card className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg p-3 bg-primary/10">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Ulaz {selectedBuilding.name}</h2>
                      <p className="text-muted-foreground">
                        {selectedStreet?.name}, {selectedCity?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => {
                        setEditingBuilding(selectedBuilding);
                        setBuildingDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Uredi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    className="min-h-[44px]"
                      onClick={() => setDeleteDialog({ open: true, type: "building", id: selectedBuilding.id, name: selectedBuilding.name })}
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                      Obriši
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-muted-foreground">Broj stanova</p>
                    <p className="text-2xl font-bold">{selectedBuilding.apartments.length}</p>
                  </Card>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-muted-foreground">Pričuva</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(selectedBuilding.reserve)}
                    </p>
                  </Card>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-muted-foreground">Dugovanja</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(selectedBuilding.debt)}
                    </p>
                  </Card>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Podaci zgrade</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono text-xs sm:text-sm">
                        {selectedBuilding.iban || <span className="text-muted-foreground italic">Nije uneseno</span>}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-muted-foreground">OIB</span>
                      <span className="font-mono">
                        {selectedBuilding.oib || <span className="text-muted-foreground italic">Nije uneseno</span>}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-muted-foreground">Predstavnik</span>
                      <span>
                        {selectedBuilding.representative || <span className="text-muted-foreground italic">Nije dodijeljen</span>}
                      </span>
                    </div>
                    {selectedBuilding.representativePhone && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-muted-foreground">Telefon</span>
                        <span className="font-mono">{selectedBuilding.representativePhone}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 min-h-[44px]"
                      onClick={() => {
                        setEditingBuilding(selectedBuilding);
                        setBuildingDialogOpen(true);
                      }}
                    >
                      Uredi podatke zgrade
                    </Button>
                  </div>
                </div>

                {selectedBuilding.fees && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3">Naknade</h3>
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                      <Card className="p-4">
                        <p className="text-muted-foreground">Čišćenje (mj.)</p>
                        <p className="text-lg font-semibold mt-1">{formatCurrency(selectedBuilding.fees.cleaning)}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-muted-foreground">Kredit (mj.)</p>
                        <p className="text-lg font-semibold mt-1">{formatCurrency(selectedBuilding.fees.loan)}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-muted-foreground">Pričuva po m²</p>
                        <p className="text-lg font-semibold mt-1">
                          {formatCurrency(selectedBuilding.fees.reservePerSqm)} / m²
                        </p>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Stanovi</h3>
                  <Button 
                    size="sm" 
                    className="min-h-[44px]"
                    onClick={() => setApartmentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj stan
                  </Button>
                </div>
                
                {selectedBuilding.apartments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nema dodanih stanova</p>
                    <p className="text-sm mt-2">Kliknite "Dodaj stan" za početak</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {selectedBuilding.apartments.map((apartment) => (
                      <Card 
                        key={apartment.id}
                        className="p-4 cursor-pointer hover:bg-accent/30 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300"
                        onClick={() => {
                          setSelectedApartment(apartment);
                          setApartmentDetailOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Stan {apartment.number}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{apartment.area} m²</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {apartment.owner && (
                            <p className="text-muted-foreground truncate">
                              <span className="font-medium">Vlasnik:</span> {apartment.owner}
                            </p>
                          )}
                          {apartment.tenant && apartment.tenant !== apartment.owner && (
                            <p className="text-muted-foreground truncate">
                              <span className="font-medium">Stanar:</span> {apartment.tenant}
                            </p>
                          )}
                          <div className="flex justify-between pt-2">
                            <span className={apartment.debt > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                              Dug: {formatCurrency(apartment.debt)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Dialogs */}
          <CityDialog
        open={cityDialogOpen}
        onOpenChange={(open) => {
          setCityDialogOpen(open);
          if (!open) setEditingCity(null);
        }}
            onSave={editingCity ? handleEditCity : handleAddCity}
            editCity={editingCity}
          />

          <StreetDialog
        open={streetDialogOpen}
        onOpenChange={(open) => {
          setStreetDialogOpen(open);
          if (!open) setEditingStreet(null);
        }}
            onSave={editingStreet ? handleEditStreet : handleAddStreet}
            editStreet={editingStreet}
            cityName={selectedCity?.name || ""}
          />

          <BuildingDialog
        open={buildingDialogOpen}
        onOpenChange={(open) => {
          setBuildingDialogOpen(open);
          if (!open) setEditingBuilding(null);
        }}
            onSave={editingBuilding ? handleEditBuilding : handleAddBuilding}
            editBuilding={editingBuilding}
            streetName={selectedStreet?.name || ""}
          />

          <ApartmentDialog
            open={apartmentDialogOpen}
            onOpenChange={(open) => {
              setApartmentDialogOpen(open);
              if (!open) setEditingApartment(null);
            }}
            onSave={editingApartment ? handleEditApartment : handleAddApartment}
            editApartment={editingApartment}
            buildingName={selectedBuilding?.name || ""}
            fees={selectedBuilding?.fees}
          />

          <ApartmentDetailDialog
            apartment={selectedApartment}
            open={apartmentDetailOpen}
            onOpenChange={setApartmentDetailOpen}
            onEdit={(apartment) => {
              setEditingApartment(apartment);
              setApartmentDialogOpen(true);
              setApartmentDetailOpen(false);
            }}
            onDelete={(id, number) => {
              setDeleteDialog({ open: true, type: "apartment", id, name: number });
              setApartmentDetailOpen(false);
            }}
            buildingName={selectedBuilding?.name || ""}
            streetName={selectedStreet?.name || ""}
            cityName={selectedCity?.name || ""}
            fees={selectedBuilding?.fees}
          />

          {/* Mobile Navigation Drawer */}
          <Sheet open={navDrawerOpen} onOpenChange={setNavDrawerOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle>Struktura zgrada</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100%-60px)]">
                <BuildingsTreeSidebar
                  cities={cities || []}
                  selectedCity={selectedCity}
                  selectedStreet={selectedStreet}
                  selectedBuilding={selectedBuilding}
                  onSelectCity={(city) => {
                    handleSelectCity(city);
                    setNavDrawerOpen(false);
                  }}
                  onSelectStreet={(street) => {
                    handleSelectStreet(street);
                    setNavDrawerOpen(false);
                  }}
                  onSelectBuilding={(building) => {
                    handleSelectBuilding(building);
                    setNavDrawerOpen(false);
                  }}
                  collapsed={false}
                  onToggleCollapse={() => {}}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija je nepovratna. {deleteDialog?.type === "city" && "Brisat će se i sve ulice i ulazi u gradu."}
                  {deleteDialog?.type === "street" && "Brisat će se i svi ulazi na ulici."}
                  {deleteDialog?.type === "building" && "Brisat će se i svi stanovi u ulazu."}
                  {deleteDialog?.type === "apartment" && "Stan će biti trajno obrisan."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Odustani</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Obriši
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Buildings;
