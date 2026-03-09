import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Home,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  User,
  Menu,
  Loader2,
  ChevronRight,
  Search,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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
import { tenantsApi, usersApi, personsApi } from "@/lib/api";
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
  floor?: string | null;
  area: number;
  owner?: string;
  ownerOib?: string | null;
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

interface BuildingFees {
  cleaning: number;
  loan: number;
  reservePerSqm: number;
  savingsFixed?: number;
  extraFixed?: number;
  electricityFixed?: number;
  savingsPerSqm?: number;
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
  fees?: BuildingFees;
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

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [cardSearch, setCardSearch] = useState("");

  // Sinkronizacija URL ↔ odabir (da osvježavanje zadrži grad/ulicu/zgradu)
  const cityIdFromUrl = searchParams.get("city");
  const streetIdFromUrl = searchParams.get("street");
  const buildingIdFromUrl = searchParams.get("building");

  useEffect(() => {
    if (!cities?.length) return;
    const cityId = cityIdFromUrl;
    const streetId = streetIdFromUrl;
    const buildingId = buildingIdFromUrl;
    if (!cityId) {
      setSelectedCity(null);
      setSelectedStreet(null);
      setSelectedBuilding(null);
      return;
    }
    const city = cities.find((c) => String(c.id) === String(cityId));
    if (!city) return;
    setSelectedCity(city);
    if (!streetId) {
      setSelectedStreet(null);
      setSelectedBuilding(null);
      return;
    }
    const street = city.streets?.find((s: Street) => String(s.id) === String(streetId));
    if (!street) {
      setSelectedStreet(null);
      setSelectedBuilding(null);
      return;
    }
    setSelectedStreet(street);
    if (!buildingId) {
      setSelectedBuilding(null);
      return;
    }
    const building = street.buildings?.find((b: Building) => String(b.id) === String(buildingId));
    if (building) setSelectedBuilding(building);
    else setSelectedBuilding(null);
    // Jednokratno iz URL-a; dalje se vodi kroz setSelected* + update URL u handlerima
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, cityIdFromUrl, streetIdFromUrl, buildingIdFromUrl]);

  const updateUrlFromSelection = (city: City | null, street: Street | null, building: Building | null) => {
    const next = new URLSearchParams(searchParams);
    if (!city) {
      next.delete("city");
      next.delete("street");
      next.delete("building");
    } else {
      next.set("city", city.id);
      if (!street) {
        next.delete("street");
        next.delete("building");
      } else {
        next.set("street", street.id);
        if (!building) next.delete("building");
        else next.set("building", building.id);
      }
    }
    setSearchParams(next, { replace: true });
  };

  // Reset search kad se mijenja razina (grad → ulica → ulaz)
  useEffect(() => {
    setCardSearch("");
  }, [selectedCity?.id, selectedStreet?.id]);

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
        if (selectedCity?.id === id) {
          setSelectedCity(null);
          setSelectedStreet(null);
          setSelectedBuilding(null);
          updateUrlFromSelection(null, null, null);
        }
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
        if (selectedStreet?.id === id) {
          setSelectedStreet(null);
          setSelectedBuilding(null);
          updateUrlFromSelection(selectedCity ?? null, null, null);
        }
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
        if (selectedBuilding?.id === id) {
          setSelectedBuilding(null);
          updateUrlFromSelection(selectedCity ?? null, selectedStreet ?? null, null);
        }
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
            number: payload.number,
            floor: payload.floor ?? null,
            area_m2: payload.area,
            notes: payload.notes ?? null,
          },
        },
        {
          onSuccess: async (created: unknown) => {
            const aptId = (created as { id?: string } | null)?.id;
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
                  oib: payload.ownerOib ?? undefined,
                  email: payload.email,
                  phone: payload.phone,
                  user_id: userId ?? undefined,
                  delivery_method: payload.delivery_method ?? undefined,
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
      const editPayload = payload as { personId?: string; ownerMode?: "existing" | "new"; ownerName?: string; ownerOib?: string; email?: string; phone?: string; delivery_method?: "email" | "pošta" | "both" };

      const runUpdates = async () => {
        await updateApartment.mutateAsync({
          id: editingApartment.id,
          data: {
            number: payload.number,
            floor: payload.floor ?? null,
            area_m2: payload.area,
            notes: payload.notes ?? null,
          },
        });

        if (prevTenantId) {
          await tenantsApi.update(prevTenantId, { apartment_id: null });
        }

        const newPersonId = editPayload.personId || null;
        const isNewOwner = editPayload.ownerMode === "new" && editPayload.ownerName;

        if (newPersonId && !isNewOwner) {
          const person = await personsApi.getById(newPersonId);
          await tenantsApi.create({
            apartment_id: editingApartment.id,
            name: person.name ?? "",
            email: person.email ?? undefined,
            phone: person.phone ?? undefined,
            person_id: newPersonId,
          });
        } else if (isNewOwner && editPayload.ownerName) {
          let userId: string | null = null;
          if (editPayload.email) {
            const userRes = await usersApi.createStanar({
              email: editPayload.email,
              full_name: editPayload.ownerName,
            });
            userId = userRes.id;
            if (userRes.tempPassword && !userRes.existing) {
              setTempPasswordModal({
                open: true,
                email: editPayload.email,
                tempPassword: userRes.tempPassword,
              });
            }
          }
          await tenantsApi.create({
            apartment_id: editingApartment.id,
            name: editPayload.ownerName,
            oib: editPayload.ownerOib ?? undefined,
            email: editPayload.email ?? undefined,
            phone: editPayload.phone ?? undefined,
            user_id: userId ?? undefined,
            delivery_method: editPayload.delivery_method ?? undefined,
          });
        }

        await queryClient.refetchQueries({ queryKey: ["cities"] });
        await queryClient.refetchQueries({ queryKey: ["tenants"] });
        await queryClient.refetchQueries({ queryKey: ["persons"] });
        setApartmentDialogOpen(false);
        setEditingApartment(null);
        if (selectedApartment?.id === editingApartment.id) {
          setSelectedApartment({
            ...selectedApartment,
            number: payload.number,
            area: payload.area,
            notes: payload.notes,
            floor: payload.floor ?? undefined,
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
    updateUrlFromSelection(city, null, null);
    openTreeSidebar();
  };

  const handleSelectStreet = (street: any) => {
    setSelectedStreet(street);
    setSelectedBuilding(null);
    updateUrlFromSelection(selectedCity ?? null, street, null);
    openTreeSidebar();
  };

  // Koristi svježe podatke iz cachea – selectedCity/selectedStreet su reference na stare objekte
  const displayCity = selectedCity && cities
    ? cities.find((c) => String(c.id) === String(selectedCity.id)) ?? selectedCity
    : selectedCity;
  const displayStreet = selectedStreet && displayCity?.streets
    ? displayCity.streets.find((s: Street) => String(s.id) === String(selectedStreet.id)) ?? selectedStreet
    : selectedStreet;
  const displayBuilding = selectedBuilding && displayStreet?.buildings
    ? displayStreet.buildings.find((b: Building) => String(b.id) === String(selectedBuilding.id)) ?? selectedBuilding
    : selectedBuilding;
  const displayApartment = selectedApartment && displayBuilding?.apartments
    ? displayBuilding.apartments.find((a: Apartment) => String(a.id) === String(selectedApartment.id)) ?? selectedApartment
    : selectedApartment;

  const buildingToLocation = useMemo(() => {
    const map = new Map<string, { city: City; street: Street }>();
    if (!cities) return map;
    for (const city of cities) {
      for (const street of city.streets) {
        for (const b of street.buildings) {
          map.set(String(b.id), { city, street });
        }
      }
    }
    return map;
  }, [cities]);

  const handleSelectBuilding = (building: any) => {
    const location = buildingToLocation.get(String(building.id));
    const city = location?.city ?? null;
    const street = location?.street ?? null;
    setSelectedCity(city);
    setSelectedStreet(street);
    setSelectedBuilding(building);
    updateUrlFromSelection(city, street, building);
    openTreeSidebar();
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
        <div className="hidden lg:block w-64 border-r bg-muted/20 p-3">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-5 max-w-6xl mx-auto w-full space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
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
        <div className="max-w-6xl mx-auto px-4 md:px-5 py-4 md:py-5 space-y-4 transition-opacity duration-200">
          {/* Header kad nije odabran ulaz */}
          {!selectedBuilding && (
            <header className="page-hero flex items-start justify-between gap-3">
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
                <p className="text-xs text-muted-foreground mb-2 flex flex-wrap items-center gap-1">
                  {!selectedCity ? (
                    "Gradovi"
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCity(null);
                          setSelectedStreet(null);
                          setSelectedBuilding(null);
                          setSelectedApartment(null);
                          setApartmentDetailOpen(false);
                          updateUrlFromSelection(null, null, null);
                        }}
                        className="underline underline-offset-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        Gradovi
                      </button>
                      {!selectedStreet && ` / ${selectedCity.name}`}
                      {selectedStreet && !selectedBuilding && ` / ${selectedCity?.name} / ${selectedStreet.name}`}
                      {selectedBuilding &&
                        ` / ${selectedCity?.name} / ${selectedStreet?.name} / Ulaz ${displayBuilding?.name}`}
                    </>
                  )}
                </p>

                <h1 className="page-title truncate">
                  {!selectedCity && "Struktura zgrada"}
                  {selectedCity && !selectedStreet && selectedCity.name}
                  {selectedStreet && !selectedBuilding && selectedStreet.name}
                </h1>
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
            </header>
          )}

          {/* Overview Cards - All Cities */}
          {!selectedCity &&
            cities &&
            (cities.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Nema gradova"
                action={{
                  label: "Dodaj prvi grad",
                  onClick: () => setCityDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pretraži gradove..."
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                    className="pl-9 max-w-sm transition-colors duration-150 focus-visible:ring-2"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {cities
                    .filter((city) =>
                      !cardSearch.trim()
                        ? true
                        : city.name.toLowerCase().includes(cardSearch.trim().toLowerCase())
                    )
                    .map((city, idx) => (
                    <Card
                      key={city.id}
                      role="button"
                      tabIndex={0}
                      className="p-4 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 hover:shadow-md transition-all duration-200 ease-out animate-fade-in-up rounded-md"
                      style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                      onClick={() => handleSelectCity(city)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectCity(city);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="font-semibold text-base truncate">{city.name}</p>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {city.streets.length} ulica •{" "}
                              {formatNumber(city.totalApartments)} stanova
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="min-w-[28px] min-h-[28px] hover:bg-muted"
                              aria-label="Opcije grada"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCity({ id: city.id, name: city.name });
                                setCityDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Uredi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "city",
                                  id: city.id,
                                  name: city.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                icon={MapPin}
                title="Nema ulica"
                action={{
                  label: "Dodaj prvu ulicu",
                  onClick: () => setStreetDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pretraži ulice..."
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                    className="pl-9 max-w-sm transition-colors duration-150 focus-visible:ring-2"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(displayCity?.streets ?? [])
                    .filter((street: Street) =>
                      !cardSearch.trim()
                        ? true
                        : street.name.toLowerCase().includes(cardSearch.trim().toLowerCase())
                    )
                    .map((street: Street, idx: number) => (
                    <Card
                      key={street.id}
                      role="button"
                      tabIndex={0}
                      className="p-3 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 hover:shadow-md transition-all duration-200 ease-out animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                      onClick={() => handleSelectStreet(street)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectStreet(street);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{street.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {street.buildings.length} ulaz/a
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="min-w-[28px] min-h-[28px] hover:bg-muted"
                              aria-label="Opcije ulice"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingStreet({ id: street.id, name: street.name });
                                setStreetDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Uredi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "street",
                                  id: street.id,
                                  name: street.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                icon={Building2}
                title="Nema ulaza"
                action={{
                  label: "Dodaj prvi ulaz",
                  onClick: () => setBuildingDialogOpen(true),
                }}
              />
            ) : (
              <div className="max-w-4xl space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pretraži ulaze..."
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                    className="pl-9 max-w-sm transition-colors duration-150 focus-visible:ring-2"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(displayStreet?.buildings ?? [])
                    .filter((building: Building) =>
                      !cardSearch.trim()
                        ? true
                        : building.name.toLowerCase().includes(cardSearch.trim().toLowerCase())
                    )
                    .map((building: Building, idx: number) => (
                    <Card
                      key={building.id}
                      role="button"
                      tabIndex={0}
                      className="p-3 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 hover:shadow-md transition-all duration-200 ease-out animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                      onClick={() => handleSelectBuilding(building)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectBuilding(building);
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              Ulaz {building.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {building.apartments.length} stanova
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="min-w-[28px] min-h-[28px] hover:bg-muted"
                              aria-label="Opcije ulaza"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBuilding(building);
                                setBuildingDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Uredi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "building",
                                  id: building.id,
                                  name: building.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <Card className="rounded-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        {selectedCity?.name} / {selectedStreet?.name}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="rounded-md p-3.5 bg-primary/10 shrink-0">
                          <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Ulaz {displayBuilding.name}</CardTitle>
                          <CardDescription className="mt-0.5 text-sm">
                            {displayBuilding.apartments.length} stanova · Dug:{" "}
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
                  {/* KPI pločice */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Broj stanova</p>
                      <p className="text-2xl font-semibold mt-1.5 tabular-nums">
                        {displayBuilding.apartments.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Pričuva</p>
                      <p className="text-2xl font-semibold mt-1.5 text-success tabular-nums">
                        {formatCurrency(displayBuilding.reserve)}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Dugovanja</p>
                      <p className="text-2xl font-semibold mt-1.5 text-destructive tabular-nums">
                        {formatCurrency(displayBuilding.debt)}
                      </p>
                    </div>
                  </div>

                  {/* Podaci zgrade (lijevo) | Naknade (desno) – ušteda visine */}
                  <div className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-semibold mb-4">Podaci zgrade</h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">IBAN</span>
                          <span className="font-mono text-xs sm:text-sm">
                            {displayBuilding.iban || (
                              <span className="text-muted-foreground italic">Nije uneseno</span>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">OIB</span>
                          <span className="font-mono text-xs sm:text-sm">
                            {displayBuilding.oib || (
                              <span className="text-muted-foreground italic">Nije uneseno</span>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">Predstavnik</span>
                          <span className="text-sm">
                            {displayBuilding.representative || (
                              <span className="text-muted-foreground italic">Nije dodijeljen</span>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">Telefon predstavnika</span>
                          <span className="font-mono text-xs sm:text-sm">
                            {displayBuilding.representativePhone || (
                              <span className="text-muted-foreground italic">Nije uneseno</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {displayBuilding.fees && (() => {
                        const f = displayBuilding.fees;
                        const items = [
                          { label: "Čišćenje (mj.)", val: f.cleaning, fmt: () => formatCurrency(f.cleaning) },
                          { label: "Kredit (mj.)", val: f.loan, fmt: () => formatCurrency(f.loan) },
                          { label: "Pričuva po m²", val: f.reservePerSqm, fmt: () => `${formatCurrency(f.reservePerSqm)} / m²` },
                          { label: "Štednja (fiksno)", val: f.savingsFixed, fmt: () => formatCurrency(f.savingsFixed) },
                          { label: "Izvanredni", val: f.extraFixed, fmt: () => formatCurrency(f.extraFixed) },
                          { label: "Struja", val: f.electricityFixed, fmt: () => formatCurrency(f.electricityFixed) },
                          { label: "Štednja (€/m²)", val: f.savingsPerSqm, fmt: () => `${formatCurrency(f.savingsPerSqm)} / m²` },
                        ].filter((x) => (x.val ?? 0) !== 0);
                        return (
                          <>
                            <h3 className="text-base font-semibold mb-4">Naknade</h3>
                            {items.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Nema definiranih naknada.</p>
                            ) : (
                              <div className="space-y-0.5 text-sm">
                                {items.map(({ label, fmt }) => (
                                  <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                                    <span className="text-muted-foreground truncate">{label}</span>
                                    <span className="shrink-0 tabular-nums font-medium">{fmt()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {!displayBuilding.fees && (
                        <>
                          <h3 className="text-base font-semibold mb-4">Naknade</h3>
                          <p className="text-sm text-muted-foreground">Nema definiranih naknada.</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div>
                      <CardTitle className="text-lg">Stanovi</CardTitle>
                    </div>
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
                  </div>
                </CardHeader>
                <CardContent>
                  {displayBuilding.apartments.length === 0 ? (
                    <EmptyState
                      icon={Home}
                      title="Nema stanova"
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
                              <th className="text-right min-w-[90px]">Dug</th>
                              <th className="w-8 text-right"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayBuilding.apartments.map((apartment: Apartment) => (
                              <tr
                                key={apartment.id}
                                role="button"
                                tabIndex={0}
                                className="group cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                                onClick={() => {
                                  setSelectedApartment(apartment);
                                  setApartmentDetailOpen(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedApartment(apartment);
                                    setApartmentDetailOpen(true);
                                  }
                                }}
                              >
                                <td className="font-medium">
                                  Stan {apartment.number}
                                </td>
                                <td className="text-sm text-muted-foreground">
                                  {apartment.owner ? (
                                    <>
                                      {apartment.owner}
                                      {apartment.ownerOib && (
                                        <span className="block font-mono text-xs mt-0.5">{apartment.ownerOib}</span>
                                      )}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td
                                  className={`text-right value-cell min-w-[90px] ${
                                    apartment.debt > 0 ? "value-cell--negative" : "text-muted-foreground"
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
                        {displayBuilding.apartments.map((apartment: Apartment, idx: number) => (
                          <Card
                            key={apartment.id}
                            role="button"
                            tabIndex={0}
                            className="p-4 cursor-pointer border border-border hover:border-primary/40 hover:bg-accent/10 hover:shadow-sm transition-all duration-200 ease-out animate-fade-in-up"
                            style={{ animationDelay: `${Math.min(idx * 35, 180)}ms` }}
                            onClick={() => {
                              setSelectedApartment(apartment);
                              setApartmentDetailOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedApartment(apartment);
                                setApartmentDetailOpen(true);
                              }
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
                                  {apartment.ownerOib && (
                                    <span className="block font-mono text-xs mt-0.5">OIB: {apartment.ownerOib}</span>
                                  )}
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
                                      ? "value-cell value-cell--negative"
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
            onOwnerChangeSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["cities"] });
              queryClient.invalidateQueries({ queryKey: ["persons"] });
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