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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { personsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type AddCoOwnerFormData =
  | { personId: string; shareNum?: number; shareDen?: number }
  | { ownerName: string; ownerOib?: string; email?: string; phone?: string; delivery_method?: "email" | "pošta" | "both"; shareNum?: number; shareDen?: number };

interface AddCoOwnerDialogProps {
  apartmentId: string;
  apartmentNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onSubmit: (data: AddCoOwnerFormData) => Promise<void>;
}

export function AddCoOwnerDialog({
  apartmentId,
  apartmentNumber,
  open,
  onOpenChange,
  onSuccess,
  onSubmit,
}: AddCoOwnerDialogProps) {
  const [ownerMode, setOwnerMode] = useState<"existing" | "new">("existing");
  const [personId, setPersonId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerOib, setOwnerOib] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "pošta" | "both">("email");
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
      setOwnerMode("existing");
      setPersonId("");
      setOwnerName("");
      setOwnerOib("");
      setEmail("");
      setPhone("");
      setDeliveryMethod("email");
      setSharePercent("");
    }
  }, [open]);

  const parseShare = (): { shareNum?: number; shareDen?: number } => {
    if (sharePercent.trim() === "") return {};
    const pct = Number(sharePercent.replace(",", "."));
    if (Number.isNaN(pct) || pct <= 0 || pct > 100) return { shareNum: undefined, shareDen: undefined };
    let shareNum = Math.round((pct / 100) * 100);
    let shareDen = 100;
    const g = gcd(shareNum, shareDen);
    shareNum /= g;
    shareDen /= g;
    return { shareNum, shareDen };
  };

  const handleSubmit = async () => {
    const { shareNum, shareDen } = parseShare();
    if (sharePercent.trim() !== "" && (shareNum == null || shareDen == null)) {
      toast({ title: "Postotak mora biti između 1 i 100", variant: "destructive" });
      return;
    }
    if (ownerMode === "existing") {
      if (!personId?.trim()) {
        toast({ title: "Odaberite osobu", variant: "destructive" });
        return;
      }
      setPending(true);
      try {
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
    } else {
      const nameTrim = ownerName.trim();
      if (!nameTrim) {
        toast({ title: "Ime suvlasnika je obavezno", variant: "destructive" });
        return;
      }
      setPending(true);
      try {
        await onSubmit({
          ownerName: nameTrim,
          ownerOib: ownerOib.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          delivery_method: deliveryMethod,
          shareNum,
          shareDen,
        });
        toast({ title: "Suvlasnik dodan" });
        onSuccess();
        onOpenChange(false);
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? "Nije moguće dodati suvlasnika.";
        toast({ title: "Greška", description: msg, variant: "destructive" });
      } finally {
        setPending(false);
      }
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
            <div className="space-y-3">
              <Label className="text-sm font-medium">Način dodavanja</Label>
              <RadioGroup value={ownerMode} onValueChange={(v) => setOwnerMode(v as "existing" | "new")} className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="add-existing" />
                  <Label htmlFor="add-existing" className="font-normal cursor-pointer">Odaberi postojećeg suvlasnika</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="add-new" />
                  <Label htmlFor="add-new" className="font-normal cursor-pointer">Unesi podatke novog suvlasnika</Label>
                </div>
              </RadioGroup>
            </div>
          </FormSection>

          {ownerMode === "existing" ? (
            <FormSection>
              <div className="grid gap-2">
                <Label>Postojeći suvlasnik</Label>
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
          ) : (
            <FormSection>
              <p className="text-xs text-muted-foreground mb-2">Email omogućuje web pristup.</p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Ime i prezime *</Label>
                  <Input placeholder="Ime i prezime" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>OIB</Label>
                  <Input placeholder="11 znamenki" value={ownerOib} onChange={(e) => setOwnerOib(e.target.value)} maxLength={11} className="font-mono" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Telefon</Label>
                    <Input placeholder="+385 91 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Način dostave</Label>
                  <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "email" | "pošta" | "both")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="pošta">Pošta</SelectItem>
                      <SelectItem value="both">E-mail i pošta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>
          )}

          <FormSection>
            <div className="grid gap-2">
              <Label>Postotak udjela</Label>
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
