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
import { Input } from "@/components/ui/input";
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
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { personsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AddCoOwnerDialogProps {
  apartmentId: string;
  apartmentNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onSubmit: (data: { personId: string; shareNum?: number; shareDen?: number }) => Promise<void>;
}

export function AddCoOwnerDialog({
  apartmentId,
  apartmentNumber,
  open,
  onOpenChange,
  onSuccess,
  onSubmit,
}: AddCoOwnerDialogProps) {
  const [personId, setPersonId] = useState("");
  const [sharePercent, setSharePercent] = useState<string>("");
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
      setSharePercent("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!personId?.trim()) {
      toast({
        title: "Odaberite osobu",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      let shareNum: number | undefined;
      let shareDen: number | undefined;
      if (sharePercent.trim() !== "") {
        const pct = Number(sharePercent.replace(",", "."));
        if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
          toast({ title: "Postotak mora biti između 1 i 100", variant: "destructive" });
          setPending(false);
          return;
        }
        shareNum = Math.round((pct / 100) * 100);
        shareDen = 100;
        const g = gcd(shareNum, shareDen);
        shareNum /= g;
        shareDen /= g;
      }
      await onSubmit({ personId: personId.trim(), shareNum, shareDen });
      toast({ title: "Suvlasnik dodan" });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Nije moguće dodati suvlasnika.";
      toast({ title: "Greška", description: msg, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  const selectedPerson = persons.find((p: { id: string }) => String(p.id) === String(personId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj suvlasnika – Stan {apartmentNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FormSection>
            <div className="grid gap-2">
              <Label>Odaberi suvlasnika</Label>
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
                            <span className="ml-2 text-muted-foreground text-xs truncate">{p.email}</span>
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
              <Label>Postotak</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="npr. 25 za 25%"
                value={sharePercent}
                onChange={(e) => setSharePercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Prazno = 1/1.</p>
            </div>
          </FormSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Odustani
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dodaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}
