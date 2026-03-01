import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import { buildingSchema } from "@/hooks/useBuildingsData";

type BuildingFormData = z.infer<typeof buildingSchema>;

interface EditBuilding {
  id: string;
  name?: string;
  number?: string;
  iban?: string | null;
  oib?: string | null;
  representative?: string | null;
  representativePhone?: string | null;
  fees?: {
    cleaning?: number;
    loan?: number;
    reservePerSqm?: number;
    savingsFixed?: number;
    extraFixed?: number;
    electricityFixed?: number;
    savingsPerSqm?: number;
  };
}

interface BuildingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BuildingFormData) => void;
  editBuilding?: EditBuilding | null;
  streetName: string;
}

export const BuildingDialog = ({ open, onOpenChange, onSave, editBuilding, streetName }: BuildingDialogProps) => {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      number: "",
      name: "",
      iban: "",
      oib: "",
      representative: "",
      representativePhone: "",
      cleaningFee: 0,
      loanFee: 0,
      reservePerSqm: 0,
      savingsFixed: 0,
      extraFixed: 0,
      electricityFixed: 0,
      savingsPerSqm: 0,
    },
  });

  useEffect(() => {
    if (editBuilding) {
      form.reset({
        number: editBuilding.number ?? editBuilding.name ?? "",
        name: editBuilding.name ?? "",
        iban: editBuilding.iban ?? "",
        oib: editBuilding.oib ?? "",
        representative: editBuilding.representative ?? "",
        representativePhone: editBuilding.representativePhone ?? (editBuilding as { representative_phone?: string }).representative_phone ?? "",
        cleaningFee: editBuilding.fees?.cleaning ?? 0,
        loanFee: editBuilding.fees?.loan ?? 0,
        reservePerSqm: editBuilding.fees?.reservePerSqm ?? 0,
        savingsFixed: editBuilding.fees?.savingsFixed ?? 0,
        extraFixed: editBuilding.fees?.extraFixed ?? 0,
        electricityFixed: editBuilding.fees?.electricityFixed ?? 0,
        savingsPerSqm: editBuilding.fees?.savingsPerSqm ?? 0,
      });
    } else {
      form.reset({
        number: "",
        name: "",
        iban: "",
        oib: "",
        representative: "",
        representativePhone: "",
        cleaningFee: 0,
        loanFee: 0,
        reservePerSqm: 0,
        savingsFixed: 0,
        extraFixed: 0,
        electricityFixed: 0,
        savingsPerSqm: 0,
      });
    }
  }, [editBuilding, form, open]);

  const handleSubmit = (data: BuildingFormData) => {
    if (editBuilding) {
      onSave({
        number: data.number,
        name: data.name,
        iban: data.iban || undefined,
        oib: data.oib || undefined,
        representative: data.representative || undefined,
        representativePhone: data.representativePhone || undefined,
        cleaningFee: data.cleaningFee ?? 0,
        loanFee: data.loanFee ?? 0,
        reservePerSqm: data.reservePerSqm ?? 0,
        savingsFixed: data.savingsFixed ?? 0,
        extraFixed: data.extraFixed ?? 0,
        electricityFixed: data.electricityFixed ?? 0,
        savingsPerSqm: data.savingsPerSqm ?? 0,
      });
    } else {
      onSave({ number: data.number, name: data.name });
    }
    form.reset();
    onOpenChange(false);
  };

  const isEdit = !!editBuilding;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Uredi podatke zgrade" : "Dodaj novi ulaz"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Izmijeni IBAN, OIB, naknade i ostale podatke zgrade na ulici ${streetName}.`
              : `Dodaj novi ulaz na ulicu ${streetName}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj/naziv ulaza</FormLabel>
                  <FormControl>
                    <Input placeholder="Npr. 15A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="HR..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oib"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OIB</FormLabel>
                        <FormControl>
                          <Input placeholder="11 znamenki" maxLength={11} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="representative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Predstavnik</FormLabel>
                        <FormControl>
                          <Input placeholder="Ime i prezime" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="representativePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon predstavnika</FormLabel>
                        <FormControl>
                          <Input placeholder="+385 91 123 4567" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Osnovne naknade (€/mjesec)</div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="cleaningFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Čišćenje (po stanu)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reservePerSqm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pričuva €/m²</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="loanFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kredit €/m²</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="dodatne-naknade">
                    <AccordionTrigger>Dodatne naknade (€/mjesec)</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                        <FormField
                          control={form.control}
                          name="savingsFixed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Štednja (po stanu)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="extraFixed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Izvanredni poslovi (po stanu)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="electricityFixed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Struja (po stanu)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="savingsPerSqm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Štednja €/m²</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  placeholder="0"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit">{isEdit ? "Spremi" : "Dodaj"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
