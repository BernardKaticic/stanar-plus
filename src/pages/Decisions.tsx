import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useContracts, useDecisions } from "@/hooks/useDecisionsData";
import { contractsApi, decisionsApi, locationsApi, type ContractItem, type DecisionItem } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { exportTableToCSV } from "@/lib/export";
import { Building2, Calendar, Download, Eye, FileText, Paperclip, Pencil, Plus, ScrollText, Search } from "lucide-react";

type AppError = {
  body?: { message?: string };
  message?: string;
};

const decisionStatusLabel: Record<string, string> = {
  draft: "Nacrt",
  review: "Na potvrdi",
  approved: "Usvojena",
  effective: "Na snazi",
  archived: "Arhivirana",
};

const contractStatusLabel: Record<string, string> = {
  draft: "Nacrt",
  active: "Aktivan",
  expiring: "Pred istekom",
  expired: "Istekao",
  terminated: "Raskinut",
  completed: "Završen",
  archived: "Arhiviran",
};

const cleanBuildingId = (value?: string | null): string => String(value || "").replace(/^building-/, "");

function openBlobPreview(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "dokument";
  a.click();
  URL.revokeObjectURL(url);
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err && "body" in err) {
    const fromBody = (err as AppError).body?.message;
    if (typeof fromBody === "string" && fromBody.trim()) return fromBody;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
};

const Decisions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionStatusFilter, setDecisionStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [contractStatusFilter, setContractStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [mainTab, setMainTab] = useState<"decisions" | "contracts">("decisions");
  const [decisionsPage, setDecisionsPage] = useState(1);
  const [decisionsPageSize, setDecisionsPageSize] = useState(25);
  const [contractsPage, setContractsPage] = useState(1);
  const [contractsPageSize, setContractsPageSize] = useState(25);

  const { data: decisions = [], isLoading: decisionsLoading } = useDecisions({
    status: decisionStatusFilter === "all" ? undefined : decisionStatusFilter,
    search: searchTerm.trim() || undefined,
  });
  const { data: contracts = [], isLoading: contractsLoading } = useContracts({
    status: contractStatusFilter === "all" ? undefined : contractStatusFilter,
    search: searchTerm.trim() || undefined,
  });
  const decisionsTotalPages = Math.max(1, Math.ceil(decisions.length / decisionsPageSize));
  const decisionsSafePage = Math.min(decisionsPage, decisionsTotalPages);
  const pagedDecisions = useMemo(
    () => decisions.slice((decisionsSafePage - 1) * decisionsPageSize, decisionsSafePage * decisionsPageSize),
    [decisions, decisionsSafePage, decisionsPageSize]
  );
  const contractsTotalPages = Math.max(1, Math.ceil(contracts.length / contractsPageSize));
  const contractsSafePage = Math.min(contractsPage, contractsTotalPages);
  const pagedContracts = useMemo(
    () => contracts.slice((contractsSafePage - 1) * contractsPageSize, contractsSafePage * contractsPageSize),
    [contracts, contractsSafePage, contractsPageSize]
  );
  const { data: locationsList = [] } = useQuery({
    queryKey: ["locations", "building"],
    queryFn: () => locationsApi.getByLevel("building"),
  });
  const buildingNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const raw of Array.isArray(locationsList) ? locationsList : []) {
      const b = raw as { id?: string; name?: string };
      const id = cleanBuildingId(b.id);
      if (id && b.name) map.set(id, b.name);
    }
    return map;
  }, [locationsList]);
  const resolveBuildingLabel = (value?: string | null) => {
    const normalized = cleanBuildingId(value);
    if (!normalized) return "-";
    return buildingNameById.get(normalized) || value || "-";
  };
  useEffect(() => {
    if (decisionsPage !== decisionsSafePage) setDecisionsPage(decisionsSafePage);
  }, [decisionsPage, decisionsSafePage]);
  useEffect(() => {
    if (contractsPage !== contractsSafePage) setContractsPage(contractsSafePage);
  }, [contractsPage, contractsSafePage]);
  useEffect(() => {
    setDecisionsPage(1);
  }, [searchTerm, decisionStatusFilter]);
  useEffect(() => {
    setContractsPage(1);
  }, [searchTerm, contractStatusFilter]);

  const openAttachment = async (item: DecisionItem | ContractItem, download = false) => {
    try {
      if (!item.attachment) return;
      const apiCall = "contractor" in item ? contractsApi.getAttachment(item.id, download) : decisionsApi.getAttachment(item.id, download);
      const { blob, fileName } = await apiCall;
      if (download) downloadBlob(blob, fileName || item.attachment.fileName || "dokument");
      else openBlobPreview(blob);
    } catch (e: unknown) {
      toast({ title: "Greška", description: getErrorMessage(e, "Ne mogu otvoriti dokument"), variant: "destructive" });
    }
  };

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Odluke i ugovori</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="hidden sm:flex min-h-[36px]"
            onClick={() => {
              if (mainTab === "decisions") {
                exportTableToCSV(decisions, [
                  { key: "number", label: "Broj" },
                  { key: "title", label: "Naslov" },
                  { key: "building", label: "Zgrada" },
                  { key: "date", label: "Datum" },
                  { key: "status", label: "Status" },
                ], "odluke");
              } else {
                exportTableToCSV(contracts, [
                  { key: "number", label: "Broj" },
                  { key: "title", label: "Naslov" },
                  { key: "building", label: "Zgrada" },
                  { key: "dateFrom", label: "Od" },
                  { key: "dateTo", label: "Do" },
                  { key: "status", label: "Status" },
                ], "ugovori");
              }
              toast({ title: "CSV exportan" });
            }}
            disabled={mainTab === "decisions" ? decisions.length === 0 : contracts.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            className="min-h-[36px]"
            onClick={() => navigate(`/decisions/new?type=${mainTab === "decisions" ? "decision" : "contract"}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj novi
          </Button>
        </div>
      </header>

      <Card className="rounded-lg border border-border/70 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži po broju, naslovu i zgradi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Pretraži odluke i ugovore"
          />
        </div>
      </Card>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "decisions" | "contracts")} className="space-y-6">
        <TabsList className="w-fit">
          <TabsTrigger value="decisions"><ScrollText className="mr-2 h-4 w-4" />Odluke</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="mr-2 h-4 w-4" />Ugovori</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions">
          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader><CardTitle>Odluke skupštine</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Button variant={decisionStatusFilter === "all" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setDecisionStatusFilter("all")}>Sve</Button>
                <Button variant={decisionStatusFilter === "active" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setDecisionStatusFilter("active")}>Aktivne</Button>
                <Button variant={decisionStatusFilter === "archived" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setDecisionStatusFilter("archived")}>Arhivirane</Button>
              </div>
              <div className="hidden md:block rounded-lg border border-border/80 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs font-medium">Broj</TableHead><TableHead className="text-xs font-medium">Naslov</TableHead><TableHead className="text-xs font-medium">Zgrada</TableHead><TableHead className="text-xs font-medium">Datum</TableHead><TableHead className="text-xs font-medium">Dokument</TableHead><TableHead className="text-xs font-medium">Status</TableHead><TableHead className="text-right text-xs font-medium">Akcije</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {decisionsLoading ? (
                      [1, 2, 3].map((i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-64" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-6 w-20" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell></TableRow>)
                    ) : decisions.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="p-0"><EmptyState icon={ScrollText} title={searchTerm ? "Nema rezultata" : "Nema odluka"} /></TableCell></TableRow>
                    ) : (
                      pagedDecisions.map((d) => (
                        <TableRow key={d.id} className="hover:bg-muted/30 transition-colors duration-150">
                          <TableCell className="font-medium">{d.number}</TableCell>
                          <TableCell>{d.title}</TableCell>
                          <TableCell className="text-muted-foreground">{resolveBuildingLabel(d.buildingId || d.building)}</TableCell>
                          <TableCell>{d.date || "-"}</TableCell>
                          <TableCell>{d.attachment ? <span className="flex max-w-[160px] items-center gap-1.5 text-sm text-muted-foreground"><Paperclip className="h-3.5 w-3.5 shrink-0" /><span className="truncate" title={d.attachment.fileName}>{d.attachment.fileName}</span></span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                          <TableCell><Badge variant={d.status === "effective" ? "default" : d.status === "archived" ? "secondary" : "outline"}>{decisionStatusLabel[d.status] || d.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" onClick={() => openAttachment(d, false)} disabled={!d.attachment}><Eye className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" disabled={!d.attachment} onClick={() => openAttachment(d, true)}><Download className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" onClick={() => navigate(`/decisions/decision/${d.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {decisionsLoading ? (
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2 pt-2">
                          <Skeleton className="h-9 w-full" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : decisions.length === 0 ? (
                  <EmptyState icon={ScrollText} title={searchTerm ? "Nema rezultata" : "Nema odluka"} />
                ) : (
                  pagedDecisions.map((d) => (
                    <Card key={d.id} className="rounded-lg border p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{d.number}</p>
                          <Badge variant={d.status === "effective" ? "default" : d.status === "archived" ? "secondary" : "outline"}>
                            {decisionStatusLabel[d.status] || d.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{resolveBuildingLabel(d.buildingId || d.building)}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{d.date || "-"}</span>
                        </div>
                        {d.attachment ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={d.attachment.fileName}>
                              {d.attachment.fileName}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Dokument: —</p>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => openAttachment(d, false)}
                            disabled={!d.attachment}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Prikaži
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            disabled={!d.attachment}
                            onClick={() => openAttachment(d, true)}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Preuzmi
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => navigate(`/decisions/decision/${d.id}/edit`)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Uredi
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              {decisions.length > 0 && (
                <PaginationControls
                  currentPage={decisionsSafePage}
                  totalPages={decisionsTotalPages}
                  pageSize={decisionsPageSize}
                  totalItems={decisions.length}
                  onPageChange={setDecisionsPage}
                  onPageSizeChange={(next) => {
                    setDecisionsPageSize(next);
                    setDecisionsPage(1);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card className="rounded-lg border border-border/70 shadow-sm">
            <CardHeader><CardTitle>Ugovori</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Button variant={contractStatusFilter === "all" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setContractStatusFilter("all")}>Svi</Button>
                <Button variant={contractStatusFilter === "active" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setContractStatusFilter("active")}>Aktivni</Button>
                <Button variant={contractStatusFilter === "archived" ? "default" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setContractStatusFilter("archived")}>Arhivirani</Button>
              </div>
              <div className="hidden md:block rounded-lg border border-border/80 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs font-medium">Broj</TableHead><TableHead className="text-xs font-medium">Naslov</TableHead><TableHead className="text-xs font-medium">Zgrada</TableHead><TableHead className="text-xs font-medium">Period</TableHead><TableHead className="text-xs font-medium">Dokument</TableHead><TableHead className="text-xs font-medium">Status</TableHead><TableHead className="text-right text-xs font-medium">Akcije</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {contractsLoading ? (
                      [1, 2, 3].map((i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-64" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-6 w-20" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell></TableRow>)
                    ) : contracts.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="p-0"><EmptyState icon={FileText} title="Nema ugovora" /></TableCell></TableRow>
                    ) : (
                      pagedContracts.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/30 transition-colors duration-150">
                          <TableCell className="font-medium">{c.number}</TableCell>
                          <TableCell>{c.title}</TableCell>
                          <TableCell className="text-muted-foreground">{resolveBuildingLabel(c.buildingId || c.building)}</TableCell>
                          <TableCell className="text-sm">{c.dateFrom || "-"} - {c.dateTo || "-"}</TableCell>
                          <TableCell>{c.attachment ? <span className="flex max-w-[160px] items-center gap-1.5 text-sm text-muted-foreground"><Paperclip className="h-3.5 w-3.5 shrink-0" /><span className="truncate" title={c.attachment.fileName}>{c.attachment.fileName}</span></span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                          <TableCell><Badge variant={c.status === "active" ? "default" : c.status === "completed" || c.status === "archived" ? "secondary" : "outline"}>{contractStatusLabel[c.status] || c.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" onClick={() => openAttachment(c, false)} disabled={!c.attachment}><Eye className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" disabled={!c.attachment} onClick={() => openAttachment(c, true)}><Download className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="sm" className="min-w-[44px] min-h-[36px]" onClick={() => navigate(`/decisions/contract/${c.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {contractsLoading ? (
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2 pt-2">
                          <Skeleton className="h-9 w-full" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : contracts.length === 0 ? (
                  <EmptyState icon={FileText} title="Nema ugovora" />
                ) : (
                  pagedContracts.map((c) => (
                    <Card key={c.id} className="rounded-lg border p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{c.number}</p>
                          <Badge variant={c.status === "active" ? "default" : c.status === "completed" || c.status === "archived" ? "secondary" : "outline"}>
                            {contractStatusLabel[c.status] || c.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{resolveBuildingLabel(c.buildingId || c.building)}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{c.dateFrom || "-"} - {c.dateTo || "-"}</span>
                        </div>
                        {c.attachment ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={c.attachment.fileName}>
                              {c.attachment.fileName}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Dokument: —</p>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => openAttachment(c, false)}
                            disabled={!c.attachment}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Prikaži
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            disabled={!c.attachment}
                            onClick={() => openAttachment(c, true)}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Preuzmi
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-[36px]"
                            onClick={() => navigate(`/decisions/contract/${c.id}/edit`)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Uredi
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              {contracts.length > 0 && (
                <PaginationControls
                  currentPage={contractsSafePage}
                  totalPages={contractsTotalPages}
                  pageSize={contractsPageSize}
                  totalItems={contracts.length}
                  onPageChange={setContractsPage}
                  onPageSizeChange={(next) => {
                    setContractsPageSize(next);
                    setContractsPage(1);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Decisions;
