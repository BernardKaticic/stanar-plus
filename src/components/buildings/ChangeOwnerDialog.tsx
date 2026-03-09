import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { personsApi, apartmentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface ChangeOwnerDialogProps {
  apartmentId: string;
  apartmentNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangeOwnerDialog({
  apartmentId,
  apartmentNumber,
  open,
  onOpenChange,
  onSuccess,
}: ChangeOwnerDialogProps) {
  const [personId, setPersonId] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const { data: personsData } = useQuery({
    queryKey: ["persons", "list"],
    queryFn: () => personsApi.getAll({ pageSize: 500 }),
    enabled: open,
  });
  const persons = personsData?.data ?? [];

  useEffect(() => {
    if (!open) {
      setPersonId("");
      setValidFrom(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!personId?.trim()) {
      toast({
        title: "Odaberite osobu",
        description: "Odaberite novog vlasnika stana.",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      await apartmentsApi.changeOwner(apartmentId, {
        personId: personId.trim(),
        validFrom: validFrom || undefined,
      });
      toast({
        title: "Vlasnik promijenjen",
        description: `Od ${validFrom} vlasnik stana je ažuriran.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Nije moguće promijeniti vlasnika.";
      toast({
        title: "Greška",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  const selectedPerson = persons.find((p: { id: string }) => String(p.id) === String(personId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promjena vlasnika – Stan {apartmentNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FormSection>
            <div className="grid gap-2">
              <Label>Osoba</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedPerson
                    ? `${selectedPerson.name}${selectedPerson.email ? ` (${selectedPerson.email})` : ""}`
                    : "Odaberi osobu..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Traži osobu..." />
                  <CommandList>
                    <CommandEmpty>Nema rezultata.</CommandEmpty>
                    <CommandGroup>
                      {persons.map((p: { id: string; name?: string; email?: string }) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name ?? ""} ${p.email ?? ""}`}
                          onSelect={() => {
                            setPersonId(String(p.id));
                            setComboboxOpen(false);
                          }}
                        >
                          <span className="font-medium">{p.name}</span>
                          {p.email && (
                            <span className="ml-2 text-muted-foreground text-xs truncate">
                              {p.email}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            </div>
          </FormSection>
          <FormSection>
            <div className="grid gap-2">
              <Label>Od kada vrijedi</Label>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Do ovog datuma stari vlasnik, zatim novi.</p>
            </div>
          </FormSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Odustani
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi promjenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
