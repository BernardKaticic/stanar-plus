import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apartmentsApi, reservePaymentsApi, type CreditAccountOption, type ReservePaymentPayload } from "@/lib/api";

const reservePaymentSchema = z.object({
  apartment_id: z.string().min(1, "Odaberite stan"),
  amount: z
    .string()
    .min(1, "Iznos je obavezan")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Iznos mora biti veći od 0"),
  payment_date: z.string().min(1, "Datum uplate je obavezan"),
  memo: z.string().max(500).optional(),
  credit_account_id: z.string().optional(),
});

type ReservePaymentFormData = z.infer<typeof reservePaymentSchema>;

function formatApartmentLabel(apt: {
  apartment_number?: string;
  buildings?: { number?: string; streets?: { name?: string; cities?: { name?: string } } };
}) {
  const b = apt.buildings;
  const city = b?.streets?.cities?.name ?? "";
  const street = b?.streets?.name ?? "";
  const num = b?.number ?? "";
  const addr = [city, street, num].filter(Boolean).join(", ");
  return addr ? `${addr}, Stan ${apt.apartment_number ?? apt.id}` : `Stan ${apt.apartment_number ?? apt.id}`;
}

interface ReservePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: ReservePaymentPayload) => Promise<void>;
  defaultApartmentId?: string | null;
  isPending?: boolean;
}

export function ReservePaymentDialog({
  open,
  onOpenChange,
  onSave,
  defaultApartmentId,
  isPending = false,
}: ReservePaymentDialogProps) {
  const form = useForm<ReservePaymentFormData>({
    resolver: zodResolver(reservePaymentSchema),
    defaultValues: {
      apartment_id: "",
      amount: "",
      payment_date: new Date().toISOString().slice(0, 10),
      memo: "",
      credit_account_id: "",
    },
  });

  const { data: apartments = [], isLoading: apartmentsLoading } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentsApi.getAll(),
    enabled: open,
  });

  const { data: creditAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["reserve-payments", "accounts"],
    queryFn: () => reservePaymentsApi.getCreditAccounts(),
    enabled: open,
  });

  useEffect(() => {
    if (open && defaultApartmentId && apartments.length > 0) {
      const exists = apartments.some((a: { id: string }) => String(a.id) === String(defaultApartmentId));
      if (exists) {
        form.setValue("apartment_id", String(defaultApartmentId));
      }
    }
  }, [open, defaultApartmentId, apartments, form]);

  const submitHandler = async (data: ReservePaymentFormData) => {
    const payload: ReservePaymentPayload = {
      apartment_id: parseInt(data.apartment_id, 10),
      amount: Math.round(Number(data.amount) * 100) / 100,
      payment_date: data.payment_date,
      memo: data.memo?.trim() || undefined,
      credit_account_id: data.credit_account_id ? parseInt(data.credit_account_id, 10) : undefined,
    };
    await onSave(payload);
    form.reset({
      apartment_id: defaultApartmentId ? String(defaultApartmentId) : "",
      amount: "",
      payment_date: new Date().toISOString().slice(0, 10),
      memo: "",
      credit_account_id: form.getValues("credit_account_id") || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,28rem)] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Uplata pričuve</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => submitHandler(d))} className="space-y-5">
            <FormSection>
              <FormField
                control={form.control}
                name="apartment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Stan *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={apartmentsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={apartmentsLoading ? "Učitavanje..." : "Odaberite stan"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {apartments.map((apt: { id: string; apartment_number?: string; buildings?: unknown }) => (
                          <SelectItem key={apt.id} value={String(apt.id)}>
                            {formatApartmentLabel(apt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Iznos (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        className="min-w-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Datum uplate *</FormLabel>
                    <FormControl>
                      <Input type="date" className="min-w-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Napomena</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Opcionalno (npr. referenca uplatnice)"
                        className="min-w-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {creditAccounts.length > 0 && (
                <FormField
                  control={form.control}
                  name="credit_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Konto za uplatu (banka/imovina)</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={accountsLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={accountsLoading ? "Učitavanje..." : "Zadani (prvi aktivni)"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {creditAccounts.map((acc: CreditAccountOption) => (
                            <SelectItem key={acc.id} value={String(acc.id)}>
                              {acc.code} – {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormSection>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Knjiženje..." : "Knjiži uplatu"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
