import { MapPin, ChevronRight, ChevronDown, Building2, PanelLeftClose, PanelLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
}

interface Building {
  id: string;
  name: string;
  apartments: Apartment[];
  debt: number;
  reserve: number;
  iban?: string;
  oib?: string;
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

interface BuildingsTreeSidebarProps {
  cities: City[];
  selectedCity: City | null;
  selectedStreet: Street | null;
  selectedBuilding: Building | null;
  onSelectCity: (city: City) => void;
  onSelectStreet: (street: Street) => void;
  onSelectBuilding: (building: Building) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const BuildingsTreeSidebar = ({
  cities,
  selectedCity,
  selectedStreet,
  selectedBuilding,
  onSelectCity,
  onSelectStreet,
  onSelectBuilding,
  collapsed,
  onToggleCollapse,
}: BuildingsTreeSidebarProps) => {
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedStreets, setExpandedStreets] = useState<Set<string>>(new Set());

  // Proširi tree kad se odabere s popisa (ne iz stabla)
  useEffect(() => {
    if (selectedCity) {
      setExpandedCities((prev) => new Set([...prev, selectedCity.id]));
    }
    if (selectedStreet) {
      setExpandedStreets((prev) => new Set([...prev, selectedStreet.id]));
    }
  }, [selectedCity?.id, selectedStreet?.id]);

  const toggleCity = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  const toggleStreet = (streetId: string) => {
    const newExpanded = new Set(expandedStreets);
    if (newExpanded.has(streetId)) {
      newExpanded.delete(streetId);
    } else {
      newExpanded.add(streetId);
    }
    setExpandedStreets(newExpanded);
  };

  return (
    <div className={cn(
      "border-r flex flex-col h-full transition-all duration-300",
      collapsed ? "w-14" : "w-72"
    )}>
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <div className="flex-1">
            <h2 className="font-semibold text-base">Struktura zgrada</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gradovi → Ulice → Ulazi</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="h-8 w-8 shrink-0"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {cities.map((city) => {
            const isExpanded = expandedCities.has(city.id);
            const isSelected = selectedCity?.id === city.id;

              return (
                <div key={city.id}>
                  {/* City */}
                  <div
                    className={cn(
                      "group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors duration-150",
                      isSelected && "bg-accent/40 shadow-sm"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 shrink-0 transition-none group-hover:bg-transparent group-hover:text-accent-foreground hover:bg-transparent [&_svg]:transition-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCity(city.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0 group-hover:text-accent-foreground"
                      onClick={() => {
                        onSelectCity(city);
                        if (!isExpanded) toggleCity(city.id);
                      }}
                    >
                      <MapPin className="h-4 w-4 text-primary group-hover:text-accent-foreground shrink-0 transition-colors duration-150" />
                      <span className="text-sm font-medium truncate">{city.name}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground ml-auto shrink-0 transition-colors duration-150">
                        {city.streets.length}
                      </span>
                    </div>
                  </div>

                  {/* Streets */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 animate-accordion-down">
                      {city.streets.map((street) => {
                      const isStreetExpanded = expandedStreets.has(street.id);
                      const isStreetSelected = selectedStreet?.id === street.id;

                        return (
                          <div key={street.id}>
                            {/* Street */}
                            <div
                              className={cn(
                                "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors duration-150",
                                isStreetSelected && "bg-accent/40 shadow-sm"
                              )}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0 shrink-0 transition-none group-hover:bg-transparent group-hover:text-accent-foreground hover:bg-transparent [&_svg]:transition-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStreet(street.id);
                                }}
                              >
                                {isStreetExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                              <div
                                className="flex items-center gap-2 flex-1 min-w-0 group-hover:text-accent-foreground"
                                onClick={() => {
                                  onSelectStreet(street);
                                  if (!isStreetExpanded) toggleStreet(street.id);
                                }}
                              >
                                <span className="text-sm truncate">{street.name}</span>
                                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground ml-auto shrink-0 transition-colors duration-150">
                                  {street.buildings.length}
                                </span>
                              </div>
                            </div>

                            {/* Buildings */}
                            {isStreetExpanded && (
                              <div className="ml-4 mt-1 space-y-0.5 animate-accordion-down">
                                {street.buildings.map((building) => {
                                  const isBuildingSelected = selectedBuilding?.id === building.id;

                                  return (
                                    <div
                                      key={building.id}
                                      className={cn(
                                        "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors duration-150",
                                        isBuildingSelected && "bg-accent/40 shadow-sm"
                                      )}
                                      onClick={() => onSelectBuilding(building)}
                                    >
                      <Building2 className="h-3 w-3 text-muted-foreground group-hover:text-accent-foreground shrink-0 transition-colors duration-150" />
                      <span className="text-sm truncate group-hover:text-accent-foreground transition-colors duration-150">Ulaz {building.name}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground ml-auto shrink-0 transition-colors duration-150">
                        {building.apartments.length} st.
                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
