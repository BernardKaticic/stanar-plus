import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BuildingLike {
  streets?: { cities?: { name?: string }; name?: string };
  street?: { city?: { name?: string }; name?: string };
  number?: string;
}

const formatApartmentLabel = (apt: {
  building?: BuildingLike;
  buildings?: BuildingLike;
  apartment_number?: string;
}) => {
  const b = apt.buildings || apt.building;
  const city = b?.streets?.cities?.name || b?.street?.city?.name || "";
  const street = b?.streets?.name || b?.street?.name || "";
  const num = b?.number || "";
  const addr = [city, street, num].filter(Boolean).join(", ");
  return addr ? `${addr}, Stan ${apt.apartment_number}` : `Stan ${apt.apartment_number}`;
};

interface Apartment {
  id: string;
  apartment_number?: string;
  building?: unknown;
  buildings?: unknown;
  has_tenant?: boolean;
}

interface ApartmentMultiSelectProps {
  apartments: Apartment[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** Samo prazni stanovi (has_tenant === false) */
  emptyOnly?: boolean;
}

export const ApartmentMultiSelect = ({
  apartments,
  value = [],
  onChange,
  placeholder = "Pretraži i odaberi stanove...",
  emptyMessage = "Nema pronađenih stanova",
  emptyOnly = true,
}: ApartmentMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const available = emptyOnly
    ? apartments.filter((a) => !a.has_tenant)
    : apartments;

  const selectedApartments = available.filter((a) => value.includes(a.id));

  const toggle = (id: string) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10 h-auto py-2"
          >
            <span className="truncate text-left font-normal">
              {value.length === 0
                ? placeholder
                : `Odabrano: ${value.length} stanova`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(95vw,28rem)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pretraži po adresi ili broju stana..." />
            <CommandList className="max-h-[min(16rem,50vh)]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {available.map((apt) => {
                  const label = formatApartmentLabel(apt);
                  const isSelected = value.includes(apt.id);
                  return (
                    <CommandItem
                      key={apt.id}
                      value={`${label} ${apt.apartment_number || ""} ${apt.id}`}
                      onSelect={() => toggle(apt.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedApartments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedApartments.map((apt) => (
            <Badge
              key={apt.id}
              variant="secondary"
              className="pr-1 gap-1 font-normal"
            >
              <span className="max-w-[180px] truncate" title={formatApartmentLabel(apt)}>
                {formatApartmentLabel(apt)}
              </span>
              <button
                type="button"
                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                onClick={() => toggle(apt.id)}
                aria-label="Ukloni"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
