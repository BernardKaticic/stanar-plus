import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronsUpDown, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { contractsApi, decisionsApi, locationsApi } from "@/lib/api";
import { fileToStoredAttachment } from "@/lib/localAttachment";
import { cn } from "@/lib/utils";

const cleanId = (id: string) => String(id || "").replace(/^building-/, "");
const formatIsoDate = (date?: Date) => (date ? date.toISOString().slice(0, 10) : "");

function toDate(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseAmount(v: string) {
  return Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
}

type Kind = "decision" | "contract";

const DecisionContractEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { kind: kindParam, id } = useParams();
  const [searchParams] = useSearchParams();
  const kind: Kind = (kindParam === "decision" || kindParam === "contract"
    ? kindParam
    : (searchParams.get("type") === "contract" ? "contract" : "decision")) as Kind;
  const isEdit = Boolean(id);

  const { data: locationsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const buildings = (locationsList as any[])
    .map((b) => ({ id: cleanId(String(b.id)), name: String(b.name || "") }))
    .filter((b) => b.id && b.name);

  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [buildingId, setBuildingId] = useState("");
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [buildingQuery, setBuildingQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [contractor, setContractor] = useState("");
  const [amount, setAmount] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replaceDocument, setReplaceDocument] = useState(false);
  const filteredBuildings = useMemo(() => {
    const q = buildingQuery.trim().toLowerCase();
    if (!q) return buildings.slice(0, 200);
    return buildings.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 200);
  }, [buildings, buildingQuery]);

  const detailQuery = useQuery({
    queryKey: ["decision-contract-editor", kind, id],
    enabled: isEdit,
    queryFn: async () => {
      if (kind === "decision") return decisionsApi.getById(String(id));
      return contractsApi.getById(String(id));
    },
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const d: any = detailQuery.data;
    setNumber(d.number || "");
    setTitle(d.title || "");
    setStatus(d.status || "draft");
    setBuildingId(d.buildingId || "");
    if (kind === "decision") {
      setDate(toDate(d.dateIso));
    } else {
      setContractor(d.contractor || "");
      setDateFrom(toDate(d.dateFromIso));
      setDateTo(toDate(d.dateToIso));
      setAmount(String(d.amountNum || ""));
    }
  }, [detailQuery.data, kind]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const attachmentPayload = attachment ? await fileToStoredAttachment(attachment, 10 * 1024 * 1024) : undefined;

      if (kind === "decision") {
        const payload = {
          number: number.trim(),
          title: title.trim(),
          date: formatIsoDate(date),
          status: status as "draft" | "review" | "approved" | "effective" | "archived",
          buildingId: buildingId || null,
          attachment: attachmentPayload,
          replaceDocument,
        };
        if (isEdit) return decisionsApi.update(String(id), payload);
        return decisionsApi.create(payload);
      }

      const payload = {
        number: number.trim(),
        title: title.trim(),
        contractor: contractor.trim(),
        dateFrom: formatIsoDate(dateFrom),
        dateTo: formatIsoDate(dateTo),
        amount: parseAmount(amount),
        status: status as "draft" | "active" | "expiring" | "expired" | "terminated" | "archived" | "completed",
        buildingId: buildingId || null,
        attachment: attachmentPayload,
        replaceDocument,
      };
      if (isEdit) return contractsApi.update(String(id), payload);
      return contractsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: isEdit ? "Spremljeno" : "Kreirano" });
      navigate("/decisions");
    },
    onError: (e: unknown) => {
      const message =
        typeof e === "object" && e && "body" in e
          ? ((e as { body?: { message?: string } }).body?.message || (e as { message?: string }).message)
          : e instanceof Error
            ? e.message
            : "Spremanje nije uspjelo";
      toast({ title: "Greška", description: message || "Spremanje nije uspjelo", variant: "destructive" });
    },
  });

  const validateAndSave = () => {
    if (!number.trim() || !title.trim()) return toast({ title: "Greška", description: "Broj i naslov su obavezni.", variant: "destructive" });
    if (kind === "decision" && !date) return toast({ title: "Greška", description: "Datum je obavezan.", variant: "destructive" });
    if (kind === "contract") {
      if (!dateFrom || !dateTo) return toast({ title: "Greška", description: "Period ugovora je obavezan.", variant: "destructive" });
      if (dateFrom > dateTo) return toast({ title: "Greška", description: "Datum početka ne može biti nakon datuma završetka.", variant: "destructive" });
    }
    if (isEdit && replaceDocument && !attachment) {
      return toast({ title: "Greška", description: "Za zamjenu dokumenta učitaj datoteku.", variant: "destructive" });
    }
    saveMutation.mutate();
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate("/decisions")} aria-label="Natrag">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="page-title">
            {isEdit ? "Uredi" : "Novi"} {kind === "decision" ? "odluku" : "ugovor"}
          </h1>
        </div>
      </header>

      <Card className="rounded-lg border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{kind === "decision" ? "Podaci odluke" : "Podaci ugovora"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Broj *</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={kind === "decision" ? "ODL-2026-001" : "UG-2026-001"} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {kind === "decision" ? (
                        <>
                          <SelectItem value="draft">Nacrt</SelectItem>
                          <SelectItem value="review">Na potvrdi</SelectItem>
                          <SelectItem value="approved">Usvojena</SelectItem>
                          <SelectItem value="effective">Na snazi</SelectItem>
                          <SelectItem value="archived">Arhivirana</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="draft">Nacrt</SelectItem>
                          <SelectItem value="active">Aktivan</SelectItem>
                          <SelectItem value="expiring">Pred istekom</SelectItem>
                          <SelectItem value="expired">Istekao</SelectItem>
                          <SelectItem value="terminated">Raskinut</SelectItem>
                          <SelectItem value="completed">Završen</SelectItem>
                          <SelectItem value="archived">Arhiviran</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Naslov *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "decision" ? "Odluka o..." : "Ugovor o..."} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {kind === "decision" ? (
                  <div className="space-y-2">
                    <Label>Datum *</Label>
                    <DatePicker date={date} onDateChange={setDate} className="w-full" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Od datuma *</Label>
                      <DatePicker date={dateFrom} onDateChange={setDateFrom} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label>Do datuma *</Label>
                      <DatePicker date={dateTo} onDateChange={setDateTo} className="w-full" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Zgrada (opcionalno)</Label>
                  <Popover open={buildingOpen} onOpenChange={setBuildingOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" aria-expanded={buildingOpen} className="w-full justify-between">
                        <span className="truncate">
                          {buildingId ? buildings.find((b) => b.id === buildingId)?.name || "Odaberi zgradu" : "Bez povezane zgrade"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pretraži zgradu..." value={buildingQuery} onValueChange={setBuildingQuery} />
                        <CommandList>
                          <CommandEmpty>Nema rezultata</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="bez povezane zgrade"
                              onSelect={() => {
                                setBuildingId("");
                                setBuildingOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", buildingId === "" ? "opacity-100" : "opacity-0")} />
                              Bez povezane zgrade
                            </CommandItem>
                            {filteredBuildings.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => {
                                  setBuildingId(b.id);
                                  setBuildingOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", buildingId === b.id ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{b.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {isEdit ? (
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <Checkbox id="replace-document" checked={replaceDocument} onCheckedChange={(v) => setReplaceDocument(Boolean(v))} />
                  <Label htmlFor="replace-document" className="cursor-pointer">Zamijeni postojeći dokument (upload)</Label>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Učitaj dokument (opcionalno)</Label>
                {!attachment ? (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/40">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Odaberi datoteku</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="truncate text-sm">{attachment.name}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setAttachment(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Podržani formati: PDF, DOC, DOCX, PNG, JPG, WEBP.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" className="min-h-[36px]" onClick={() => navigate("/decisions")}>Odustani</Button>
        <Button className="min-h-[36px]" onClick={validateAndSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Spremam..." : isEdit ? "Spremi promjene" : "Kreiraj"}
        </Button>
      </div>
    </div>
  );
};

export default DecisionContractEditor;
