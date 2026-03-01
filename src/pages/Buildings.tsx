import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  User,
  Menu,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { ApartmentDialog, type ApartmentFormPayload } from "@/components/buildings/ApartmentDialog";
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
import { tenantsApi, usersApi, buildingsApi, personsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TempPasswordModal } from "@/components/TempPasswordModal";

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
  tenant_id?: string;
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
  const [editingCity, setEditingCity] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [editingStreet, setEditingStreet] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);

  // Temp password modal (nakon kreiranja suvlasnika s emailom)
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    open: boolean;
    email: string;
    tempPassword: string;
  }>({ open: false, email: "", tempPassword: "" });

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
    updateCity.mutate(
      {
        id: editingCity.id,
        data,
      },
      {
        onSuccess: () => {
          setCityDialogOpen(false);
          setEditingCity(null);
        },
      },
    );
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
    createStreet.mutate(
      {
        cityId: selectedCity.id,
        data,
      },
      {
        onSuccess: () => setStreetDialogOpen(false),
      },
    );
  };

  const handleEditStreet = (data: { name: string }) => {
    if (!editingStreet) return;
    updateStreet.mutate(
      {
        id: editingStreet.id,
        data,
      },
      {
        onSuccess: () => {
          setStreetDialogOpen(false);
          setEditingStreet(null);
        },
      },
    );
  };

  const handleDeleteStreet = (id: string) => {
    deleteStreet.mutate(id, {
      onSuccess: () => {
        if (selectedStreet?.id === id) setSelectedStreet(null);
      },
    });
  };

  // Building CRUD
  type BuildingFormData = {
    number: string; name?: string; iban?: string; oib?: string; representative?: string; representativePhone?: string;
    cleaningFee?: number; loanFee?: number; reservePerSqm?: number; savingsFixed?: number; extraFixed?: number;
    electricityFixed?: number; savingsPerSqm?: number;
  };
  const handleAddBuilding = (data: BuildingFormData) => {
    if (!selectedCity || !selectedStreet) return;
    createBuilding.mutate(
      {
        streetId: selectedStreet.id,
        data,
      },
      {
        onSuccess: () => setBuildingDialogOpen(false),
      },
    );
  };

  const handleEditBuilding = (data: BuildingFormData) => {
    if (!editingBuilding) return;
    updateBuilding.mutate(
      {
        id: editingBuilding.id,
        data,
      },
      {
        onSuccess: () => {
          setBuildingDialogOpen(false);
          setEditingBuilding(null);
        },
      },
    );
  };

  const handleDeleteBuilding = (id: string) => {
    deleteBuilding.mutate(id, {
      onSuccess: () => {
        if (selectedBuilding?.id === id) setSelectedBuilding(null);
      },
    });
  };

  // Apartment CRUD
  const handleApartmentSave = (payload: ApartmentFormPayload) => {
    if (payload.mode === "add") {
      if (!displayBuilding) return;
      createApartment.mutate(
        {
          buildingId: displayBuilding.id,
          data: {
            apartment_number: payload.number,
            floor: 0,
            size_m2: payload.area,
            rooms: null,
            owner: payload.tenantId ? null : (payload.ownerName ?? null),
            tenant: null,
            contact: null,
            email: payload.tenantId ? null : (payload.email ?? null),
            phone: payload.tenantId ? null : (payload.phone ?? null),
            notes: payload.notes ?? null,
          },
        },
        {
          onSuccess: async (created) => {
            const aptId = created?.id ?? (created as any)?.id;
            if (!aptId) {
              await queryClient.refetchQueries({ queryKey: ["cities"] });
              setApartmentDialogOpen(false);
              return;
            }

            if (payload.personId) {
              try {
                const person = await personsApi.getById(payload.personId);
                await tenantsApi.create({
                  apartment_id: String(aptId),
                  name: person.name ?? "",
                  email: person.email ?? undefined,
                  phone: person.phone ?? undefined,
                  person_id: payload.personId,
                });
                await buildingsApi.updateApartment(aptId, {
                  owner: person.name ?? null,
                  email: person.email ?? null,
                  phone: person.phone ?? null,
                });
              } catch (err) {
                toast({
                  title: "Greška pri povezivanju suvlasnika",
                  description: (err as Error)?.message ?? "Apartman je kreiran, suvlasnika možete dodijeliti ručno.",
                  variant: "destructive",
                });
              }
            } else if (payload.ownerName) {
              try {
                let userId: string | null = null;
                if (payload.email) {
                  const userRes = await usersApi.createStanar({
                    email: payload.email,
                    full_name: payload.ownerName,
                  });
                  userId = userRes.id;
                  if (userRes.tempPassword && !userRes.existing) {
                    setTempPasswordModal({
                      open: true,
                      email: payload.email!,
                      tempPassword: userRes.tempPassword,
                    });
                  }
                }
                await tenantsApi.create({
                  apartment_id: String(aptId),
                  name: payload.ownerName,
                  email: payload.email,
                  phone: payload.phone,
                  user_id: userId ?? undefined,
                });
                await buildingsApi.updateApartment(aptId, {
                  owner: payload.ownerName,
                  email: payload.email ?? null,
                  phone: payload.phone ?? null,
                });
              } catch (err) {
                toast({
                  title: "Greška pri kreiranju suvlasnika",
                  description: (err as Error)?.message ?? "Apartman je kreiran, suvlasnika možete dodati ručno.",
                  variant: "destructive",
                });
              }
            }

            await queryClient.refetchQueries({ queryKey: ["cities"] });
            await queryClient.refetchQueries({ queryKey: ["tenants"] });
            await queryClient.refetchQueries({ queryKey: ["persons"] });
            setApartmentDialogOpen(false);
          },
        },
      );
    } else {
      if (!editingApartment) return;
      const prevTenantId = (editingApartment as Apartment & { tenant_id?: string }).tenant_id;

      const runUpdates = async () => {
        const newPersonId = payload.personId || null;
        let ownerName: string | null = null;
        let tenantEmail: string | null = null;
        let tenantPhone: string | null = null;
        if (newPersonId) {
          const person = await personsApi.getById(newPersonId);
          ownerName = person?.name ?? null;
          tenantEmail = person?.email ?? null;
          tenantPhone = person?.phone ?? null;
        }

        await updateApartment.mutateAsync({
          id: editingApartment.id,
          data: {
            apartment_number: payload.number,
            floor: 0,
            size_m2: payload.area,
            rooms: null,
            owner: ownerName,
            tenant: null,
            contact: null,
            email: tenantEmail,
            phone: tenantPhone,
            notes: payload.notes ?? null,
          },
        });

        if (prevTenantId) {
          await tenantsApi.update(prevTenantId, { apartment_id: null });
        }
        if (newPersonId) {
          const person = await personsApi.getById(newPersonId);
          await tenantsApi.create({
            apartment_id: editingApartment.id,
            name: person.name ?? "",
            email: person.email ?? undefined,
            phone: person.phone ?? undefined,
            person_id: newPersonId,
          });
        }

        await queryClient.refetchQueries({ queryKey: ["cities"] });
        await queryClient.refetchQueries({ queryKey: ["tenants"] });
        setApartmentDialogOpen(false);
        setEditingApartment(null);
        if (selectedApartment?.id === editingApartment.id) {
          setSelectedApartment({
            ...selectedApartment,
            number: payload.number,
            area: payload.area,
            notes: payload.notes,
          });
        }
      };

      runUpdates().catch((err) => {
        toast({
          title: "Greška pri spremanju",
          description: (err as Error)?.message ?? "Nije moguće spremiti promjene.",
          variant: "destructive",
        });
      });
    }
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

  const openTreeSidebar = () => {
    setSidebarCollapsed(false);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setNavDrawerOpen(true);
    }
  };

  const handleSelectCity = (city: any) => {
    setSelectedCity(city);
    setSelectedStreet(null);
    setSelectedBuilding(null);
    openTreeSidebar();
  };

  const handleSelectStreet = (street: any) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
    openTreeSidebar();
  };

  // Koristi svježe podatke iz cachea – selectedCity/selectedStreet su reference na stare objekte
  const displayCity = selectedCity && cities
    ? cities.find((c) => String(c.id) === String(selectedCity.id)) ?? selectedCity
    : selectedCity;
  const displayStreet = selectedStreet && displayCity?.streets
    ? displayCity.streets.find((s) => String(s.id) === String(selectedStreet.id)) ?? selectedStreet
    : selectedStreet;
  const displayBuilding = selectedBuilding && displayStreet?.buildings
    ? displayStreet.buildings.find((b) => String(b.id) === String(selectedBuilding.id)) ?? selectedBuilding
    : selectedBuilding;
  const displayApartment = selectedApartment && displayBuilding?.apartments
    ? displayBuilding.apartments.find((a) => String(a.id) === String(selectedApartment.id)) ?? selectedApartment
    : selectedApartment;

  const handleSelectBuilding = (building: any) => {
    let foundCity: City | null = null;
    let foundStreet: Street | null = null;

    if (cities) {
      for (const city of cities) {
        for (const street of city.streets) {
          if (street.buildings.some((b) => b.id === building.id)) {
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
    openTreeSidebar();
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
        <div className="max-w-6xl mx-auto px-4 md:px-5 py-4 md:py-5 space-y-4">
          {/* Header kad nije odabran ulaz */}
          {!selectedBuilding && (
            <div className="flex items-start justify-between gap-3">
              {/* Mobile navigation button */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden min-w-[40px] min-h-[40px] mt-1"
                onClick={() => setNavDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex-1 min-w-0">
                {/* Breadcrumb */}
                <p className="text-xs text-muted-foreground mb-1">
                  {!selectedCity && "Gradovi"}
                  {selectedCity && !selectedStreet && `Gradovi / ${selectedCity.name}`}
                  {selectedStreet &&
                    !selectedBuilding &&
                    `Gradovi / ${selectedCity?.name} / ${selectedStreet.name}`}
                </p>

                <h1 className="truncate">
                  {!selectedCity && "Struktura zgrada"}
                  {selectedCity && !selectedStreet && selectedCity.name}
                  {selectedStreet && !selectedBuilding && selectedStreet.name}
                </h1>

                <p className="text-muted-foreground mt-1 text-sm">
                  {!selectedCity && "Odaberite grad iz stabla lijevo ili dodajte novi."}
                  {selectedCity &&
                    !selectedStreet &&
                    "Odaberite ulicu u gradu ili dodajte novu ulicu."}
                  {selectedStreet &&
                    !selectedBuilding &&
                    "Odaberite ulaz za pregled stanova i financija."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                {!selectedCity && cities && cities.length > 0 && (
                  <Button className="min-h-[28px]" onClick={() => setCityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj grad
                  </Button>
                )}
                {selectedCity && !selectedStreet && (displayCity?.streets?.length ?? 0) > 0 && (
                  <Button
                    className="min-h-[28px]"
                    onClick={() => setStreetDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj ulicu
                  </Button>
                )}
                {selectedStreet && !selectedBuilding && (displayStreet?.buildings?.length ?? 0) > 0 && (
                  <Button
                    className="min-h-[28px]"
                    onClick={() => setBuildingDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj ulaz
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Overview Cards - All Cities */}
          {!selectedCity &&
            cities &&
            (cities.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Dodajte svoj prvi grad"
                description="Započnite tako da dodate grad. Nakon toga dodajte ulicu, ulaz i stanove. Svi koraci su jednostavni."
                action={{
                  label: "Dodaj prvi grad",
                  onClick: () => setCityDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {cities.map((city) => (
                    <Card
                      key={city.id}
                      className="p-3 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 transition-colors"
                      onClick={() => handleSelectCity(city)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="rounded-md p-1.5 bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{city.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {city.streets.length} ulica •{" "}
                              {formatNumber(city.totalApartments)} stanova
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setEditingCity({ id: city.id, name: city.name });
                              setCityDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "city",
                                id: city.id,
                                name: city.name,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Dugovanja</span>
                        <span className="font-semibold text-destructive">
                          {formatCurrency(city.totalDebt)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

          {/* Streets Grid */}
          {selectedCity &&
            !selectedStreet &&
            !selectedBuilding &&
            (displayCity && (displayCity.streets?.length ?? 0) === 0 ? (
              <EmptyState
                title="Nema ulica"
                description={`Dodajte prvu ulicu u grad ${selectedCity.name}.`}
                action={{
                  label: "Dodaj prvu ulicu",
                  onClick: () => setStreetDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(displayCity?.streets ?? []).map((street) => (
                    <Card
                      key={street.id}
                      className="p-3 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 transition-colors"
                      onClick={() => handleSelectStreet(street)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{street.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {street.buildings.length} ulaz/a
                          </p>
                        </div>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setEditingStreet({ id: street.id, name: street.name });
                              setStreetDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "street",
                                id: street.id,
                                name: street.name,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

          {/* Buildings Grid */}
          {selectedStreet &&
            !selectedBuilding &&
            (displayStreet && (displayStreet.buildings?.length ?? 0) === 0 ? (
              <EmptyState
                title="Nema zgrada"
                description={`Dodajte prvi ulaz u ulicu ${selectedStreet.name}.`}
                action={{
                  label: "Dodaj prvi ulaz",
                  onClick: () => setBuildingDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(displayStreet?.buildings ?? []).map((building) => (
                    <Card
                      key={building.id}
                      className="p-3 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 transition-colors"
                      onClick={() => handleSelectBuilding(building)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="rounded-md p-1.5 bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              Ulaz {building.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {building.apartments.length} stanova
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setEditingBuilding(building);
                              setBuildingDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="min-w-[28px] min-h-[28px] hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "building",
                                id: building.id,
                                name: building.name,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-0.5 text-xs mt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pričuva</span>
                          <span className="font-medium">
                            {formatCurrency(building.reserve)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Dugovanja</span>
                          <span
                            className={
                              building.debt > 0
                                ? "text-destructive font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {formatCurrency(building.debt)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

          {/* Building Detail View */}
          {displayBuilding && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {selectedCity?.name} / {selectedStreet?.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg p-3 bg-primary/10 shrink-0">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Ulaz {displayBuilding.name}</CardTitle>
                          <CardDescription>
                            {displayBuilding.apartments.length} stanova • Dug:{" "}
                            {formatCurrency(displayBuilding.debt)}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[28px] gap-2"
                        onClick={() => {
                          setEditingBuilding(displayBuilding);
                          setBuildingDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                        Uredi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[28px] gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "building",
                            id: displayBuilding.id,
                            name: displayBuilding.name,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        Obriši
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* KPI tiles – kompaktni */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Broj stanova</p>
                      <p className="text-xl font-semibold mt-1">
                        {displayBuilding.apartments.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Pričuva</p>
                      <p className="text-xl font-semibold mt-1 text-success">
                        {formatCurrency(displayBuilding.reserve)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Dugovanja</p>
                      <p className="text-xl font-semibold mt-1 text-destructive">
                        {formatCurrency(displayBuilding.debt)}
                      </p>
                    </div>
                  </div>

                  {/* Podaci zgrade – dvostupčano */}
                  <div className="mt-5 pt-5 border-t">
                    <h3 className="text-sm font-semibold mb-3">Podaci zgrade</h3>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">IBAN</span>
                        <span className="font-mono text-xs sm:text-sm">
                          {displayBuilding.iban || (
                            <span className="text-muted-foreground italic">
                              Nije uneseno
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">OIB</span>
                        <span className="font-mono text-xs sm:text-sm">
                          {displayBuilding.oib || (
                            <span className="text-muted-foreground italic">
                              Nije uneseno
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">
                          Predstavnik
                        </span>
                        <span className="text-sm">
                          {displayBuilding.representative || (
                            <span className="text-muted-foreground italic">
                              Nije dodijeljen
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">
                          Telefon predstavnika
                        </span>
                        <span className="font-mono text-xs sm:text-sm">
                          {displayBuilding.representativePhone || (
                            <span className="text-muted-foreground italic">
                              Nije uneseno
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {displayBuilding.fees && (
                    <div className="mt-5 pt-5 border-t">
                      <h3 className="text-sm font-semibold mb-3">Naknade</h3>
                      <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div className="rounded-lg border border-border bg-card p-3">
                          <p className="text-xs text-muted-foreground">
                            Čišćenje (mj.)
                          </p>
                          <p className="text-xl font-semibold mt-1">
                            {formatCurrency(displayBuilding.fees.cleaning)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Kredit (mj.)</p>
                          <p className="text-xl font-semibold mt-1">
                            {formatCurrency(displayBuilding.fees.loan)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-3">
                          <p className="text-xs text-muted-foreground">
                            Pričuva po m²
                          </p>
                          <p className="text-xl font-semibold mt-1">
                            {formatCurrency(
                              displayBuilding.fees.reservePerSqm,
                            )}{" "}
                            / m²
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div>
                      <CardTitle className="text-base">Stanovi</CardTitle>
                      <CardDescription>Popis stanova u ulazu.</CardDescription>
                    </div>
                    {displayBuilding.apartments.length > 0 && (
                    <div className="flex justify-end w-full sm:w-auto shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 min-h-[28px]"
                        onClick={() => setApartmentDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Dodaj stan
                      </Button>
                    </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {displayBuilding.apartments.length === 0 ? (
                    <EmptyState
                      title="Nema dodanih stanova"
                      description="Dodajte prvi stan da biste započeli evidenciju."
                      action={{
                        label: "Dodaj stan",
                        onClick: () => setApartmentDialogOpen(true),
                      }}
                    />
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden md:block rounded-md border max-w-3xl">
                        <table className="data-table table-density-normal">
                          <thead>
                            <tr>
                              <th>Stan</th>
                              <th>Vlasnik</th>
                              <th className="text-right">Dug</th>
                              <th className="w-8 text-right"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayBuilding.apartments.map((apartment) => (
                              <tr
                                key={apartment.id}
                                className="group cursor-pointer hover:bg-muted/30"
                                onClick={() => {
                                  setSelectedApartment(apartment);
                                  setApartmentDetailOpen(true);
                                }}
                              >
                                <td className="font-medium">
                                  Stan {apartment.number}
                                </td>
                                <td className="text-sm text-muted-foreground">
                                  {apartment.owner || "-"}
                                </td>
                                <td
                                  className={`text-right text-sm font-semibold ${
                                    apartment.debt > 0
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatCurrency(apartment.debt)}
                                </td>
                                <td className="text-right text-muted-foreground">
                                  <ChevronRight className="inline h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3 mt-3">
                        {displayBuilding.apartments.map((apartment) => (
                          <Card
                            key={apartment.id}
                            className="p-4 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 transition-colors"
                            onClick={() => {
                              setSelectedApartment(apartment);
                              setApartmentDetailOpen(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-semibold">
                                  Stan {apartment.number}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {apartment.area} m²
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              {apartment.owner && (
                                <p className="text-muted-foreground truncate">
                                  <span className="font-medium">Vlasnik:</span>{" "}
                                  {apartment.owner}
                                </p>
                              )}
                              {apartment.tenant &&
                                apartment.tenant !== apartment.owner && (
                                  <p className="text-muted-foreground truncate">
                                    <span className="font-medium">Stanar:</span>{" "}
                                    {apartment.tenant}
                                  </p>
                                )}
                              <div className="flex justify-between pt-2">
                                <span
                                  className={
                                    apartment.debt > 0
                                      ? "text-destructive font-medium"
                                      : "text-muted-foreground"
                                  }
                                >
                                  Dug: {formatCurrency(apartment.debt)}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
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
            isPending={createCity.isPending || updateCity.isPending}
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
            isPending={createStreet.isPending || updateStreet.isPending}
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
            isPending={createBuilding.isPending || updateBuilding.isPending}
          />

          <ApartmentDialog
            open={apartmentDialogOpen}
            onOpenChange={(open) => {
              setApartmentDialogOpen(open);
              if (!open) {
                if (editingApartment) {
                  setApartmentDetailOpen(true);
                }
                setEditingApartment(null);
              }
            }}
            onSave={handleApartmentSave}
            editApartment={editingApartment}
            buildingName={displayBuilding?.name || ""}
            fees={displayBuilding?.fees}
            isPending={createApartment.isPending || updateApartment.isPending}
          />

          <TempPasswordModal
            open={tempPasswordModal.open}
            onOpenChange={(open) => setTempPasswordModal((p) => ({ ...p, open }))}
            email={tempPasswordModal.email}
            tempPassword={tempPasswordModal.tempPassword}
          />

          <ApartmentDetailDialog
            apartment={displayApartment}
            open={apartmentDetailOpen}
            onOpenChange={setApartmentDetailOpen}
            onEdit={(apartment) => {
              setEditingApartment(apartment);
              setApartmentDialogOpen(true);
              setApartmentDetailOpen(false);
            }}
            onDelete={(id, number) => {
              setDeleteDialog({
                open: true,
                type: "apartment",
                id,
                name: number,
              });
              setApartmentDetailOpen(false);
            }}
            buildingName={displayBuilding?.name || ""}
            streetName={selectedStreet?.name || ""}
            cityName={selectedCity?.name || ""}
            fees={displayBuilding?.fees}
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
          <AlertDialog
            open={deleteDialog?.open || false}
            onOpenChange={(open) => !open && setDeleteDialog(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija je nepovratna.{" "}
                  {deleteDialog?.type === "city" &&
                    "Brisat će se i sve ulice i ulazi u gradu."}
                  {deleteDialog?.type === "street" &&
                    "Brisat će se i svi ulazi na ulici."}
                  {deleteDialog?.type === "building" &&
                    "Brisat će se i svi stanovi u ulazu."}
                  {deleteDialog?.type === "apartment" &&
                    "Stan će biti trajno obrisan."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Odustani</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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