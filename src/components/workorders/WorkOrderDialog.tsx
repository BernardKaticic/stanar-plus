import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSection,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { locationsApi, apartmentsApi } from "@/lib/api";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const workOrderSchema = z.object({
  title: z.string().trim().min(1, "Naslov je obavezan").max(200, "Naslov je predugačak"),
  description: z.string().trim().max(1000, "Opis je predugačak").optional(),
  building_id: z.string().min(1, "Zgrada je obavezna"),
  apartment_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in-progress", "completed"]).optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

export type WorkOrderEditItem = {
  id: string;
  title: string;
  description?: string | null;
  building_id: string;
  apartment_id?: string | null;
  priority: string;
  status: string;
};

interface WorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: WorkOrderFormData & { created_by?: string; id?: string }) => void;
  userId: string;
  isPending?: boolean;
  editItem?: WorkOrderEditItem | null;
}

export const WorkOrderDialog = ({ open, onOpenChange, onSave, userId, isPending, editItem }: WorkOrderDialogProps) => {
  const isEdit = !!editItem;
  const [buildingComboboxOpen, setBuildingComboboxOpen] = useState(false);
  const [apartmentComboboxOpen, setApartmentComboboxOpen] = useState(false);
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      building_id: "",
      apartment_id: "",
      priority: "medium",
      status: "open",
    },
  });

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        title: editItem.title ?? "",
        description: editItem.description ?? "",
        building_id: String(editItem.building_id ?? "").replace(/^building-/, ""),
        apartment_id: editItem.apartment_id ?? "",
        priority: (editItem.priority === "urgent" || editItem.priority === "normal" ? (editItem.priority === "urgent" ? "high" : "medium") : editItem.priority) as "low" | "medium" | "high",
        status: (editItem.status === "in-progress" ? "in-progress" : editItem.status === "completed" ? "completed" : "open") as "open" | "in-progress" | "completed",
      });
    } else if (open && !editItem) {
      form.reset({
        title: "",
        description: "",
        building_id: "",
        apartment_id: "",
        priority: "medium",
        status: "open",
      });
    }
  }, [open, editItem, form]);

  const { data: buildingsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
    enabled: open,
  });
  const buildings = buildingsList.map((b: { id: string; name: string }) => ({
    id: String(b.id).replace(/^building-/, ""),
    name: b.name,
  }));

  const buildingId = form.watch("building_id");
  const prevBuildingIdRef = useRef<string>("");
  useEffect(() => {
    if (prevBuildingIdRef.current !== buildingId) {
      prevBuildingIdRef.current = buildingId;
      form.setValue("apartment_id", "");
    }
  }, [buildingId, form]);
  const { data: apartmentsList = [] } = useQuery({
    queryKey: ["apartments", "building", buildingId],
    queryFn: () => apartmentsApi.getAll({ buildingId: buildingId || undefined }),
    enabled: open && !!buildingId,
  });
  const apartments = (apartmentsList as { id: string; apartment_number?: string; number?: string }[]).map((a) => ({
    id: String(a.id),
    label: a.apartment_number ?? a.number ?? String(a.id),
  }));

  const handleSubmit = (data: WorkOrderFormData) => {
    if (isEdit && editItem) {
      onSave({ ...data, id: editItem.id });
    } else {
      onSave({ ...data, created_by: userId });
    }
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi radni nalog" : "Novi radni nalog"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormSection>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Naslov</FormLabel>
                    <FormControl>
                      <Input placeholder="Npr. Popravak lifta" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Opis (opcionalno)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detaljan opis problema..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            <FormSection>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="building_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Zgrada</FormLabel>
                      <Popover open={buildingComboboxOpen} onOpenChange={setBuildingComboboxOpen}>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={buildingComboboxOpen}
                              className={cn(
                                "w-full justify-between font-normal min-h-[40px]",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {field.value
                                  ? buildings.find((b) => b.id === field.value)?.name ?? "Odaberite zgradu"
                                  : "Odaberite zgradu"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                                      field.onChange(building.id);
                                      setBuildingComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === building.id ? "opacity-100" : "opacity-0"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apartment_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Stan (opcionalno)</FormLabel>
                      <Popover open={apartmentComboboxOpen} onOpenChange={setApartmentComboboxOpen}>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={apartmentComboboxOpen}
                              disabled={!buildingId}
                              className={cn(
                                "w-full justify-between font-normal min-h-[40px]",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {!buildingId
                                  ? "Prvo odaberite zgradu"
                                  : field.value
                                    ? apartments.find((a) => a.id === field.value)?.label ?? field.value
                                    : "Nije naveden"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Pretraži stanove..." />
                            <CommandList>
                              <CommandEmpty>Stan nije pronađen.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="Nije naveden"
                                  onSelect={() => {
                                    field.onChange("");
                                    setApartmentComboboxOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                  Nije naveden
                                </CommandItem>
                                {apartments.map((apt) => (
                                  <CommandItem
                                    key={apt.id}
                                    value={apt.label}
                                    onSelect={() => {
                                      field.onChange(apt.id);
                                      setApartmentComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === apt.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    Stan {apt.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
            <FormSection>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Prioritet</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Nisko</SelectItem>
                          <SelectItem value="medium">Normalno</SelectItem>
                          <SelectItem value="high">Hitno</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? "open"}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Otvoren</SelectItem>
                          <SelectItem value="in-progress">U tijeku</SelectItem>
                          <SelectItem value="completed">Završen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (isEdit ? "Spremanje..." : "Kreiranje...") : isEdit ? "Spremi" : "Kreiraj nalog"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
