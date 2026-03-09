import { MapPin } from "lucide-react";
import { useCities } from "@/hooks/useBuildingsData";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const defaultCenter: [number, number] = [45.815, 15.981]; // Zagreb kao default

const buildingIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapPage = () => {
  const { data: cities, isLoading } = useCities();

  const buildings =
    cities?.flatMap((city: any) =>
      (city.streets || []).flatMap((street: any) =>
        (street.buildings || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          number: b.number,
          city: city.name,
          street: street.name,
          latitude: b.latitude,
          longitude: b.longitude,
          apartments: b.apartments?.length ?? 0,
          debt: b.debt ?? 0,
        }))
      )
    ) ?? [];

  const buildingsWithCoords = buildings.filter(
    (b) =>
      typeof b.latitude === "number" &&
      typeof b.longitude === "number" &&
      !Number.isNaN(b.latitude) &&
      !Number.isNaN(b.longitude)
  );

  const center =
    buildingsWithCoords.length > 0
      ? [buildingsWithCoords[0].latitude, buildingsWithCoords[0].longitude] as [number, number]
      : defaultCenter;

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Karta</h1>
      </header>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Ukupno zgrada: <span className="font-medium text-foreground">{buildings.length}</span>
            </p>
          </div>
        </div>

        <div className="h-[480px] w-full rounded-md overflow-hidden border">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : buildingsWithCoords.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <EmptyState title="Nema zgrada s koordinatama" />
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {buildingsWithCoords.map((b) => (
                <Marker
                  key={b.id}
                  position={[b.latitude, b.longitude]}
                  icon={buildingIcon}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        {b.street} {b.number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stanova: <span className="font-medium">{b.apartments}</span>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapPage;

